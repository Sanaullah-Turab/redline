import { cache } from 'react'
import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { predictions, user } from '@/lib/db/schema'
import { SEASON } from '@/lib/f1'

export const MAX_POINTS_PER_SESSION = 10

export type Standing = { id: string; name: string; points: number; scored: number; picks: number; best: number; accuracy: number }

export const getStandings = cache(async (): Promise<Standing[]> => {
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
})

export type RankedStanding = Standing & { rank: number; gap: number; isLeader: boolean }

export function rankStandings(rows: Standing[]): RankedStanding[] {
  const leaderPoints = rows[0]?.points ?? 0
  let rank = 0
  return rows.map((row, index) => {
    if (index === 0 || row.points !== rows[index - 1].points) rank = index + 1
    return { ...row, rank, gap: leaderPoints - row.points, isLeader: rank === 1 && row.points > 0 }
  })
}

export function accuracy(points: number, scored: number) {
  return scored ? Math.round((points / (scored * MAX_POINTS_PER_SESSION)) * 100) : 0
}
