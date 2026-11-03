'use client'
import { useState } from 'react'
import type { PositionAccuracyBar } from '@/lib/stats'

export function PositionAccuracyChart({ positions }: { positions: PositionAccuracyBar[] }) {
  const [selectedPos, setSelectedPos] = useState<number | null>(null)
  const maxPct = Math.max(25, ...positions.map((item) => item.percentage))
  const focused = positions.find((item) => item.position === selectedPos) ?? null

  return (
    <div className="panel flex flex-col justify-between">
      <div className="panel-heading">
        <div>
          <h2>Accuracy by grid position</h2>
          <p className="stats-chart-Sub">
            {focused ? (
              <><strong>{focused.label}:</strong> {focused.hits} of {focused.attempts} hits ({focused.percentage}%)</>
            ) : (
              'Hover or tap a position to see exact hits out of attempts'
            )}
          </p>
        </div>
      </div>

      <div className="pos-chart" role="img" aria-label="Accuracy by grid position P1 to P10">
        {positions.map((item, index) => (
          <button
            type="button"
            key={item.position}
            className="stacked-col"
            data-active={selectedPos === item.position}
            title={`${item.label}: ${item.hits} / ${item.attempts} hits (${item.percentage}%)`}
            onMouseEnter={() => setSelectedPos(item.position)}
            onFocus={() => setSelectedPos(item.position)}
            onClick={() => setSelectedPos((prev) => (prev === item.position ? null : item.position))}
          >
            <span className="bar-value">{item.percentage}%</span>
            <span className="stacked-track">
              <span
                className="bar-fill"
                style={{
                  height: `${Math.max(item.percentage > 0 ? 5 : 0, (item.percentage / maxPct) * 100)}%`,
                  animationDelay: `${index * 45}ms`,
                }}
              />
            </span>
            <span className="bar-label">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
