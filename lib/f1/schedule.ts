import { api, SEASON } from './client'
import type { Race, SessionType } from './types'

const scheduleCache = new Map<number, Race[]>()

export async function getSchedule(season: number = SEASON): Promise<Race[]> {
  try {
    const res = await api(`${season}.json`, { revalidate: 600 })
    if (res.ok && res.data) {
      const races = (res.data.MRData?.RaceTable?.Races ?? []).map((r: any) => ({ round: Number(r.round), name: r.raceName, circuit: r.Circuit.circuitName, locality: r.Circuit.Location.locality, country: r.Circuit.Location.country, date: r.date, time: r.time ?? '00:00:00Z', qualifyingDate: r.Qualifying?.date, qualifyingTime: r.Qualifying?.time, sprintDate: r.Sprint?.date, sprintTime: r.Sprint?.time, sprintQualifyingDate: r.SprintQualifying?.date, sprintQualifyingTime: r.SprintQualifying?.time }))
      if (races.length > 0) scheduleCache.set(season, races)
      return races
    }
    return scheduleCache.get(season) ?? []
  } catch {
    return scheduleCache.get(season) ?? []
  }
}

export function isSprint(race: Race): boolean {
  return !!race.sprintDate
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
