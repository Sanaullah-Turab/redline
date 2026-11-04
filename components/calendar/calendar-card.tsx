import Link from 'next/link'
import { ChevronRight, Flag, Zap } from 'lucide-react'
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
  time?: string
  sprint: boolean
  status: 'finished' | 'next' | 'upcoming'
  podium: RoundPodiumEntry[]
}

const CIRCUIT_TIMEZONES: Record<string, string> = {
  'Albert Park Grand Prix Circuit': 'Australia/Melbourne',
  'Shanghai International Circuit': 'Asia/Shanghai',
  'Suzuka Circuit': 'Asia/Tokyo',
  'Miami International Autodrome': 'America/New_York',
  'Circuit Gilles Villeneuve': 'America/Toronto',
  'Circuit de Monaco': 'Europe/Monaco',
  'Circuit de Barcelona-Catalunya': 'Europe/Madrid',
  'Red Bull Ring': 'Europe/Vienna',
  'Silverstone Circuit': 'Europe/London',
  'Circuit de Spa-Francorchamps': 'Europe/Brussels',
  'Hungaroring': 'Europe/Budapest',
  'Circuit Zandvoort': 'Europe/Amsterdam',
  'Autodromo Nazionale di Monza': 'Europe/Rome',
  'Madring': 'Europe/Madrid',
  'Baku City Circuit': 'Asia/Baku',
  'Bahrain International Circuit': 'Asia/Bahrain',
  'Marina Bay Street Circuit': 'Asia/Singapore',
  'Circuit of the Americas': 'America/Chicago',
  'Autódromo Hermanos Rodríguez': 'America/Mexico_City',
  'Autódromo José Carlos Pace': 'America/Sao_Paulo',
  'Las Vegas Strip Street Circuit': 'America/Los_Angeles',
  'Lusail International Circuit': 'Asia/Qatar',
  'Yas Marina Circuit': 'Asia/Dubai',
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

function ordinalSuffix(pos: number): string {
  if (pos === 1) return 'ST'
  if (pos === 2) return 'ND'
  if (pos === 3) return 'RD'
  return 'TH'
}

export function formatWeekendRange(
  endDateStr: string,
  startDateStr?: string,
  circuit?: string,
  timeStr?: string
): string {
  const tz = circuit ? (CIRCUIT_TIMEZONES[circuit] ?? (circuit.includes('Las Vegas') ? 'America/Los_Angeles' : undefined)) : undefined
  let localEndDateStr = endDateStr
  if (tz) {
    const time = timeStr || (tz === 'America/Los_Angeles' ? '04:00:00Z' : '12:00:00Z')
    const utcDate = new Date(`${endDateStr}T${time}`)
    if (!Number.isNaN(utcDate.getTime())) {
      localEndDateStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(utcDate)
    }
  }

  const [y, m, d] = localEndDateStr.split('-').map(Number)
  const end = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
  if (Number.isNaN(end.getTime())) return endDateStr

  const start = startDateStr
    ? new Date(Date.UTC(Number(startDateStr.slice(0, 4)), Number(startDateStr.slice(5, 7)) - 1, Number(startDateStr.slice(8, 10)), 12, 0, 0))
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
  const dateRange = formatWeekendRange(race.date, undefined, race.circuit, race.time)
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
        ) : (
          <span className="f1-cal-top-date">
            <Flag className="size-3 opacity-75" aria-hidden="true" />
            {dateRange}
          </span>
        )}
      </div>

      <div className="f1-cal-body">
        <div className="f1-cal-country-row">
          <CountryFlag country={race.country} />
          <h3 className="f1-cal-country">{race.country}</h3>
        </div>
        <p className="f1-cal-official">{race.officialName}</p>
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
                    <span className="f1-cal-podium-rank">
                      <span className="f1-cal-podium-pos">{tile.position}</span>
                      <small className="f1-cal-podium-ord">{ordinalSuffix(tile.position)}</small>
                    </span>
                    <span className="f1-cal-podium-avatar" data-pos={tile.position}>
                      {tile.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={tile.image} alt="" className="size-full object-cover" />
                      ) : (
                        tile.name.slice(0, 1).toUpperCase()
                      )}
                    </span>
                    <span className="f1-cal-podium-info">
                      <strong className="f1-cal-podium-name">{tile.name}</strong>
                      <small className="f1-cal-podium-pts">
                        {tile.points} {tile.points === 1 ? 'pt' : 'pts'}
                      </small>
                    </span>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="f1-cal-unscored">
              <span>Results pending</span>
              <Link href={`/predict/${race.round}`}>View round</Link>
            </div>
          )}
        </div>
      ) : (
        <div className="f1-cal-footer f1-cal-footer--upcoming">
          <div className="f1-cal-date-block">
            <span className="f1-cal-bottom-date">{dateRange}</span>
            <Link href={href} className="f1-cal-cta">
              {race.status === 'next' ? 'Enter predictions' : 'Make picks'} <ChevronRight aria-hidden="true" />
            </Link>
          </div>
          <CircuitDecor circuitId={race.circuit} />
        </div>
      )}
    </article>
  )
}
