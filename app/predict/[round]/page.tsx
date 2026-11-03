import { PredictionPicker } from '@/components/prediction/prediction-picker'
import { SiteHeader } from '@/components/site-header'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { predictions } from '@/lib/db/schema'
import { getDriverCatalog, getRoundDrivers } from '@/lib/drivers/round-drivers'
import { syncRoundDrivers } from '@/lib/drivers/sync'
import { formatRaceWeekend, getSchedule, isSprint, SEASON, sessionStart, type SessionType } from '@/lib/f1'
import { getShortcut } from '@/lib/reference'
import { and, eq } from 'drizzle-orm'
import { CalendarDays, MapPin, Zap } from 'lucide-react'
import { notFound, redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

const WEEKEND_LEAD_MS = 3 * 24 * 60 * 60 * 1000

export default async function Page({ params }: { params: Promise<{ round: string }> }) {
  const { round: raw } = await params
  const round = Number(raw)
  const session = await getSession()
  if (!session?.user) redirect('/sign-in')

  const [schedule, picks] = await Promise.all([
    getSchedule(),
    db.select().from(predictions).where(and(eq(predictions.userId, session.user.id), eq(predictions.season, SEASON), eq(predictions.round, round))),
  ])

  const event = schedule.find((race) => race.round === round)
  if (!event) notFound()

  const isSprintWeekend = isSprint(event)
  const now = new Date()
  const weekendOpen = now.getTime() >= new Date(`${event.date}T00:00:00Z`).getTime() - WEEKEND_LEAD_MS

  const [practice3, grid] = await Promise.all([
    getShortcut(SEASON, event, 'practice-3', now),
    getShortcut(SEASON, event, 'grid', now),
    weekendOpen ? syncRoundDrivers(SEASON, event) : undefined,
  ])
  const [drivers, catalog] = await Promise.all([getRoundDrivers(SEASON, round), getDriverCatalog(SEASON)])

  const types: SessionType[] = ['qualifying', 'race', 'sprint-qualifying', 'sprint']
  const initial = Object.fromEntries(types.map((type) => [type, picks.find((p) => p.sessionType === type)?.positions ?? []])) as Record<SessionType, string[]>
  const locked = Object.fromEntries(types.map((type) => {
    const start = sessionStart(event, type)
    const unavailable = (type === 'sprint' || type === 'sprint-qualifying') && !isSprintWeekend
    return [type, unavailable || Number.isNaN(start.getTime()) || now >= start]
  })) as Record<SessionType, boolean>

  return <>
    <SiteHeader />
    <main>
      <section className="race-hero">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 lg:px-8">
          <p className="eyebrow">ROUND {String(round).padStart(2, '0')} · 2026{isSprintWeekend && <span className="sprint-badge"><Zap aria-hidden="true" />SPRINT</span>}</p>
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="min-w-0">
              <h1 className="text-balance wrap-anywhere font-mono text-4xl font-black uppercase italic sm:text-5xl md:text-7xl">{event.name}</h1>
              <p className="mt-3 flex items-center gap-2 text-muted-foreground"><MapPin /> {event.circuit}, {event.locality}</p>
            </div>
            <p className="flex items-center gap-2 font-mono font-bold"><CalendarDays /> {formatRaceWeekend(event.date, { includeYear: true })}</p>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <PredictionPicker
          drivers={drivers}
          catalog={[...catalog.values()]}
          round={round}
          isSprintWeekend={isSprintWeekend}
          initial={initial}
          locked={locked}
          practice3={practice3}
          grid={grid}
        />
      </section>
    </main>
  </>
}
