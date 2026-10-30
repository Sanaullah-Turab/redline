'use client'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowRight, LockKeyhole, Zap } from 'lucide-react'

export type CalendarRace = { round: number; name: string; country: string; circuit: string; date: string; sprint: boolean; past: boolean }

const filters = ['all', 'upcoming', 'completed', 'sprint'] as const
type Filter = (typeof filters)[number]

export function RaceCalendar({ races, signedIn }: { races: CalendarRace[]; signedIn: boolean }) {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return races.filter((race) => {
      if (filter === 'upcoming' && race.past) return false
      if (filter === 'completed' && !race.past) return false
      if (filter === 'sprint' && !race.sprint) return false
      return !q || `${race.name} ${race.country} ${race.circuit}`.toLowerCase().includes(q)
    })
  }, [races, filter, query])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="session-tabs" role="tablist" aria-label="Filter races">
          {filters.map((f) => (
            <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)} className="capitalize">{f}</button>
          ))}
        </div>
        <label className="search" style={{ marginBottom: 0 }}>
          <span className="sr-only">Search races</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search race or country" />
        </label>
      </div>
      {visible.length ? (
        <div className="race-grid">
          {visible.map((race, index) => (
            <article key={race.round} className={`race-card rise${race.sprint ? ' race-card--sprint' : ''}`} style={{ '--i': Math.min(index, 9) } as React.CSSProperties}>
              <div className="flex items-center justify-between">
                <span className="round">R{String(race.round).padStart(2, '0')}</span>
                {race.past ? <span className="state"><LockKeyhole /> Closed</span> : <span className="state open">Open</span>}
              </div>
              <div>
                <p className="eyebrow">{race.country.toUpperCase()}{race.sprint && <span className="sprint-badge"><Zap aria-hidden="true" />SPRINT</span>}</p>
                <h3>{race.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{race.circuit}</p>
              </div>
              <p>{new Date(`${race.date}T12:00:00Z`).toLocaleDateString('en', { day: '2-digit', month: 'short', timeZone: 'UTC' })}</p>
              {!race.past && <Link href={signedIn ? `/predict/${race.round}` : '/sign-in'}>Make picks <ArrowRight /></Link>}
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-grid"><p>No races match your filters.</p></div>
      )}
    </div>
  )
}
