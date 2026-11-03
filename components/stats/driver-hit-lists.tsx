import { MIN_DRIVER_PICKS, type DriverHitStat } from '@/lib/stats'

export function DriverHitLists({
  mostCorrect,
  mostMissed,
}: {
  mostCorrect: DriverHitStat[]
  mostMissed: DriverHitStat[]
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <DriverStatPanel
        title="Most correct drivers"
        subtitle={`Drivers picked at least ${MIN_DRIVER_PICKS} times with highest accuracy`}
        rows={mostCorrect}
        tone="correct"
      />
      <DriverStatPanel
        title="Most missed drivers"
        subtitle={`Drivers picked at least ${MIN_DRIVER_PICKS} times with lowest accuracy`}
        rows={mostMissed}
        tone="missed"
      />
    </div>
  )
}

function DriverStatPanel({
  title,
  subtitle,
  rows,
  tone,
}: {
  title: string
  subtitle: string
  rows: DriverHitStat[]
  tone: 'correct' | 'missed'
}) {
  return (
    <div className="panel">
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          <p className="stats-chart-Sub">{subtitle}</p>
        </div>
      </div>

      {rows.length ? (
        <ol className="driver-stat-list">
          {rows.map((driver, index) => (
            <li key={driver.driverId} className="driver-stat-row" data-tone={tone}>
              <span className="rank">{String(index + 1).padStart(2, '0')}</span>
              <span className="driver-code-tag">{driver.code}</span>
              <span className="driver-stat-name">
                <b>{driver.name}</b>
                {driver.isReplacement && <span className="pill">Reserve</span>}
              </span>
              <span className="driver-stat-ratio">{driver.hits} / {driver.picked}</span>
              <strong className="driver-stat-pct">{driver.percentage}%</strong>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-muted-foreground">Not enough data yet (minimum {MIN_DRIVER_PICKS} picks per driver).</p>
      )}
    </div>
  )
}
