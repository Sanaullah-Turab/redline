import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { predictions, user } from '@/lib/db/schema'
import { SEASON } from '@/lib/f1'

export const MAX_POINTS_PER_SESSION = 10

export type Standing = { id: string; name: string; points: number; scored: number; picks: number; best: number; accuracy: number }

export async function getStandings(): Promise<Standing[]> {
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      points: sql<number>`coalesce(sum(${predictions.points}), 0)::int`,
      scored: sql<number>`count(*) filter (where ${predictions.scored})::int`,
      picks: sql<number>`count(${predictions.id})::int`,
      best: sql<number>`coalesce(max(${predictions.points}), 0)::int`,
    })
    .from(user)
    .leftJoin(predictions, and(eq(user.id, predictions.userId), eq(predictions.season, SEASON)))
    .groupBy(user.id, user.name)
    .orderBy(desc(sql`coalesce(sum(${predictions.points}), 0)`), user.name)
  return rows.map((row) => ({ ...row, accuracy: accuracy(row.points, row.scored) }))
}

export function accuracy(points: number, scored: number) {
  return scored ? Math.round((points / (scored * MAX_POINTS_PER_SESSION)) * 100) : 0
}
