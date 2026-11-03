import Link from 'next/link'
import { BarChart3 } from 'lucide-react'
import { BarChart } from '@/components/bar-chart'
import { StatCard } from '@/components/stat-card'

export type WholeGridData = {
  players: number
  completedRounds: number
  totalRounds: number
  sprintRounds: number
  entries: number
  scored: number
  average: number
  rounds: { round: number; points: number }[]
  sharpest: { id: string; name: string; accuracy: number }[]
  bestSingle: { id: string; name: string; best: number }[]
}

export function WholeGridView({ data }: { data: WholeGridData }) {
  return (
    <div className="flex flex-col gap-10">
      <div className="stat-grid">
        <StatCard index={0} label="Players" value={data.players} />
        <StatCard index={1} label="Rounds done" value={data.completedRounds} hint={`of ${data.totalRounds || '-'} · ${data.sprintRounds} sprint`} />
        <StatCard index={2} label="Predictions" value={data.entries} hint={`${data.scored} scored`} />
        <StatCard index={3} label="Avg score" value={data.average} hint="points per scored session" />
      </div>

      <div className="panel">
        <div className="panel-heading"><h2>Points scored per round</h2></div>
        {data.rounds.length ? (
          <BarChart data={data.rounds.map((r) => ({ label: `R${r.round}`, value: r.points }))} />
        ) : (
          <div className="empty-grid"><BarChart3 /><p>Charts appear once the first round is scored.</p></div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Ranking title="Sharpest predictors" rows={data.sharpest.map((r) => ({ id: r.id, name: r.name, value: `${r.accuracy}%` }))} />
        <Ranking title="Best single sessions" rows={data.bestSingle.map((r) => ({ id: r.id, name: r.name, value: `${r.best} pts` }))} />
      </div>
    </div>
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
                <span className="rank">{index + 1}</span>
                <b>{row.name}</b>
                <span className="pts">{row.value}</span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-muted-foreground">No scored sessions yet.</p>
      )}
    </div>
  )
}

