import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { predictions } from '@/lib/db/schema'
import { type SessionType } from '@/lib/f1'
import { SCORABLE, scoreRound } from '@/lib/scoring'
import { and, eq, inArray } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const sessions = await db.selectDistinct({ season: predictions.season, round: predictions.round, type: predictions.sessionType }).from(predictions).where(and(eq(predictions.scored, false), inArray(predictions.sessionType, SCORABLE)))
  const outcomes = await Promise.allSettled(sessions.map((session) => scoreRound(session.season, session.round, session.type as SessionType)))
  const scored = sessions.flatMap((session, i) => { const outcome = outcomes[i]; return outcome.status === 'fulfilled' && outcome.value.scored ? [{ ...session, entries: outcome.value.scored }] : [] })
  return NextResponse.json({ ok: true, scored })
}
