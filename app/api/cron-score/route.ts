import { NextRequest, NextResponse } from 'next/server'
import { getSchedule, isSprint, sessionStart } from '@/lib/f1'
import { scoreRound } from '@/lib/scoring'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const schedule = await getSchedule(); const now = new Date(); const scored: Array<{ round: number; type: string; entries: number }> = []
  for (const race of schedule) {
    const types = isSprint(race) ? (['sprint-qualifying', 'sprint', 'qualifying', 'race'] as const) : (['qualifying', 'race'] as const)
    for (const type of types) {
      if (sessionStart(race, type) < now) { const result = await scoreRound(race.round, type); if (result.scored) scored.push({ round: race.round, type, entries: result.scored }) }
    }
  }
  return NextResponse.json({ ok: true, scored })
}
