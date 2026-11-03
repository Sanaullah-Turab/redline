import Link from 'next/link'
import { ChevronRight, Zap } from 'lucide-react'
import type { RoundPodiumEntry } from '@/lib/podiums'
import { CircuitDecor } from './circuit-decor'
import { CountryFlag } from './country-flag'

export type CalendarRaceItem = {
  round: number
  name: string
  officialName: string
  country: string
  circuit: string
  date: string
  sprint: boolean
  status: 'finished' | 'next' | 'upcoming'
  podium: RoundPodiumEntry[]
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

export function formatWeekendRange(endDateStr: string, startDateStr?: string): string {
  const end = new Date(`${endDateStr}T12:00:00Z`)
  if (Number.isNaN(end.getTime())) return endDateStr
  const start = startDateStr
    ? new Date(`${startDateStr.slice(0, 10)}T12:00:00Z`)
    : new Date(end.getTime() - 2 * 86_400_000)

  const startDay = String(start.getUTCDate()).padStart(2, '0')
  const endDay = String(end.getUTCDate()).padStart(2, '0')
  const startMonth = MONTHS[start.getUTCMonth()]
  const endMonth = MONTHS[end.getUTCMonth()]

  if (startMonth === endMonth) {
    return `${startDay} - ${endDay} ${endMonth}`
  }
  return `${startDay} ${startMonth} - ${endDay} ${endMonth}`
}

export function CalendarCard({
  race,
  index,
  signedIn,
  meId,
}: {
  race: CalendarRaceItem
  index: number
  signedIn: boolean
  meId?: string
}) {
  const dateRange = formatWeekendRange(race.date)
  const href =
    race.status === 'finished'
      ? race.podium.length > 0 && signedIn
        ? `/picks?round=${race.round}`
        : `/predict/${race.round}`
      : signedIn
        ? `/predict/${race.round}`
        : '/sign-in'

  return (
    <article
      className={`f1-cal-card f1-cal-card--${race.status} rise`}
      style={{ '--i': Math.min(index, 11) } as React.CSSProperties}
    >
      <div className="f1-cal-top">
        <span className="f1-cal-round">
          ROUND {race.round}
          {race.sprint && (
            <span className="f1-cal-sprint">
              <Zap aria-hidden="true" /> SPRINT
            </span>
          )}
        </span>

        {race.status === 'next' ? (
          <Link href={href} className="f1-cal-next-pill">
            NEXT RACE <ChevronRight aria-hidden="true" />
          </Link>
        ) : race.status === 'finished' ? (
          <span className="f1-cal-top-date">{dateRange}</span>
        ) : (
          <Link href={href} className="f1-cal-open-link">
            PREDICT <ChevronRight aria-hidden="true" />
          </Link>
        )}
      </div>

      <div className="f1-cal-body">
        <div className="f1-cal-country-row">
          <CountryFlag country={race.country} />
          <h3 className="f1-cal-country">{race.country}</h3>
        </div>
        <p className="f1-cal-official">{race.officialName}</p>
        <p className="f1-cal-circuit">{race.circuit}</p>
      </div>

      {race.status === 'finished' ? (
        <div className="f1-cal-footer f1-cal-footer--finished">
          {race.podium.length > 0 ? (
            <div className="f1-cal-podium" data-count={race.podium.length}>
              {race.podium.map((tile) => {
                const isMe = Boolean(meId && tile.userId === meId)
                return (
                  <Link
                    key={`${race.round}-${tile.userId}`}
                    href={`/profile/${tile.userId}`}
                    className="f1-cal-podium-tile"
                    data-pos={tile.position}
                    data-me={isMe}
                    title={`${tile.name}: ${tile.points} pts`}
                  >
                    <div className="f1-cal-podium-head">
                      <span className="f1-cal-podium-pos">{tile.position}</span>
                      <span className="f1-cal-podium-avatar">
                        {tile.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={tile.image} alt="" className="size-full object-cover" />
                        ) : (
                          tile.name.slice(0, 1).toUpperCase()
                        )}
                      </span>
                      {isMe && <span className="f1-cal-you">YOU</span>}
                    </div>
                    <strong className="f1-cal-podium-name">{tile.name}</strong>
                    <span className="f1-cal-podium-pts">
                      {tile.points} {tile.points === 1 ? 'pt' : 'pts'}
                    </span>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="f1-cal-unscored">
              <span>Results pending · No scored predictions</span>
              <Link href={`/predict/${race.round}`}>View round</Link>
            </div>
          )}
        </div>
      ) : (
        <div className="f1-cal-footer f1-cal-footer--upcoming">
          <div className="f1-cal-date-block">
            <span className="f1-cal-bottom-date">{dateRange}</span>
            <Link href={href} className="f1-cal-cta">
              {race.status === 'next' ? 'Lock in weekend picks' : 'Make early picks'} <ChevronRight aria-hidden="true" />
            </Link>
          </div>
          <CircuitDecor round={race.round} />
        </div>
      )}
    </article>
  )
}
