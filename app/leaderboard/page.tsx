import { headers } from 'next/headers'
import { LeaderboardTable } from '@/components/leaderboard/leaderboard-table'
import { Podium } from '@/components/leaderboard/podium'
import { SiteHeader } from '@/components/site-header'
import { auth } from '@/lib/auth'
import { getStandings, rankStandings } from '@/lib/stats'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Leaderboard' }

export default async function Page() {
  const [standings, session] = await Promise.all([getStandings(), auth.api.getSession({ headers: await headers() })])
  const rows = rankStandings(standings)

  return (
    <>
      <SiteHeader />
      <main>
        <section className="race-hero">
          <div className="racing-stripes" aria-hidden="true"><span /><span /><span /></div>
          <div className="relative mx-auto max-w-7xl px-4 py-12 lg:px-8">
            <p className="eyebrow">REDLINE WORLD CHAMPIONSHIP</p>
            <h1 className="mt-3 font-mono text-5xl font-black uppercase italic md:text-7xl">Leaderboard</h1>
            <p className="mt-4 max-w-xl text-muted-foreground">One exact position equals one point. The highest total after the final race takes the title.</p>
          </div>
        </section>
        <section className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
          <Podium rows={rows} />
          <LeaderboardTable rows={rows} meId={session?.user.id} />
        </section>
      </main>
    </>
  )
}
