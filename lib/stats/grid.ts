import { eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { predictions } from '@/lib/db/schema'
import { SEASON } from '@/lib/f1'

export async function getRoundTotals(): Promise<{ round: number; points: number; entries: number }[]> {
  return db
    .select({
      round: predictions.round,
      points: sql<number>`coalesce(sum(${predictions.points}), 0)::int`,
      entries: sql<number>`count(*)::int`,
    })
    .from(predictions)
    .where(eq(predictions.season, SEASON))
    .groupBy(predictions.round)
    .orderBy(predictions.round)
}
