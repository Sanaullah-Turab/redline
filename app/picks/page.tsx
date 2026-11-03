import Link from 'next/link'
import { ArrowRight, LockKeyhole } from 'lucide-react'
import { WeekendPicksExplorer } from '@/components/picks/weekend-picks-explorer'
import { SiteHeader } from '@/components/site-header'
import { getSession } from '@/lib/session'
import { getUserWeekendPicks } from '@/lib/stats'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'My Picks' }

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ round?: string }>
}) {
  const [session, params] = await Promise.all([getSession(), searchParams])
  const userId = session?.user?.id
  const focusedRound = params.round ? Number(params.round) : null
  const weekends = userId ? await getUserWeekendPicks(userId) : []

  return (
    <>
      <SiteHeader />
      <main>
        <section className="race-hero">
          <div className="racing-stripes" aria-hidden="true"><span /><span /><span /></div>
          <div className="relative mx-auto max-w-7xl px-4 py-12 lg:px-8">
            <p className="eyebrow">PREDICTION ARCHIVE</p>
            <h1 className="mt-3 font-mono text-5xl font-black uppercase italic md:text-7xl">My Picks</h1>
            <p className="mt-4 max-w-xl text-muted-foreground">
              Review your Top 10 calls for every Sprint Qualifying, Sprint, Qualifying, and Grand Prix Race with exact hits highlighted.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
          {!userId ? (
            <div className="empty-grid">
              <LockKeyhole />
              <p>Sign in to inspect your weekend-by-weekend predictions and scored hits.</p>
              <Link href="/sign-in" className="button-primary">Sign in <ArrowRight /></Link>
            </div>
          ) : (
            <WeekendPicksExplorer
              weekends={weekends}
              focusedRound={Number.isInteger(focusedRound) ? focusedRound : null}
              heading="All weekend predictions"
              eyebrow="SPRINT QUALIFYING · SPRINT · QUALIFYING · RACE"
            />
          )}
        </section>
      </main>
    </>
  )
}

