import { db } from '@/lib/db'
import { eventResults, predictions } from '@/lib/db/schema'
import { areDriversEquivalent, normalizeDriverId } from '@/lib/driver-mapping'
import { getOfficialResults, type SessionType } from '@/lib/f1'
import { and, eq } from 'drizzle-orm'

export const SCORABLE: SessionType[] = ['qualifying', 'race', 'sprint']

export type ScoreResult =
  | { status: 'scored'; scored: number; message: string }
  | { status: 'pending'; reason: string }
  | { status: 'error'; error: string }

export async function scoreRound(season: number, round: number, type: SessionType): Promise<ScoreResult> {
  if (!SCORABLE.includes(type)) return { status: 'pending', reason: `No official results source for session type '${type}'` }
  const entries = await db.select().from(predictions).where(and(eq(predictions.season, season), eq(predictions.round, round), eq(predictions.sessionType, type), eq(predictions.scored, false)))
  if (entries.length === 0) return { status: 'scored', scored: 0, message: 'No unscored predictions' }

  const official = await getOfficialResults(season, round, type)
  if (!official || official.positions.length !== 10) {
    return { status: 'pending', reason: 'Official top 10 is not available yet' }
  }

  const referencedDrivers = new Set(entries.flatMap((e) => e.positions.map(normalizeDriverId)))
  const isFullClassification = official.allClassified.length >= 20
  const hasEveryReferencedDriver = Array.from(referencedDrivers).every((d) => official.allClassified.some((c) => areDriversEquivalent(c, d)))
  if (!isFullClassification && !hasEveryReferencedDriver) {
    return { status: 'pending', reason: 'Classification is incomplete' }
  }

  await db.insert(eventResults).values({ season, round, sessionType: type, positions: official.positions }).onConflictDoUpdate({ target: [eventResults.season, eventResults.round, eventResults.sessionType], set: { positions: official.positions, fetchedAt: new Date() } })
  for (const entry of entries) {
    const points = entry.positions.reduce((total, driver, index) => total + (areDriversEquivalent(official.positions[index], driver) ? 1 : 0), 0)
    await db.update(predictions).set({ points, scored: true, updatedAt: new Date() }).where(eq(predictions.id, entry.id))
  }
  return { status: 'scored', scored: entries.length, message: 'Scoring complete' }
}
