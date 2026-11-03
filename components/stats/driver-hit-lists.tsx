import type { DriverHitStat } from '@/lib/stats'

const MIN_DRIVER_PICKS = 3

export function DriverHitLists({
  mostCorrect,
  mostMissed,
}: {
  mostCorrect: DriverHitStat[]
  mostMissed: DriverHitStat[]
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <DriverStatPanel
        title="Most correct drivers"
        rows={mostCorrect}
        tone="correct"
      />
      <DriverStatPanel
        title="Most missed drivers"
        rows={mostMissed}
        tone="missed"
      />
    </div>
  )
}

function DriverStatPanel({
  title,
  rows,
  tone,
}: {
  title: string
  rows: DriverHitStat[]
  tone: 'correct' | 'missed'
}) {
  return (
    <div className="panel">
      <div className="panel-heading">
        <h2>{title}</h2>
      </div>

      {rows.length ? (
        <ol className="driver-stat-list">
          {rows.map((driver, index) => (
            <li key={driver.driverId} className="driver-stat-row" data-tone={tone}>
              <span className="rank">{index + 1}</span>
              <span className="driver-code-tag">{driver.code}</span>
              <span className="driver-stat-name">
                <b>{driver.name}</b>
                {driver.isReplacement && <span className="pill">Reserve</span>}
              </span>
              <span className="driver-stat-ratio">
                {driver.hits} / {driver.picked}
              </span>
              <strong className="driver-stat-pct">{driver.percentage}%</strong>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-muted-foreground">
          Not enough data yet (minimum {MIN_DRIVER_PICKS} picks per driver).
        </p>
      )}
    </div>
  )
}
