'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, History, Zap } from 'lucide-react'
import type { SessionType } from '@/lib/f1'
import type { WeekendPicksGroup, WeekendSessionPicks } from '@/lib/stats'

type SessionFilter = 'all' | SessionType

const SESSION_FILTERS: { id: SessionFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'race', label: 'Race' },
  { id: 'qualifying', label: 'Qualifying' },
  { id: 'sprint', label: 'Sprint' },
  { id: 'sprint-qualifying', label: 'Sprint Qualifying' },
]

export function WeekendPicksExplorer({
  weekends,
  focusedRound = null,
  heading = 'Weekend Picks',
  eyebrow = 'PREDICTION ARCHIVE',
}: {
  weekends: WeekendPicksGroup[]
  focusedRound?: number | null
  heading?: string
  eyebrow?: string
}) {
  const [selectedRound, setSelectedRound] = useState<number | 'all'>(
    focusedRound ?? (weekends[0]?.round ?? 'all')
  )
  const [sessionFilter, setSessionFilter] = useState<SessionFilter>('all')

  useEffect(() => {
    if (focusedRound != null && weekends.some((w) => w.round === focusedRound)) {
      setSelectedRound(focusedRound)
    }
  }, [focusedRound, weekends])

  if (!weekends.length) {
    return (
      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2>{heading}</h2>
          </div>
        </div>
        <div className="empty-grid">
          <History />
          <p>No predictions submitted yet. Lock in your top 10 for the next Grand Prix weekend.</p>
          <Link href="/calendar" className="button-primary">
            Browse calendar <ArrowRight />
          </Link>
        </div>
      </div>
    )
  }

  const visibleWeekends = weekends
    .filter((weekend) => selectedRound === 'all' || weekend.round === selectedRound)
    .map((weekend) => ({
      ...weekend,
      sessions: weekend.sessions.filter(
        (session) => sessionFilter === 'all' || session.sessionType === sessionFilter
      ),
    }))
    .filter((weekend) => weekend.sessions.length > 0)

  return (
    <div className="picks-explorer" id="weekend-picks">
      <div className="picks-explorer-head">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="picks-explorer-title">{heading}</h2>
        </div>

        <div className="picks-legend" aria-label="Prediction status colour legend">
          <span className="picks-legend-item">
            <i className="legend-dot legend-dot--exact" aria-hidden="true" />
            Exact position (+1 pt)
          </span>
          <span className="picks-legend-item">
            <i className="legend-dot legend-dot--near" aria-hidden="true" />
            In Top 10
          </span>
          <span className="picks-legend-item">
            <i className="legend-dot legend-dot--miss" aria-hidden="true" />
            Outside Top 10
          </span>
        </div>
      </div>

      <div className="picks-controls">
        <div className="picks-round-strip" role="tablist" aria-label="Select Grand Prix weekend">
          <button
            type="button"
            role="tab"
            aria-selected={selectedRound === 'all'}
            className="picks-round-pill"
            onClick={() => setSelectedRound('all')}
          >
            <span>All</span>
            <small>{weekends.length}</small>
          </button>
          {weekends.map((weekend) => (
            <button
              type="button"
              key={weekend.round}
              role="tab"
              aria-selected={selectedRound === weekend.round}
              className="picks-round-pill"
              onClick={() => setSelectedRound(weekend.round)}
            >
              <span>
                R{weekend.round}
                {weekend.isSprintWeekend && (
                  <Zap className="inline size-3 text-amber-400 ml-1" aria-label="Sprint weekend" />
                )}
              </span>
              <small>
                {weekend.scoredSessionsCount > 0 ? `${weekend.totalPoints} pts` : 'Pending'}
              </small>
            </button>
          ))}
        </div>

        <div className="picks-session-strip" role="tablist" aria-label="Filter by session type">
          {SESSION_FILTERS.map((filter) => (
            <button
              type="button"
              key={filter.id}
              role="tab"
              aria-selected={sessionFilter === filter.id}
              className="picks-session-btn"
              onClick={() => setSessionFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {visibleWeekends.length ? (
        <div className="flex flex-col gap-5">
          {visibleWeekends.map((weekend) => (
            <article key={weekend.round} className="weekend-picks-card rise">
              <header className="weekend-picks-header">
                <div className="min-w-0">
                  <div className="weekend-picks-meta">
                    <span>ROUND {weekend.round}</span>
                    <span>·</span>
                    <span>{weekend.country}</span>
                    <span>·</span>
                    <span>{weekend.dateLabel}</span>
                    {weekend.isSprintWeekend && (
                      <span className="f1-cal-sprint">
                        <Zap aria-hidden="true" /> SPRINT
                      </span>
                    )}
                  </div>
                  <h3>{weekend.raceName}</h3>
                </div>
                <div className="weekend-picks-score">
                  <span>Weekend Score</span>
                  <strong>
                    {weekend.totalPoints}
                    {weekend.maxPossiblePoints > 0 && (
                      <small> / {weekend.maxPossiblePoints}</small>
                    )}
                  </strong>
                </div>
              </header>

              <div className="weekend-sessions-grid">
                {weekend.sessions.map((session) => (
                  <SessionPicksCard
                    key={session.sessionType}
                    round={weekend.round}
                    session={session}
                  />
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-grid">
          <p>No predictions match that session filter for the selected weekend.</p>
        </div>
      )}
    </div>
  )
}

function SessionPicksCard({ round, session }: { round: number; session: WeekendSessionPicks }) {
  return (
    <div className="session-picks-panel" data-sprint={session.isSprint}>
      <div className="session-picks-head">
        <div className="session-picks-title">
          {session.isSprint && <Zap className="size-3.5 text-amber-400" aria-hidden="true" />}
          <h4>{session.sessionName}</h4>
          <span className="session-status-dot" data-scored={session.scored}>
            {session.scored ? 'Scored' : 'Pending'}
          </span>
        </div>
        <div className="session-picks-pts">
          {session.scored ? (
            <strong>
              {session.points} <span>/ 10 pts</span>
            </strong>
          ) : (
            <Link href={`/predict/${round}`} className="session-edit-link">
              Edit picks
            </Link>
          )}
        </div>
      </div>

      <ol className="session-picks-list">
        {session.rows.map((row) => {
          const state = !session.scored
            ? 'pending'
            : row.exactHit
              ? 'exact'
              : row.finishedPosition != null
                ? 'near'
                : 'miss'
          return (
            <li key={row.position} className="pick-row" data-state={state}>
              <span className="pick-pos">P{row.position}</span>
              <span className="pick-code">{row.predictedCode}</span>
              <span className="pick-driver">
                <b>{row.predictedName}</b>
                {row.isReplacement && <small className="pick-reserve">Reserve</small>}
              </span>
              <span className="pick-state-dot" aria-hidden="true" />
            </li>
          )
        })}
      </ol>
    </div>
  )
}
