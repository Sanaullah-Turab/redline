import Link from 'next/link'
import type { HeadToHeadRow } from '@/lib/stats'

export function HeadToHeadPanel({ rows }: { rows: HeadToHeadRow[] }) {
  return (
    <div className="panel">
      <div className="panel-heading">
        <div>
          <h2>Head to head (rounds won / lost / tied)</h2>
          <p className="stats-chart-Sub">Round-by-round total points comparison against rival contenders</p>
        </div>
      </div>

      {rows.length ? (
        <ul className="h2h-list">
          {rows.map((row) => {
            const total = Math.max(1, row.total)
            const wonPct = (row.won / total) * 100
            const tiedPct = (row.tied / total) * 100
            const lostPct = (row.lost / total) * 100
            return (
              <li key={row.rivalId} className="h2h-row">
                <Link href={`/profile/${row.rivalId}`} className="h2h-rival">
                  <b>vs {row.rivalName}</b>
                  <small>Rank #{row.rivalRank}</small>
                </Link>
                <div className="h2h-bar" role="img" aria-label={`vs ${row.rivalName}: Won ${row.won}, Tied ${row.tied}, Lost ${row.lost}`}>
                  {wonPct > 0 && <span className="h2h-seg h2h-seg--win" style={{ width: `${wonPct}%` }} />}
                  {tiedPct > 0 && <span className="h2h-seg h2h-seg--tie" style={{ width: `${tiedPct}%` }} />}
                  {lostPct > 0 && <span className="h2h-seg h2h-seg--loss" style={{ width: `${lostPct}%` }} />}
                </div>
                <div className="h2h-counts">
                  <span className="h2h-tag h2h-tag--win">Won <b>{row.won}</b></span>
                  <span className="h2h-tag h2h-tag--loss">Lost <b>{row.lost}</b></span>
                  <span className="h2h-tag h2h-tag--tie">Tied <b>{row.tied}</b></span>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-muted-foreground">Not enough rival data yet.</p>
      )}
    </div>
  )
}
