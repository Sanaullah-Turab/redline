import Link from 'next/link'
import type { RankedStanding } from '@/lib/stats'

const PODIUM_ORDER = [1, 0, 2]

export function Podium({ rows }: { rows: RankedStanding[] }) {
  if (rows.length < 3) return null
  return (
    <div className="podium">
      {PODIUM_ORDER.map((index) => {
        const row = rows[index]
        return (
          <Link
            key={row.id}
            href={`/profile/${row.id}`}
            className="podium-step rise"
            data-place={row.rank}
            style={{ '--i': index + 1 } as React.CSSProperties}
          >
            <span className="place">{row.rank}</span>
            <b>{row.name}</b>
            <strong>{row.points} <small>pts</small></strong>
            <span className="podium-sub">{row.accuracy}% accuracy</span>
          </Link>
        )
      })}
    </div>
  )
}
