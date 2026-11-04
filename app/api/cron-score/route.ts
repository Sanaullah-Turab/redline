import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { predictions } from '@/lib/db/schema'
import { getSchedule, type Race, type SessionType } from '@/lib/f1'
import { SCORABLE, scoreRound } from '@/lib/scoring'
import { and, eq, inArray } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const sessions = await db.selectDistinct({ season: predictions.season, round: predictions.round, type: predictions.sessionType }).from(predictions).where(and(eq(predictions.scored, false), inArray(predictions.sessionType, SCORABLE)))
    const distinctSeasons = Array.from(new Set(sessions.map((s) => s.season)))
    const schedules = new Map<number, Race[]>()
    await Promise.all(
      distinctSeasons.map(async (season) => {
        schedules.set(season, await getSchedule(season))
      })
    )
    const rounds = new Map<string, typeof sessions>()
    for (const session of sessions) {
      const key = `${session.season}:${session.round}`
      rounds.set(key, [...(rounds.get(key) ?? []), session])
    }
    const settled = new Map<(typeof sessions)[number], PromiseSettledResult<Awaited<ReturnType<typeof scoreRound>>>>()
    await Promise.all(
      Array.from(rounds.values()).map(async (group) => {
        for (const session of group) {
          const [outcome] = await Promise.allSettled([scoreRound(session.season, session.round, session.type as SessionType, schedules.get(session.season))])
          settled.set(session, outcome)
        }
      })
    )
    const outcomes = sessions.map((session) => settled.get(session)!)
    const scored: Array<{ season: number; round: number; type: string; entries: number }> = []
    const pending: Array<{ season: number; round: number; type: string; reason: string }> = []
    const errors: Array<{ season: number; round: number; type: string; error: string }> = []
    for (let i = 0; i < sessions.length; i++) {
      const session = sessions[i]
      const outcome = outcomes[i]
      if (outcome.status === 'rejected') {
        errors.push({ ...session, error: outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason) })
      } else if (outcome.value.status === 'scored') {
        scored.push({ ...session, entries: outcome.value.scored })
      } else if (outcome.value.status === 'pending') {
        pending.push({ ...session, reason: outcome.value.reason })
      } else if (outcome.value.status === 'error') {
        errors.push({ ...session, error: outcome.value.error })
      }
    }
    return NextResponse.json({ ok: true, scored, pending, errors })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? 'Internal server error' }, { status: 500 })
  }
}
