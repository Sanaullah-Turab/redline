import Link from 'next/link'
import { BarChart3 } from 'lucide-react'
import { BarChart } from '@/components/bar-chart'
import { SiteHeader } from '@/components/site-header'
import { StatCard } from '@/components/stat-card'
import { getSchedule, isSprint, sessionStart } from '@/lib/f1'
import { getRoundTotals, getStandings } from '@/lib/stats'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Stats' }

export default async function Page() {
  const [standings, rounds, schedule] = await Promise.all([getStandings(), getRoundTotals(), getSchedule()])
  const now = new Date()
  const completed = schedule.filter((race) => sessionStart(race, 'race') < now).length
  const entries = standings.reduce((sum, row) => sum + row.picks, 0)
  const scored = standings.reduce((sum, row) => sum + row.scored, 0)
  const points = standings.reduce((sum, row) => sum + row.points, 0)
  const average = scored ? Math.round((points / scored) * 10) / 10 : 0
  const sharpest = standings.filter((row) => row.scored > 0).sort((a, b) => b.accuracy - a.accuracy).slice(0, 5)
  const bestSingle = standings.filter((row) => row.best > 0).sort((a, b) => b.best - a.best).slice(0, 5)

  return (
    <>
      <SiteHeader />
      <main>
        <section className="race-hero">
          <div className="racing-stripes" aria-hidden="true"><span /><span /><span /></div>
          <div className="relative mx-auto max-w-7xl px-4 py-12 lg:px-8">
            <p className="eyebrow">SEASON TELEMETRY</p>
            <h1 className="mt-3 font-mono text-5xl font-black uppercase italic md:text-7xl">Stats</h1>
            <p className="mt-4 max-w-xl text-muted-foreground">How the whole grid is performing across the season.</p>
          </div>
        </section>
        <section className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-10 lg:px-8">
          <div className="stat-grid">
            <StatCard index={0} label="Players" value={standings.length} />
            <StatCard index={1} label="Rounds done" value={completed} hint={`of ${schedule.length || '-'} · ${schedule.filter(isSprint).length} sprint`} />
            <StatCard index={2} label="Predictions" value={entries} hint={`${scored} scored`} />
            <StatCard index={3} label="Avg score" value={average} hint="points per scored session" />
          </div>

          <div className="panel">
            <div className="panel-heading"><h2>Points scored per round</h2></div>
            {rounds.length ? <BarChart data={rounds.map((r) => ({ label: `R${r.round}`, value: r.points }))} /> : <div className="empty-grid"><BarChart3 /><p>Charts appear once the first round is scored.</p></div>}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Ranking title="Sharpest predictors" rows={sharpest.map((r) => ({ id: r.id, name: r.name, value: `${r.accuracy}%` }))} />
            <Ranking title="Best single sessions" rows={bestSingle.map((r) => ({ id: r.id, name: r.name, value: `${r.best} pts` }))} />
          </div>
        </section>
      </main>
    </>
  )
}

function Ranking({ title, rows }: { title: string; rows: { id: string; name: string; value: string }[] }) {
  return (
    <div className="panel">
      <div className="panel-heading"><h2>{title}</h2></div>
      {rows.length ? (
        <ol className="flex flex-col">
          {rows.map((row, index) => (
            <li key={row.id}>
              <Link href={`/profile/${row.id}`} className="history-row">
                <span className="rank">{String(index + 1).padStart(2, '0')}</span>
                <b>{row.name}</b>
                <span className="pts">{row.value}</span>
              </Link>
            </li>
          ))}
        </ol>
      ) : <p className="text-muted-foreground">No scored sessions yet.</p>}
    </div>
  )
}
