import { RaceCalendar, type CalendarRace } from '@/components/race-calendar'
import { SiteHeader } from '@/components/site-header'
import { getSchedule, isSprint, SEASON, sessionStart } from '@/lib/f1'
import { getSeasonRoundPodiums } from '@/lib/podiums'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Calendar' }

export default async function Page() {
  const [schedule, podiumMap, session] = await Promise.all([
    getSchedule(),
    getSeasonRoundPodiums(SEASON),
    getSession(),
  ])
  const now = new Date()
  const nextRaceRound = schedule.find((race) => sessionStart(race, 'race') >= now)?.round ?? null

  const races: CalendarRace[] = schedule.map((race) => {
    const past = sessionStart(race, 'race') < now
    const status = past ? 'finished' : race.round === nextRaceRound ? 'next' : 'upcoming'
    return {
      round: race.round,
      name: race.name,
      officialName: race.officialName ?? `FORMULA 1 ${race.name.toUpperCase()} ${SEASON}`,
      country: race.country,
      circuit: race.circuit,
      date: race.date,
      time: race.time,
      sprint: isSprint(race),
      status,
      podium: podiumMap.get(race.round) ?? [],
    }
  })

  return (
    <>
      <SiteHeader />
      <main>
        <section className="race-hero">
          <div className="racing-stripes" aria-hidden="true"><span /><span /><span /></div>
          <div className="relative mx-auto max-w-7xl px-4 py-12 lg:px-8">
            <p className="eyebrow">{SEASON} SEASON</p>
            <h1 className="mt-3 font-mono text-5xl font-black uppercase italic md:text-7xl">Calendar</h1>
            <p className="mt-4 max-w-xl text-muted-foreground">
              {schedule.length} rounds. Inspect weekend podiums, track the next race, and lock in your Top 10 predictions.
            </p>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
          {races.length ? (
            <RaceCalendar races={races} signedIn={!!session?.user} meId={session?.user?.id} />
          ) : (
            <div className="empty-grid">
              <p>The official {SEASON} schedule is not available yet.</p>
            </div>
          )}
        </section>
      </main>
    </>
  )
}
