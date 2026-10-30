import Link from 'next/link'
import { headers } from 'next/headers'
import { Trophy } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { auth } from '@/lib/auth'
import { getStandings } from '@/lib/stats'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Leaderboard' }

const PODIUM_ORDER = [1, 0, 2]

export default async function Page() {
  const [rows, session] = await Promise.all([getStandings(), auth.api.getSession({ headers: await headers() })])
  const podium = PODIUM_ORDER.map((index) => ({ place: index + 1, row: rows[index] })).filter((slot) => slot.row)
  const meId = session?.user.id

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
          {rows.length >= 3 && (
            <div className="podium">
              {podium.map(({ place, row }) => (
                <Link key={row.id} href={`/profile/${row.id}`} className="podium-step rise" data-place={place} style={{ '--i': place } as React.CSSProperties}>
                  <span className="place">P{place}</span>
                  <b>{row.name}</b>
                  <strong>{row.points}</strong>
                  <small className="text-muted-foreground">{row.accuracy}% accuracy</small>
                </Link>
              ))}
            </div>
          )}
          <div className="leaderboard">
            <div className="leaderboard-head">
              <span>POS</span>
              <span>PLAYER</span>
              <span className="hide-sm">ACCURACY</span>
              <span className="text-right">POINTS</span>
            </div>
            {rows.length ? rows.map((row, index) => (
              <Link href={`/profile/${row.id}`} className="leaderboard-row rise" data-me={row.id === meId} style={{ '--i': Math.min(index, 12) } as React.CSSProperties} key={row.id}>
                <span className="rank">{String(index + 1).padStart(2, '0')}</span>
                <span>
                  <b>{row.name}</b>
                  {row.id === meId && <span className="pill ml-2" data-tone="live">You</span>}
                  <small>{row.scored} scored {row.scored === 1 ? 'session' : 'sessions'}</small>
                </span>
                <span className="hide-sm font-mono font-bold">{row.accuracy}%</span>
                <strong>{row.points}</strong>
              </Link>
            )) : (
              <div className="empty-grid"><Trophy /><p>No contenders yet. Create an account to take the first grid slot.</p></div>
            )}
          </div>
        </section>
      </main>
    </>
  )
}
