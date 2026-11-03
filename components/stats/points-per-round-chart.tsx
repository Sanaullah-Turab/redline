'use client'
import { useState } from 'react'
import { BarChart3 } from 'lucide-react'
import type { MyStatsRoundBar } from '@/lib/stats'

export function PointsPerRoundChart({ rounds, seasonGridAvg }: { rounds: MyStatsRoundBar[]; seasonGridAvg: number }) {
  const [showAll, setShowAll] = useState(false)
  const [activeRound, setActiveRound] = useState<number | null>(null)

  if (!rounds.length) {
    return (
      <div className="panel">
        <div className="panel-heading"><h2>Points per round</h2></div>
        <div className="empty-grid"><BarChart3 /><p>Not enough data yet.</p></div>
      </div>
    )
  }

  const visible = showAll ? rounds : rounds.slice(-10)
  const hasSprint = rounds.some((bar) => bar.sprint > 0)
  const avgLine = visible.length
    ? Math.round((visible.reduce((sum, bar) => sum + bar.gridAvg, 0) / visible.length) * 10) / 10
    : seasonGridAvg
  const maxVal = Math.max(10, avgLine + 1, ...visible.map((bar) => bar.total))
  const avgBottomPct = Math.min(96, Math.max(4, (avgLine / maxVal) * 100))
  const focused = visible.find((bar) => bar.round === activeRound) ?? null

  return (
    <div className="panel">
      <div className="panel-heading">
        <div>
          <h2>Points per round</h2>
          {focused ? (
            <p className="stats-chart-Sub">
              <strong>R{focused.round} · {focused.raceName}:</strong> {focused.total} pts (Qualifying {focused.qualifying} · Race {focused.race}
              {focused.sprint > 0 ? ` · Sprint ${focused.sprint}` : ''} · Grid avg {focused.gridAvg})
            </p>
          ) : (
            <p className="stats-chart-Sub">Hover or tap a round bar for session breakdown</p>
          )}
        </div>
        <div className="stats-legend-wrap">
          <div className="stats-legend" aria-label="Chart legend">
            <span><i className="swatch swatch--qual" />Qualifying</span>
            <span><i className="swatch swatch--race" />Race</span>
            {hasSprint && <span><i className="swatch swatch--sprint" />Sprint</span>}
            <span><i className="swatch swatch--avg" />Grid avg ({avgLine})</span>
          </div>
          {rounds.length > 10 && (
            <button type="button" className="button-secondary stats-range-btn" onClick={() => setShowAll((prev) => !prev)}>
              {showAll ? 'Last 10 rounds' : `Full season (${rounds.length})`}
            </button>
          )}
        </div>
      </div>

      <div className="stacked-chart" role="img" aria-label="Points scored per round">
        <div className="stacked-avg-line" style={{ bottom: `calc(1.6rem + (100% - 2.8rem) * ${avgBottomPct / 100})` }} aria-hidden="true" />
        {visible.map((bar, index) => {
          const totalPct = (bar.total / maxVal) * 100
          const qualShare = bar.total > 0 ? (bar.qualifying / bar.total) * 100 : 0
          const raceShare = bar.total > 0 ? (bar.race / bar.total) * 100 : 0
          const sprintShare = bar.total > 0 ? (bar.sprint / bar.total) * 100 : 0
          const isSelected = activeRound === bar.round
          const tip = `R${bar.round} ${bar.raceName}: ${bar.total} pts (Qualifying ${bar.qualifying}, Race ${bar.race}${bar.sprint ? `, Sprint ${bar.sprint}` : ''}, Grid avg ${bar.gridAvg})`
          return (
            <button
              type="button"
              key={bar.round}
              className="stacked-col"
              data-active={isSelected}
              title={tip}
              onMouseEnter={() => setActiveRound(bar.round)}
              onFocus={() => setActiveRound(bar.round)}
              onClick={() => setActiveRound((prev) => (prev === bar.round ? null : bar.round))}
            >
              <span className="bar-value">{bar.total}</span>
              <span className="stacked-track">
                <span className="stacked-bar" style={{ height: `${Math.max(bar.total > 0 ? 4 : 0, totalPct)}%`, animationDelay: `${index * 45}ms` }}>
                  {sprintShare > 0 && <span className="seg seg--sprint" style={{ height: `${sprintShare}%` }} />}
                  {raceShare > 0 && <span className="seg seg--race" style={{ height: `${raceShare}%` }} />}
                  {qualShare > 0 && <span className="seg seg--qual" style={{ height: `${qualShare}%` }} />}
                </span>
              </span>
              <span className="bar-label">R{bar.round}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
