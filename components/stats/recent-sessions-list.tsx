import type { RecentSessionItem } from '@/lib/stats'

export function RecentSessionsList({
  sessions,
  onSelectRound,
}: {
  sessions: RecentSessionItem[]
  onSelectRound?: (round: number) => void
}) {
  return (
    <div className="panel flex flex-col justify-between">
      <div className="panel-heading">
        <h2>Recent sessions</h2>
      </div>

      {sessions.length ? (
        <ul className="recent-sessions-list">
          {sessions.map((session) => (
            <li key={`${session.round}-${session.sessionType}`}>
              <button
                type="button"
                className="recent-session-row"
                onClick={() => onSelectRound?.(session.round)}
                title={`${session.raceName} · ${session.sessionName}: ${session.points} pts`}
              >
                <span className="recent-session-title">
                  <b>
                    R{session.round} {session.sessionName}
                  </b>
                </span>
                <span className="recent-session-pts">
                  {session.points} {session.points === 1 ? 'pt' : 'pts'}
                </span>
                <span
                  className="hit-strip"
                  aria-label={`${session.points} of 10 positions correct`}
                >
                  {session.markers.map((marker) => (
                    <span
                      key={marker.position}
                      className="hit-dot"
                      data-hit={marker.hit}
                      title={`P${marker.position}: picked ${marker.predictedCode}${marker.hit ? ' (Exact hit)' : ` (Actual: ${marker.actualCode})`}`}
                    />
                  ))}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Not enough data yet.</p>
      )}
    </div>
  )
}
