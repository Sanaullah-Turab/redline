import { headers } from 'next/headers'
import { RaceCalendar } from '@/components/race-calendar'
import { SiteHeader } from '@/components/site-header'
import { auth } from '@/lib/auth'
import { getSchedule, isSprint, SEASON, sessionStart } from '@/lib/f1'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Calendar' }

export default async function Page() {
  const [schedule, session] = await Promise.all([getSchedule(), auth.api.getSession({ headers: await headers() })])
  const now = new Date()
  const races = schedule.map((race) => ({
    round: race.round,
    name: race.name,
    country: race.country,
    circuit: race.circuit,
    date: race.date,
    sprint: isSprint(race),
    past: sessionStart(race, 'race') < now,
  }))

  return (
    <>
      <SiteHeader />
      <main>
        <section className="race-hero">
          <div className="racing-stripes" aria-hidden="true"><span /><span /><span /></div>
          <div className="relative mx-auto max-w-7xl px-4 py-12 lg:px-8">
            <p className="eyebrow">{SEASON} SEASON</p>
            <h1 className="mt-3 font-mono text-5xl font-black uppercase italic md:text-7xl">Calendar</h1>
            <p className="mt-4 max-w-xl text-muted-foreground">{schedule.length} rounds. Filter by status, find a circuit, and lock in your picks.</p>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
          {races.length ? <RaceCalendar races={races} signedIn={!!session?.user} /> : <div className="empty-grid"><p>The official {SEASON} schedule is not available yet.</p></div>}
        </section>
      </main>
    </>
  )
}
