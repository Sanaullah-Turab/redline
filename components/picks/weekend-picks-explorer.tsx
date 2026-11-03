'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, CheckCircle2, Clock, History, Sparkles, Zap } from 'lucide-react'
import type { SessionType } from '@/lib/f1'
import type { WeekendPicksGroup, WeekendSessionPicks } from '@/lib/stats'

type SessionFilter = 'all' | SessionType

const SESSION_FILTERS: { id: SessionFilter; label: string }[] = [
  { id: 'all', label: 'All sessions' },
  { id: 'race', label: 'Race' },
  { id: 'qualifying', label: 'Qualifying' },
  { id: 'sprint', label: 'Sprint' },
  { id: 'sprint-qualifying', label: 'Sprint Qualifying' },
]

export function WeekendPicksExplorer({
  weekends,
  focusedRound = null,
  heading = 'Weekend picks archive',
  eyebrow = 'SESSION BY SESSION TELEMETRY',
}: {
  weekends: WeekendPicksGroup[]
  focusedRound?: number | null
  heading?: string
  eyebrow?: string
}) {
  const [selectedRound, setSelectedRound] = useState<number | 'all'>(focusedRound ?? (weekends[0]?.round ?? 'all'))
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
          <Link href="/calendar" className="button-primary">Browse calendar <ArrowRight /></Link>
        </div>
      </div>
    )
  }

  const visibleWeekends = weekends
    .filter((weekend) => selectedRound === 'all' || weekend.round === selectedRound)
    .map((weekend) => ({
      ...weekend,
      sessions: weekend.sessions.filter((session) => sessionFilter === 'all' || session.sessionType === sessionFilter),
    }))
    .filter((weekend) => weekend.sessions.length > 0)

  return (
    <div className="picks-explorer" id="weekend-picks">
      <div className="picks-explorer-head">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="font-mono text-3xl font-black uppercase italic md:text-4xl">{heading}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Inspect every Qualifying, Race, Sprint Qualifying, and Sprint prediction with exact hits highlighted.
          </p>
        </div>
        <div className="picks-legend">
          <span className="picks-legend-item" data-tone="exact"><CheckCircle2 /> Exact position (+1 pt)</span>
          <span className="picks-legend-item" data-tone="near"><Sparkles /> Top 10 finish (0 pts)</span>
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
            <span>All weekends</span>
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
                R{String(weekend.round).padStart(2, '0')}
                {weekend.isSprintWeekend && <Zap className="inline size-3 text-amber-400 ml-1" aria-label="Sprint weekend" />}
              </span>
              <small>{weekend.scoredSessionsCount > 0 ? `${weekend.totalPoints} pts` : 'Pending'}</small>
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
        <div className="flex flex-col gap-6">
          {visibleWeekends.map((weekend) => (
            <article key={weekend.round} className="weekend-picks-card rise">
              <header className="weekend-picks-header">
                <div>
                  <p className="eyebrow">
                    ROUND {String(weekend.round).padStart(2, '0')} · {weekend.country.toUpperCase()}
                    {weekend.isSprintWeekend && (
                      <span className="sprint-badge"><Zap aria-hidden="true" />SPRINT</span>
                    )}
                  </p>
                  <h3>{weekend.raceName}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{weekend.circuit} · {weekend.dateLabel}</p>
                </div>
                <div className="weekend-picks-score">
                  <span>WEEKEND SCORE</span>
                  <strong>
                    {weekend.totalPoints}
                    {weekend.maxPossiblePoints > 0 && <small> / {weekend.maxPossiblePoints} pts</small>}
                  </strong>
                </div>
              </header>

              <div className="weekend-sessions-grid">
                {weekend.sessions.map((session) => (
                  <SessionPicksCard key={session.sessionType} round={weekend.round} session={session} />
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
        <div className="flex items-center gap-2">
          {session.isSprint && <Zap className="size-4 text-amber-400" aria-hidden="true" />}
          <h4>{session.sessionName}</h4>
          <span className="pill" data-tone={session.scored ? 'scored' : 'live'}>
            {session.scored ? 'Scored' : 'Pending'}
          </span>
        </div>
        <div className="session-picks-pts">
          {session.scored ? (
            <strong>{session.points} <span>/ 10 pts</span></strong>
          ) : (
            <Link href={`/predict/${round}`} className="text-xs font-bold text-primary hover:underline">
              Edit / View
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
              <span className="pick-num">{row.predictedNumber}</span>
              <span className="pick-driver">
                <b>
                  <span className="pick-code">{row.predictedCode}</span>
                  <span>{row.predictedName}</span>
                </b>
                {row.isReplacement && <small className="text-amber-400">Replacement</small>}
              </span>
              <span className="pick-outcome">
                {state === 'exact' && (
                  <span className="pick-badge pick-badge--exact">
                    <CheckCircle2 aria-hidden="true" /> +1 PT
                  </span>
                )}
                {state === 'near' && (
                  <span className="pick-badge pick-badge--near" title={`Finished P${row.finishedPosition}; actual P${row.position} was ${row.actualName ?? row.actualCode}`}>
                    P{row.finishedPosition} finish · Act: {row.actualCode}
                  </span>
                )}
                {state === 'miss' && (
                  <span className="pick-badge pick-badge--miss" title={row.actualName ? `Actual P${row.position}: ${row.actualName}` : undefined}>
                    {row.actualCode ? `Act: ${row.actualCode}` : 'Miss'}
                  </span>
                )}
                {state === 'pending' && (
                  <span className="pick-badge pick-badge--pending">
                    <Clock aria-hidden="true" /> Picked
                  </span>
                )}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
