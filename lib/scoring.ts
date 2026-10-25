import { db } from '@/lib/db'
import { eventResults, predictions } from '@/lib/db/schema'
import { areDriversEquivalent, normalizeDriverId } from '@/lib/driver-mapping'
import { getOfficialResults, getSchedule, sessionStart, type Race, type SessionType } from '@/lib/f1'
import { and, eq } from 'drizzle-orm'

export const SCORABLE: SessionType[] = ['qualifying', 'race', 'sprint', 'sprint-qualifying']

export type ScoreResult =
  | { status: 'scored'; scored: number; message: string }
  | { status: 'pending'; reason: string }
  | { status: 'error'; error: string }

export async function scoreRound(season: number, round: number, type: SessionType, schedule?: Race[]): Promise<ScoreResult> {
  if (!SCORABLE.includes(type)) return { status: 'pending', reason: `No official results source for session type '${type}'` }
  const entries = await db.select().from(predictions).where(and(eq(predictions.season, season), eq(predictions.round, round), eq(predictions.sessionType, type), eq(predictions.scored, false)))
  if (entries.length === 0) return { status: 'scored', scored: 0, message: 'No unscored predictions' }

  let raceEvent: Race | undefined
  const sched = schedule ?? await getSchedule(season)
  if (sched.length > 0) {
    raceEvent = sched.find((r) => r.round === round)
    if (!raceEvent) return { status: 'pending', reason: 'Round not in schedule' }
    if (type === 'sprint' && !raceEvent.sprintDate) return { status: 'pending', reason: 'Session not in schedule' }
    if (type === 'sprint-qualifying' && !raceEvent.sprintQualifyingDate) return { status: 'pending', reason: 'Session not in schedule' }
    if (type === 'qualifying' && !raceEvent.qualifyingDate) return { status: 'pending', reason: 'Session not in schedule' }
    if (type === 'race' && !raceEvent.date) return { status: 'pending', reason: 'Session not in schedule' }
    const start = sessionStart(raceEvent, type)
    if (start && !Number.isNaN(start.getTime()) && Date.now() < start.getTime()) {
      return { status: 'pending', reason: 'Session has not started yet' }
    }
  }

  const officialOutcome = await getOfficialResults(season, round, type, raceEvent)
  if (!officialOutcome.result || officialOutcome.result.positions.length !== 10) {
    return { status: 'pending', reason: officialOutcome.pendingReason || 'Official top 10 is not available yet' }
  }
  const official = officialOutcome.result

  const referencedDrivers = new Set(entries.flatMap((e) => e.positions.map(normalizeDriverId)))
  const isFullClassification = official.allClassified.length >= 20
  const hasEveryReferencedDriver = Array.from(referencedDrivers).every((d) => official.allClassified.some((c) => areDriversEquivalent(c, d)))
  if (!isFullClassification && !hasEveryReferencedDriver) {
    return { status: 'pending', reason: 'Classification is incomplete' }
  }

  let scoredCount = 0
  await db.transaction(async (tx) => {
    await tx.insert(eventResults).values({ season, round, sessionType: type, positions: official.positions }).onConflictDoUpdate({ target: [eventResults.season, eventResults.round, eventResults.sessionType], set: { positions: official.positions, fetchedAt: new Date() } })
    for (const entry of entries) {
      const points = type === 'sprint-qualifying' ? 0 : entry.positions.reduce((total, driver, index) => total + (areDriversEquivalent(official.positions[index], driver) ? 1 : 0), 0)
      const res = await tx.update(predictions).set({ points, scored: true, updatedAt: new Date() }).where(and(eq(predictions.id, entry.id), eq(predictions.scored, false))).returning({ id: predictions.id })
      if (res.length > 0) scoredCount++
    }
  })
  return { status: 'scored', scored: scoredCount, message: 'Scoring complete' }
}
