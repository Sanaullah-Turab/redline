import Link from 'next/link'
import { and, eq, sql } from 'drizzle-orm'
import { ArrowRight, CalendarDays, CheckCircle2, Flag, MapPin, Trophy, Zap } from 'lucide-react'
import { CalendarCard } from '@/components/calendar/calendar-card'
import { Countdown } from '@/components/countdown'
import { SiteHeader } from '@/components/site-header'
import { db } from '@/lib/db'
import { predictions } from '@/lib/db/schema'
import { formatRaceWeekend, getSchedule, isSprint, nextSession, SEASON, sessionLabel, sessionStart } from '@/lib/f1'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const [schedule, session, userStats] = await Promise.all([
    getSchedule(),
    getSession(),
    getSession().then(async (sess) => {
      if (!sess?.user) return null
      const [row] = await db
        .select({
          points: sql<number>`coalesce(sum(${predictions.points}), 0)::int`,
          picks: sql<number>`count(*)::int`,
        })
        .from(predictions)
        .where(and(eq(predictions.userId, sess.user.id), eq(predictions.season, SEASON)))
      return row ?? null
    }),
  ])
  const now = new Date()
  const upcoming = schedule.find((race) => sessionStart(race, 'race') > now) ?? schedule.at(-1)
  const completed = schedule.filter((race) => sessionStart(race, 'race') < now).length
  const sprintRounds = schedule.filter(isSprint).length

  const myPoints = userStats?.points ?? 0
  const myPicks = userStats?.picks ?? 0

  const preview = schedule.filter((race) => sessionStart(race, 'race') >= now).slice(0, 6)
  const upcomingSession = upcoming ? nextSession(upcoming, now) : undefined
  const upcomingIsSprint = upcoming ? isSprint(upcoming) : false

  return (
    <>
      <SiteHeader />
      <main>
        <section className="home-hero">
          <div className="racing-stripes" aria-hidden="true"><span /><span /><span /></div>
          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-[1.2fr_.8fr] lg:px-8 lg:py-20">
            <div className="flex flex-col items-start gap-6">
              <p className="eyebrow">THE {SEASON} PREDICTION CHAMPIONSHIP</p>
              <h1 className="text-balance font-mono text-6xl font-black uppercase italic leading-none md:text-8xl">
                Call the grid.<br />
                <span className="text-primary">Own the season.</span>
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
                Predict the top 10 in qualifying and the race{sprintRounds > 0 ? ', plus sprint qualifying and sprint' : ''}. Score a point for every exact position and fight your way to the top.
              </p>
              <div className="flex flex-wrap gap-3">
                {upcoming && (
                  <Link href={session?.user ? `/predict/${upcoming.round}` : '/sign-up'} className="button-primary h-12">
                    Make your picks <ArrowRight />
                  </Link>
                )}
                <Link href="/leaderboard" className="button-secondary h-12">
                  <Trophy /> View standings
                </Link>
              </div>
            </div>

            <div className="hero-panel rise" style={{ '--i': 3 } as React.CSSProperties}>
              <span className="hero-round" aria-hidden="true">R{String(upcoming?.round ?? 1).padStart(2, '0')}</span>
              {upcoming && <p className="font-mono text-2xl font-black uppercase italic">{upcoming.name}</p>}
              {upcomingSession ? (
                <Countdown target={upcomingSession.start.toISOString()} label={`${sessionLabel(upcomingSession.type)} starts in`} />
              ) : (
                <p className="text-muted-foreground">Season complete. Thanks for racing.</p>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
          <div className="stats-strip">
            <div>
              <span>SEASON PROGRESS</span>
              <strong>{completed}<small> / {schedule.length || '-'} ROUNDS</small></strong>
            </div>
            <div>
              <span>YOUR POINTS</span>
              <strong>{session ? myPoints : '-'}</strong>
            </div>
            <div>
              <span>ENTRIES SAVED</span>
              <strong>{session ? myPicks : '-'}</strong>
            </div>
          </div>

          {upcoming && (
            <article className="next-race">
              <div className="race-kicker">
                <span>UP NEXT</span>
                <span>
                  ROUND {String(upcoming.round).padStart(2, '0')}
                  {upcomingIsSprint && <span className="sprint-badge"><Zap aria-hidden="true" />SPRINT</span>}
                </span>
              </div>
              <div className="grid gap-8 p-5 sm:p-6 md:grid-cols-[1fr_auto] md:p-10">
                <div className="min-w-0">
                  <p className="eyebrow">{upcoming.country.toUpperCase()}</p>
                  <h2 className="mt-2 wrap-anywhere font-mono text-4xl font-black uppercase italic md:text-6xl">
                    {upcoming.name}
                  </h2>
                  <p className="mt-4 flex items-center gap-2 text-white/90">
                    <MapPin /> {upcoming.circuit} · {upcoming.locality}
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-white/90">
                    <CalendarDays /> {formatRaceWeekend(upcoming.date, { includeYear: true, longMonth: true })}
                  </p>
                  {upcomingIsSprint && (
                    <p className="mt-3 flex items-center gap-2 text-sm font-bold" style={{ color: 'hsl(38,95%,50%)' }}>
                      <Zap aria-hidden="true" />Sprint weekend · 4 sessions to predict
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-start justify-between gap-6 md:items-end">
                  <span className="status-open"><CheckCircle2 /> Predictions open</span>
                  <Link href={session?.user ? `/predict/${upcoming.round}` : '/sign-in'} className="button-primary">
                    Enter predictions <ArrowRight />
                  </Link>
                </div>
              </div>
            </article>
          )}

          <div className="section-heading">
            <div>
              <p className="eyebrow">RACE CALENDAR</p>
              <h2>Next up</h2>
            </div>
            <Link href="/calendar" className="button-secondary">Full calendar <ArrowRight /></Link>
          </div>

          {schedule.length ? (
            <div className="f1-calendar-grid">
              {preview.map((race, index) => (
                <CalendarCard
                  key={race.round}
                  index={index}
                  signedIn={!!session?.user}
                  meId={session?.user?.id}
                  race={{
                    round: race.round,
                    name: race.name,
                    officialName: race.officialName ?? `FORMULA 1 ${race.name.toUpperCase()} ${SEASON}`,
                    country: race.country,
                    circuit: race.circuit,
                    date: race.date,
                    time: race.time,
                    sprint: isSprint(race),
                    status: index === 0 ? 'next' : 'upcoming',
                    podium: [],
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="empty-grid">
              <Flag />
              <p>The official {SEASON} schedule is not available from Jolpica yet. Redline will populate it automatically when published.</p>
            </div>
          )}
        </section>
      </main>
    </>
  )
}
