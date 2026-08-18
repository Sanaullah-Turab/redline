import { scoreRound } from '@/lib/scoring'
import { type SessionType } from '@/lib/f1'
import { NextRequest, NextResponse } from 'next/server'

const VALID_TYPES: SessionType[] = ['qualifying', 'race', 'sprint-qualifying', 'sprint']

export async function GET(request: NextRequest) {
  const secret = request.headers.get('authorization')
  if (process.env.CRON_SECRET && secret !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const round = Number(request.nextUrl.searchParams.get('round'))
  const type = request.nextUrl.searchParams.get('type') as SessionType
  if (!Number.isInteger(round) || !VALID_TYPES.includes(type)) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  return NextResponse.json(await scoreRound(round, type))
}
