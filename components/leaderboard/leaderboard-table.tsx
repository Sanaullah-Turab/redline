import Link from 'next/link'
import { Crown, Trophy } from 'lucide-react'
import type { RankedStanding } from '@/lib/stats'

function GapLabel({ row }: { row: RankedStanding }) {
  if (row.isLeader) return <small className="lb-gap lb-gap--leader">Leader</small>
  if (row.gap === 0) return <small className="lb-gap">Level</small>
  return <small className="lb-gap">-{row.gap}</small>
}

export function LeaderboardTable({ rows, meId }: { rows: RankedStanding[]; meId?: string }) {
  if (!rows.length) {
    return <div className="empty-grid"><Trophy /><p>No contenders yet. Create an account to take the first grid slot.</p></div>
  }
  const leaderPoints = rows[0].points
  return (
    <div className="leaderboard">
      <div className="lb-grid lb-head" aria-hidden="true">
        <span>POS</span>
        <span>PLAYER</span>
        <span className="lb-num">POINTS</span>
        <span className="lb-num">ACCURACY</span>
      </div>
      <ol>
        {rows.map((row, index) => {
          const share = leaderPoints > 0 ? Math.round((row.points / leaderPoints) * 100) : 0
          return (
            <li key={row.id}>
              <Link
                href={`/profile/${row.id}`}
                className="lb-grid lb-row rise"
                data-leader={row.isLeader}
                data-me={row.id === meId}
                data-rank={row.rank}
                style={{ '--i': Math.min(index, 12), '--share': `${share}%` } as React.CSSProperties}
              >
                <span className="lb-rank">{String(row.rank).padStart(2, '0')}</span>
                <span className="lb-player">
                  <span className="lb-name">
                    {row.isLeader && <Crown className="lb-crown" aria-label="Leader" />}
                    <b>{row.name}</b>
                    {row.id === meId && <span className="pill" data-tone="live">You</span>}
                  </span>
                  <small>{row.scored} scored {row.scored === 1 ? 'session' : 'sessions'}</small>
                </span>
                <span className="lb-num lb-points">
                  <strong>{row.points}</strong>
                  <GapLabel row={row} />
                </span>
                <span className="lb-num lb-accuracy">{row.accuracy}%</span>
              </Link>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
