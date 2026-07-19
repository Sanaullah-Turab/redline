import { db } from '@/lib/db'
import { eventResults, predictions } from '@/lib/db/schema'
import { getOfficialResults, SEASON } from '@/lib/f1'
import { and, eq } from 'drizzle-orm'

export async function scoreRound(round: number, type: 'qualifying' | 'race') {
  const official = await getOfficialResults(round, type)
  if (official.length !== 10) return { scored: 0, message: 'Official top 10 is not available yet' }
  await db.insert(eventResults).values({ season: SEASON, round, sessionType: type, positions: official }).onConflictDoUpdate({ target: [eventResults.season, eventResults.round, eventResults.sessionType], set: { positions: official, fetchedAt: new Date() } })
  const entries = await db.select().from(predictions).where(and(eq(predictions.season, SEASON), eq(predictions.round, round), eq(predictions.sessionType, type)))
  for (const entry of entries) {
    const points = entry.positions.reduce((total, driver, index) => total + (official[index] === driver ? 1 : 0), 0)
    await db.update(predictions).set({ points, scored: true, updatedAt: new Date() }).where(eq(predictions.id, entry.id))
  }
  return { scored: entries.length, message: 'Scoring complete' }
}
