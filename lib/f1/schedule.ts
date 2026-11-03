import { api, SEASON } from './client'
import { FALLBACK_SCHEDULE_2026 } from './fallback-schedule'
import type { Race, SessionType } from './types'

const scheduleCache = new Map<number, Race[]>()
const fallbackByRound = new Map(FALLBACK_SCHEDULE_2026.map((race) => [race.round, race]))

function defaultSchedule(season: number): Race[] {
  return scheduleCache.get(season) ?? (season === SEASON ? FALLBACK_SCHEDULE_2026 : [])
}

export async function getSchedule(season: number = SEASON): Promise<Race[]> {
  const cached = scheduleCache.get(season)
  if (cached) return cached
  try {
    const res = await api(`${season}.json`, { revalidate: 600, timeoutMs: 3500 })
    if (res.ok && res.data) {
      const races: Race[] = (res.data.MRData?.RaceTable?.Races ?? []).map((r: any) => {
        const round = Number(r.round)
        const fb = season === SEASON ? fallbackByRound.get(round) : undefined
        return {
          round,
          name: r.raceName || fb?.name || `Round ${round}`,
          officialName: fb?.officialName,
          circuit: r.Circuit?.circuitName || fb?.circuit || '',
          locality: r.Circuit?.Location?.locality || fb?.locality || '',
          country: r.Circuit?.Location?.country || fb?.country || '',
          date: r.date || fb?.date || '',
          time: r.time ?? fb?.time ?? '00:00:00Z',
          qualifyingDate: r.Qualifying?.date ?? fb?.qualifyingDate,
          qualifyingTime: r.Qualifying?.time ?? fb?.qualifyingTime,
          sprintDate: r.Sprint?.date ?? fb?.sprintDate,
          sprintTime: r.Sprint?.time ?? fb?.sprintTime,
          sprintQualifyingDate: r.SprintQualifying?.date ?? fb?.sprintQualifyingDate,
          sprintQualifyingTime: r.SprintQualifying?.time ?? fb?.sprintQualifyingTime,
          thirdPracticeDate: r.ThirdPractice?.date ?? fb?.thirdPracticeDate,
          thirdPracticeTime: r.ThirdPractice?.time ?? fb?.thirdPracticeTime,
        }
      })
      if (races.length > 0) {
        scheduleCache.set(season, races)
        return races
      }
    }
    const fallback = defaultSchedule(season)
    if (fallback.length > 0) scheduleCache.set(season, fallback)
    return fallback
  } catch {
    return defaultSchedule(season)
  }
}

export function isSprint(race: Race): boolean {
  return !!race.sprintDate
}

export function thirdPracticeStart(race: Race): Date {
  return race.thirdPracticeDate ? new Date(`${race.thirdPracticeDate}T${race.thirdPracticeTime || '00:00:00Z'}`) : new Date(NaN)
}

export function sessionStart(race: Race, type: SessionType): Date {
  switch (type) {
    case 'qualifying': return race.qualifyingDate ? new Date(`${race.qualifyingDate}T${race.qualifyingTime || '00:00:00Z'}`) : new Date(NaN)
    case 'race': return race.date ? new Date(`${race.date}T${race.time || '00:00:00Z'}`) : new Date(NaN)
    case 'sprint-qualifying': return race.sprintQualifyingDate ? new Date(`${race.sprintQualifyingDate}T${race.sprintQualifyingTime || '00:00:00Z'}`) : new Date(NaN)
    case 'sprint': return race.sprintDate ? new Date(`${race.sprintDate}T${race.sprintTime || '00:00:00Z'}`) : new Date(NaN)
    default: return new Date(NaN)
  }
}

const SESSION_LABELS: Record<SessionType, string> = { qualifying: 'Qualifying', race: 'Race', 'sprint-qualifying': 'Sprint Qualifying', sprint: 'Sprint' }

export function sessionLabel(type: SessionType) {
  return SESSION_LABELS[type]
}

export function nextSession(race: Race, now: Date = new Date()) {
  const types: SessionType[] = isSprint(race) ? ['sprint-qualifying', 'sprint', 'qualifying', 'race'] : ['qualifying', 'race']
  return types.map((type) => ({ type, start: sessionStart(race, type) })).find(({ start }) => start > now)
}

export function formatRaceWeekend(dateStr: string, options: { includeYear?: boolean; longMonth?: boolean } = {}) {
  const endDate = new Date(`${dateStr}T12:00:00Z`)
  if (isNaN(endDate.getTime())) return dateStr

  const startDate = new Date(endDate)
  startDate.setUTCDate(startDate.getUTCDate() - 2)

  const startDay = startDate.getUTCDate()
  const endDay = endDate.getUTCDate()
  const startMonth = startDate.toLocaleDateString('en', { month: options.longMonth ? 'long' : 'short', timeZone: 'UTC' })
  const endMonth = endDate.toLocaleDateString('en', { month: options.longMonth ? 'long' : 'short', timeZone: 'UTC' })
  const startYear = startDate.getUTCFullYear()
  const endYear = endDate.getUTCFullYear()

  if (startYear !== endYear) {
    return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`
  }

  const yearSuffix = options.includeYear ? ` ${endYear}` : ''
  if (startMonth !== endMonth) {
    return `${startDay} ${startMonth} - ${endDay} ${endMonth}${yearSuffix}`
  }

  return `${startDay} - ${endDay} ${endMonth}${yearSuffix}`
}
