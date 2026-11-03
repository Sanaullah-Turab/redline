'use client'
import { useMemo, useState } from 'react'
import { CalendarCard, type CalendarRaceItem } from '@/components/calendar/calendar-card'

export type { CalendarRaceItem as CalendarRace }

const filters = ['all', 'upcoming', 'completed', 'sprint'] as const
type Filter = (typeof filters)[number]

export function RaceCalendar({
  races,
  signedIn,
  meId,
}: {
  races: CalendarRaceItem[]
  signedIn: boolean
  meId?: string
}) {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return races.filter((race) => {
      if (filter === 'upcoming' && race.status === 'finished') return false
      if (filter === 'completed' && race.status !== 'finished') return false
      if (filter === 'sprint' && !race.sprint) return false
      if (!q) return true
      const podiumNames = race.podium.map((tile) => tile.name).join(' ')
      return `${race.name} ${race.officialName} ${race.country} ${race.circuit} ${podiumNames}`
        .toLowerCase()
        .includes(q)
    })
  }, [races, filter, query])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="session-tabs w-full sm:w-auto" role="tablist" aria-label="Filter races">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
            </button>
          ))}
        </div>
        <label className="search w-full sm:w-auto" style={{ marginBottom: 0 }}>
          <span className="sr-only">Search races</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search race, country, or winner"
          />
        </label>
      </div>
      {visible.length ? (
        <div className="f1-calendar-grid">
          {visible.map((race, index) => (
            <CalendarCard
              key={race.round}
              race={race}
              index={index}
              signedIn={signedIn}
              meId={meId}
            />
          ))}
        </div>
      ) : (
        <div className="empty-grid">
          <p>No races match your filters.</p>
        </div>
      )}
    </div>
  )
}
