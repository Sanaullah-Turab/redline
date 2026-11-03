import { and, asc, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { predictions, roundPodiums, user } from '@/lib/db/schema'

export type RoundPodiumEntry = {
  userId: string
  name: string
  points: number
  position: number
}

export async function refreshRoundPodium(season: number, round: number): Promise<void> {
  const totals = await db
    .select({
      userId: predictions.userId,
      points: sql<number>`coalesce(sum(${predictions.points}), 0)::int`,
    })
    .from(predictions)
    .where(and(eq(predictions.season, season), eq(predictions.round, round), eq(predictions.scored, true)))
    .groupBy(predictions.userId)
    .orderBy(desc(sql`coalesce(sum(${predictions.points}), 0)`), asc(sql`min(${predictions.submittedAt})`), asc(predictions.userId))

  const top = totals.slice(0, 3)
  let currentRank = 0
  const values = top.map((row, index) => {
    if (index === 0 || row.points !== top[index - 1].points) {
      currentRank = index + 1
    }
    return {
      season,
      round,
      userId: row.userId,
      points: row.points,
      position: currentRank,
      computedAt: new Date(),
    }
  })

  await db.transaction(async (tx) => {
    await tx.delete(roundPodiums).where(and(eq(roundPodiums.season, season), eq(roundPodiums.round, round)))
    if (values.length > 0) {
      await tx.insert(roundPodiums).values(values)
    }
  })
}

export async function getSeasonRoundPodiums(season: number): Promise<Map<number, RoundPodiumEntry[]>> {
  const rows = await db
    .select({
      round: roundPodiums.round,
      userId: roundPodiums.userId,
      name: user.name,
      points: roundPodiums.points,
      position: roundPodiums.position,
    })
    .from(roundPodiums)
    .innerJoin(user, eq(roundPodiums.userId, user.id))
    .where(eq(roundPodiums.season, season))
    .orderBy(asc(roundPodiums.round), asc(roundPodiums.position), desc(roundPodiums.points), asc(user.name))

  const byRound = new Map<number, RoundPodiumEntry[]>()
  for (const row of rows) {
    const list = byRound.get(row.round) ?? []
    if (list.length < 3) {
      list.push({ userId: row.userId, name: row.name, points: row.points, position: row.position })
      byRound.set(row.round, list)
    }
  }
  return byRound
}
