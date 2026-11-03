import { api, SEASON } from './client'
import { FALLBACK_SCHEDULE_2026 } from './fallback-schedule'
import type { Race, SessionType } from './types'

interface JolpicaSessionSlot {
  date?: string
  time?: string
}

interface JolpicaRaceItem {
  round?: string | number
  raceName?: string
  date?: string
  time?: string
  Circuit?: {
    circuitName?: string
    Location?: {
      locality?: string
      country?: string
    }
  }
  Qualifying?: JolpicaSessionSlot
  Sprint?: JolpicaSessionSlot
  SprintQualifying?: JolpicaSessionSlot
  ThirdPractice?: JolpicaSessionSlot
}

const scheduleCache = new Map<number, { races: Race[]; expiresAt: number }>()
const inFlightSchedule = new Map<number, Promise<Race[]>>()
const fallbackByRound = new Map(FALLBACK_SCHEDULE_2026.map((race) => [race.round, race]))

const LIVE_TTL_MS = 30 * 60 * 1000
const FALLBACK_TTL_MS = 5 * 60 * 1000

function defaultSchedule(season: number): Race[] {
  return scheduleCache.get(season)?.races ?? (season === SEASON ? FALLBACK_SCHEDULE_2026 : [])
}

function mapJolpicaRace(raw: JolpicaRaceItem, season: number): Race {
  const round = Number(raw.round)
  const fb = season === SEASON ? fallbackByRound.get(round) : undefined
  return {
    round,
    name: raw.raceName || fb?.name || `Round ${round}`,
    officialName: fb?.officialName,
    circuit: raw.Circuit?.circuitName || fb?.circuit || '',
    locality: raw.Circuit?.Location?.locality || fb?.locality || '',
    country: raw.Circuit?.Location?.country || fb?.country || '',
    date: raw.date || fb?.date || '',
    time: raw.time ?? fb?.time ?? '00:00:00Z',
    qualifyingDate: raw.Qualifying?.date ?? fb?.qualifyingDate,
    qualifyingTime: raw.Qualifying?.time ?? fb?.qualifyingTime,
    sprintDate: raw.Sprint?.date ?? fb?.sprintDate,
    sprintTime: raw.Sprint?.time ?? fb?.sprintTime,
    sprintQualifyingDate: raw.SprintQualifying?.date ?? fb?.sprintQualifyingDate,
    sprintQualifyingTime: raw.SprintQualifying?.time ?? fb?.sprintQualifyingTime,
    thirdPracticeDate: raw.ThirdPractice?.date ?? fb?.thirdPracticeDate,
    thirdPracticeTime: raw.ThirdPractice?.time ?? fb?.thirdPracticeTime,
  }
}

async function fetchScheduleInternal(season: number): Promise<Race[]> {
  try {
    const res = await api(`${season}.json`, {
      revalidate: 600,
      timeoutMs: 2500,
    })
    if (res.ok && res.data) {
      const rawRaces: JolpicaRaceItem[] = res.data.MRData?.RaceTable?.Races ?? []
      const races = rawRaces.map((item) => mapJolpicaRace(item, season))
      if (races.length > 0) {
        scheduleCache.set(season, { races, expiresAt: Date.now() + LIVE_TTL_MS })
        return races
      }
    }
  } catch {}

  const fallback = defaultSchedule(season)
  if (fallback.length > 0) {
    scheduleCache.set(season, { races: fallback, expiresAt: Date.now() + FALLBACK_TTL_MS })
  }
  return fallback
}

export async function getSchedule(season: number = SEASON): Promise<Race[]> {
  const cached = scheduleCache.get(season)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.races
  }
  const existing = inFlightSchedule.get(season)
  if (existing) return existing
  const promise = fetchScheduleInternal(season).finally(() => {
    inFlightSchedule.delete(season)
  })
  inFlightSchedule.set(season, promise)
  return promise
}

export function isSprint(race: Race): boolean {
  return !!race.sprintDate
}

export function thirdPracticeStart(race: Race): Date {
  return race.thirdPracticeDate
    ? new Date(`${race.thirdPracticeDate}T${race.thirdPracticeTime || '00:00:00Z'}`)
    : new Date(NaN)
}

export function sessionStart(race: Race, type: SessionType): Date {
  switch (type) {
    case 'qualifying':
      return race.qualifyingDate ? new Date(`${race.qualifyingDate}T${race.qualifyingTime || '00:00:00Z'}`) : new Date(NaN)
    case 'race':
      return race.date ? new Date(`${race.date}T${race.time || '00:00:00Z'}`) : new Date(NaN)
    case 'sprint-qualifying':
      return race.sprintQualifyingDate
        ? new Date(`${race.sprintQualifyingDate}T${race.sprintQualifyingTime || '00:00:00Z'}`)
        : new Date(NaN)
    case 'sprint':
      return race.sprintDate ? new Date(`${race.sprintDate}T${race.sprintTime || '00:00:00Z'}`) : new Date(NaN)
    default:
      return new Date(NaN)
  }
}

const SESSION_LABELS: Record<SessionType, string> = {
  qualifying: 'Qualifying',
  race: 'Race',
  'sprint-qualifying': 'Sprint Qualifying',
  sprint: 'Sprint',
}

export function sessionLabel(type: SessionType) {
  return SESSION_LABELS[type]
}

export function nextSession(race: Race, now: Date = new Date()) {
  const types: SessionType[] = isSprint(race)
    ? ['sprint-qualifying', 'sprint', 'qualifying', 'race']
    : ['qualifying', 'race']
  return types.map((type) => ({ type, start: sessionStart(race, type) })).find(({ start }) => start > now)
}

export function formatRaceWeekend(dateStr: string, options: { includeYear?: boolean; longMonth?: boolean } = {}) {
  const endDate = new Date(`${dateStr}T12:00:00Z`)
  if (isNaN(endDate.getTime())) return dateStr

  const startDate = new Date(endDate)
  startDate.setUTCDate(startDate.getUTCDate() - 2)

  const startDay = startDate.getUTCDate()
  const endDay = endDate.getUTCDate()
  const startMonth = startDate.toLocaleDateString('en', {
    month: options.longMonth ? 'long' : 'short',
    timeZone: 'UTC',
  })
  const endMonth = endDate.toLocaleDateString('en', {
    month: options.longMonth ? 'long' : 'short',
    timeZone: 'UTC',
  })
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
