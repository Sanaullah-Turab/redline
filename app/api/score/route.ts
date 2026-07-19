import { scoreRound } from '@/lib/scoring'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const secret = request.headers.get('authorization')
  if (process.env.CRON_SECRET && secret !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const round = Number(request.nextUrl.searchParams.get('round'))
  const type = request.nextUrl.searchParams.get('type') as 'qualifying' | 'race'
  if (!Number.isInteger(round) || !['qualifying', 'race'].includes(type)) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  return NextResponse.json(await scoreRound(round, type))
}
