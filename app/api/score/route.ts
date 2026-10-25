import { scoreRound } from '@/lib/scoring'
import { SEASON, type SessionType } from '@/lib/f1'
import { NextRequest, NextResponse } from 'next/server'

const VALID_TYPES: SessionType[] = ['qualifying', 'race', 'sprint-qualifying', 'sprint']

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const round = Number(request.nextUrl.searchParams.get('round'))
  const type = request.nextUrl.searchParams.get('type') as SessionType
  if (!Number.isInteger(round) || !VALID_TYPES.includes(type)) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  try {
    return NextResponse.json(await scoreRound(SEASON, round, type))
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal Server Error' }, { status: 500 })
  }
}
