import { desc, eq, sql } from 'drizzle-orm'
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
    .leftJoin(predictions, eq(user.id, predictions.userId))
    .groupBy(user.id, user.name)
    .orderBy(desc(sql`coalesce(sum(${predictions.points}), 0)`), user.name)
  return rows.map((row) => ({ ...row, accuracy: accuracy(row.points, row.scored) }))
}

export function accuracy(points: number, scored: number) {
  return scored ? Math.round((points / (scored * MAX_POINTS_PER_SESSION)) * 100) : 0
}

export type RoundPoints = { round: number; points: number }
export type SessionBreakdown = { sessionType: string; points: number; scored: number }

export type Profile = {
  id: string
  name: string
  joined: Date
  rank: number
  players: number
  points: number
  scored: number
  picks: number
  best: number
  average: number
  accuracy: number
  rounds: RoundPoints[]
  sessions: SessionBreakdown[]
  history: { round: number; sessionType: string; points: number; scored: boolean; positions: string[] }[]
}

export async function getProfile(id: string): Promise<Profile | null> {
  const [account] = await db.select({ id: user.id, name: user.name, joined: user.createdAt }).from(user).where(eq(user.id, id))
  if (!account) return null

  const [standings, rows] = await Promise.all([
    getStandings(),
    db.select().from(predictions).where(sql`${predictions.userId} = ${id} and ${predictions.season} = ${SEASON}`).orderBy(desc(predictions.round)),
  ])

  const scoredRows = rows.filter((row) => row.scored)
  const points = scoredRows.reduce((sum, row) => sum + row.points, 0)
  const byRound = new Map<number, number>()
  const bySession = new Map<string, SessionBreakdown>()
  for (const row of scoredRows) {
    byRound.set(row.round, (byRound.get(row.round) ?? 0) + row.points)
    const entry = bySession.get(row.sessionType) ?? { sessionType: row.sessionType, points: 0, scored: 0 }
    entry.points += row.points
    entry.scored += 1
    bySession.set(row.sessionType, entry)
  }

  return {
    id: account.id,
    name: account.name,
    joined: account.joined,
    rank: standings.findIndex((row) => row.id === id) + 1,
    players: standings.length,
    points,
    scored: scoredRows.length,
    picks: rows.length,
    best: scoredRows.reduce((max, row) => Math.max(max, row.points), 0),
    average: scoredRows.length ? Math.round((points / scoredRows.length) * 10) / 10 : 0,
    accuracy: accuracy(points, scoredRows.length),
    rounds: [...byRound].map(([round, pts]) => ({ round, points: pts })).sort((a, b) => a.round - b.round),
    sessions: [...bySession.values()],
    history: rows.map(({ round, sessionType, points: pts, scored, positions }) => ({ round, sessionType, points: pts, scored, positions })),
  }
}

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
