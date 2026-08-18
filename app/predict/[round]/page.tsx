import { PredictionPicker } from '@/components/prediction-picker'
import { SiteHeader } from '@/components/site-header'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { predictions } from '@/lib/db/schema'
import { getDrivers, getSchedule, isSprint, SEASON, sessionStart } from '@/lib/f1'
import { and, eq } from 'drizzle-orm'
import { CalendarDays, MapPin, Zap } from 'lucide-react'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: Promise<{ round: string }> }) {
  const { round: raw } = await params
  const round = Number(raw)
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const [schedule, drivers, picks] = await Promise.all([
    getSchedule(),
    getDrivers(),
    db.select().from(predictions).where(and(eq(predictions.userId, session.user.id), eq(predictions.season, SEASON), eq(predictions.round, round))),
  ])

  const event = schedule.find((race) => race.round === round)
  if (!event) notFound()

  const isSprintWeekend = isSprint(event)
  const now = new Date()

  const pick = (type: string) => picks.find((p) => p.sessionType === type)?.positions ?? []

  return <>
    <SiteHeader />
    <main>
      <section className="race-hero">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 lg:px-8">
          <p className="eyebrow">ROUND {String(round).padStart(2, '0')} · 2026{isSprintWeekend && <span className="sprint-badge"><Zap aria-hidden="true" />SPRINT</span>}</p>
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <h1 className="text-balance font-mono text-5xl font-black uppercase italic md:text-7xl">{event.name}</h1>
              <p className="mt-3 flex items-center gap-2 text-muted-foreground"><MapPin /> {event.circuit}, {event.locality}</p>
            </div>
            <p className="flex items-center gap-2 font-mono font-bold"><CalendarDays /> {new Date(`${event.date}T12:00:00Z`).toLocaleDateString('en', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })}</p>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <PredictionPicker
          drivers={drivers}
          round={round}
          isSprintWeekend={isSprintWeekend}
          initialQualifying={pick('qualifying')}
          initialRace={pick('race')}
          initialSprintQualifying={pick('sprint-qualifying')}
          initialSprint={pick('sprint')}
          qualLocked={now >= sessionStart(event, 'qualifying')}
          raceLocked={now >= sessionStart(event, 'race')}
          sprintQualLocked={!isSprintWeekend || now >= sessionStart(event, 'sprint-qualifying')}
          sprintLocked={!isSprintWeekend || now >= sessionStart(event, 'sprint')}
        />
      </section>
    </main>
  </>
}
