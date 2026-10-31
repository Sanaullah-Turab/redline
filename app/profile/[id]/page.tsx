import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, History } from 'lucide-react'
import { BarChart } from '@/components/bar-chart'
import { SiteHeader } from '@/components/site-header'
import { StatCard } from '@/components/stat-card'
import { sessionLabel, type SessionType } from '@/lib/f1'
import { getProfile, MAX_POINTS_PER_SESSION } from '@/lib/stats'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const profile = await getProfile(id)
  return { title: profile ? profile.name : 'Profile' }
}

export default async function Page({ params }: Props) {
  const { id } = await params
  const profile = await getProfile(id)
  if (!profile) notFound()

  const joined = profile.joined.toLocaleDateString('en', { month: 'short', year: 'numeric' })

  return (
    <>
      <SiteHeader />
      <main>
        <section className="race-hero">
          <div className="racing-stripes" aria-hidden="true"><span /><span /><span /></div>
          <div className="profile-hero relative mx-auto max-w-7xl px-4 py-12 lg:px-8">
            <div className="profile-avatar" aria-hidden="true">{profile.name.charAt(0).toUpperCase()}</div>
            <div className="min-w-0 flex-1">
              <p className="eyebrow">RANK {profile.rank} OF {profile.players} · JOINED {joined.toUpperCase()}</p>
              <h1 className="mt-2 wrap-anywhere font-mono text-4xl font-black uppercase italic sm:text-5xl md:text-7xl">{profile.name}</h1>
            </div>
          </div>
        </section>

        <section className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-10 lg:px-8">
          <div className="stat-grid">
            <StatCard index={0} label="Total points" value={profile.points} hint={`P${profile.rank} overall`} />
            <StatCard index={1} label="Accuracy" value={`${profile.accuracy}%`} hint={`of ${profile.scored * MAX_POINTS_PER_SESSION} possible`} />
            <StatCard index={2} label="Avg per session" value={profile.average} hint={`${profile.scored} scored`} />
            <StatCard index={3} label="Best session" value={profile.best} hint="highest single score" />
            <StatCard index={4} label="Entries" value={profile.picks} hint="predictions saved" />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.4fr_.6fr]">
            <div className="panel">
              <div className="panel-heading"><h2>Points by round</h2></div>
              {profile.rounds.length ? <BarChart data={profile.rounds.map((r) => ({ label: `R${r.round}`, value: r.points }))} /> : <div className="empty-grid"><History /><p>No scored rounds yet.</p></div>}
            </div>
            <div className="panel">
              <div className="panel-heading"><h2>By session</h2></div>
              <div className="flex flex-col gap-4">
                {profile.sessions.length ? profile.sessions.map((s) => {
                  const pct = Math.round((s.points / (s.scored * MAX_POINTS_PER_SESSION)) * 100)
                  return (
                    <div key={s.sessionType} className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-sm font-bold"><span>{sessionLabel(s.sessionType as SessionType) ?? s.sessionType}</span><span className="font-mono">{s.points} pts · {pct}%</span></div>
                      <div className="meter"><div style={{ width: `${pct}%` }} /></div>
                    </div>
                  )
                }) : <p className="text-muted-foreground">Nothing to show yet.</p>}
              </div>
            </div>
          </div>

          <div>
            <div className="section-heading" style={{ margin: '0 0 1rem' }}><div><p className="eyebrow">PREDICTION LOG</p><h2>History</h2></div></div>
            {profile.history.length ? profile.history.map((h) => (
              <div className="history-row" key={`${h.round}-${h.sessionType}`}>
                <span className="round">R{String(h.round).padStart(2, '0')}</span>
                <span className="flex flex-wrap items-center gap-2">
                  <b>{sessionLabel(h.sessionType as SessionType) ?? h.sessionType}</b>
                  <small className="text-muted-foreground">P1 {h.positions[0]?.toUpperCase() ?? '-'}</small>
                  <span className="pill" data-tone={h.scored ? undefined : 'live'}>{h.scored ? 'Scored' : 'Pending'}</span>
                </span>
                <span className="pts">{h.scored ? `${h.points} pts` : '-'}</span>
              </div>
            )) : <div className="empty-grid"><History /><p>No predictions yet.</p><Link href="/calendar" className="button-primary">Pick a race <ArrowRight /></Link></div>}
          </div>
        </section>
      </main>
    </>
  )
}
