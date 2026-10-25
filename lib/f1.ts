import { normalizeDriverId } from '@/lib/driver-mapping'
import { getOpenF1OfficialResults } from '@/lib/openf1'

export const SEASON = 2026
const API = 'https://api.jolpi.ca/ergast/f1'

export type Driver = { id: string; code: string; number: string; givenName: string; familyName: string; nationality: string }
export type Race = { round: number; name: string; circuit: string; locality: string; country: string; date: string; time: string; qualifyingDate?: string; qualifyingTime?: string; sprintDate?: string; sprintTime?: string; sprintQualifyingDate?: string; sprintQualifyingTime?: string }
export type SessionType = 'qualifying' | 'race' | 'sprint-qualifying' | 'sprint'

async function api(path: string, timeoutMs = 8000) {
  try {
    const res = await fetch(`${API}/${path}`, { cache: 'no-store', signal: AbortSignal.timeout(timeoutMs) })
    if (!res.ok) return { ok: false, status: res.status, data: null }
    const text = await res.text()
    try {
      return { ok: true, status: res.status, data: JSON.parse(text) }
    } catch {
      return { ok: false, status: res.status, data: null }
    }
  } catch (err: any) {
    const isTimeout = err?.name === 'TimeoutError' || err?.name === 'AbortError'
    return { ok: false, status: isTimeout ? 408 : 0, data: null }
  }
}

const scheduleCache = new Map<number, Race[]>()

export async function getSchedule(season: number = SEASON): Promise<Race[]> {
  try {
    const res = await api(`${season}.json`)
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

const DRIVERS_2026: Driver[] = [
  // Red Bull Racing
  { id: 'max_verstappen',  code: 'VER', number: '3',  givenName: 'Max',         familyName: 'Verstappen', nationality: 'Dutch' },
  { id: 'hadjar',          code: 'HAD', number: '6',  givenName: 'Isack',       familyName: 'Hadjar',     nationality: 'French' },

  // McLaren
  { id: 'norris',          code: 'NOR', number: '1',  givenName: 'Lando',       familyName: 'Norris',     nationality: 'British' },
  { id: 'piastri',         code: 'PIA', number: '81', givenName: 'Oscar',       familyName: 'Piastri',    nationality: 'Australian' },

  // Ferrari
  { id: 'leclerc',         code: 'LEC', number: '16', givenName: 'Charles',     familyName: 'Leclerc',    nationality: 'Monegasque' },
  { id: 'hamilton',        code: 'HAM', number: '44', givenName: 'Lewis',       familyName: 'Hamilton',   nationality: 'British' },

  // Mercedes
  { id: 'russell',         code: 'RUS', number: '63', givenName: 'George',      familyName: 'Russell',    nationality: 'British' },
  { id: 'antonelli',       code: 'ANT', number: '12', givenName: 'Andrea Kimi', familyName: 'Antonelli',  nationality: 'Italian' },

  // Aston Martin
  { id: 'alonso',          code: 'ALO', number: '14', givenName: 'Fernando',    familyName: 'Alonso',     nationality: 'Spanish' },
  { id: 'stroll',          code: 'STR', number: '18', givenName: 'Lance',       familyName: 'Stroll',     nationality: 'Canadian' },

  // Alpine
  { id: 'gasly',           code: 'GAS', number: '10', givenName: 'Pierre',      familyName: 'Gasly',      nationality: 'French' },
  { id: 'colapinto',       code: 'COL', number: '43', givenName: 'Franco',      familyName: 'Colapinto',  nationality: 'Argentine' },

  // Audi (formerly Sauber)
  { id: 'hulkenberg',      code: 'HUL', number: '27', givenName: 'Nico',        familyName: 'Hülkenberg', nationality: 'German' },
  { id: 'bortoleto',       code: 'BOR', number: '5',  givenName: 'Gabriel',     familyName: 'Bortoleto',  nationality: 'Brazilian' },

  // Williams
  { id: 'albon',           code: 'ALB', number: '23', givenName: 'Alexander',   familyName: 'Albon',      nationality: 'Thai' },
  { id: 'sainz',           code: 'SAI', number: '55', givenName: 'Carlos',      familyName: 'Sainz',      nationality: 'Spanish' },

  // Haas
  { id: 'ocon',            code: 'OCO', number: '31', givenName: 'Esteban',     familyName: 'Ocon',       nationality: 'French' },
  { id: 'bearman',         code: 'BEA', number: '87', givenName: 'Oliver',      familyName: 'Bearman',    nationality: 'British' },

  // Racing Bulls
  { id: 'lawson',          code: 'LAW', number: '30', givenName: 'Liam',        familyName: 'Lawson',     nationality: 'New Zealander' },
  { id: 'lindblad',        code: 'LIN', number: '41', givenName: 'Arvid',       familyName: 'Lindblad',   nationality: 'British' },

  // Cadillac
  { id: 'perez',           code: 'PER', number: '11', givenName: 'Sergio',      familyName: 'Pérez',      nationality: 'Mexican' },
  { id: 'bottas',          code: 'BOT', number: '77', givenName: 'Valtteri',    familyName: 'Bottas',     nationality: 'Finnish' },
]

export async function getDrivers(): Promise<Driver[]> {
  return DRIVERS_2026
}

export function isSprint(race: Race): boolean {
  return !!race.sprintDate
}

export function sessionStart(race: Race, type: SessionType) {
  switch (type) {
    case 'qualifying': return new Date(`${race.qualifyingDate}T${race.qualifyingTime || '00:00:00Z'}`)
    case 'race': return new Date(`${race.date}T${race.time || '00:00:00Z'}`)
    case 'sprint-qualifying': return new Date(`${race.sprintQualifyingDate}T${race.sprintQualifyingTime || '00:00:00Z'}`)
    case 'sprint': return new Date(`${race.sprintDate}T${race.sprintTime || '00:00:00Z'}`)
  }
}

export type OfficialResult = {
  positions: string[]
  allClassified: string[]
}

export type OfficialResultOutcome = {
  result: OfficialResult | null
  pendingReason?: string
}

export async function getOfficialResults(season: number, round: number, type: SessionType, raceEvent?: Race): Promise<OfficialResultOutcome> {
  try {
    let endpoint = ''
    if (type === 'qualifying') endpoint = `${season}/${round}/qualifying.json`
    else if (type === 'race') endpoint = `${season}/${round}/results.json`
    else if (type === 'sprint') endpoint = `${season}/${round}/sprint.json`

    let jolpicaOutcome = ''
    if (endpoint) {
      const res = await api(endpoint)
      if (!res.ok) {
        jolpicaOutcome = String(res.status || 'error')
      } else if (res.data) {
        const race = res.data.MRData?.RaceTable?.Races?.[0]
        if (!race || Number(race.season) !== season || Number(race.round) !== round) {
          jolpicaOutcome = 'empty result'
        } else {
          const rawRows: any[] = (type === 'qualifying' ? race.QualifyingResults : type === 'race' ? race.Results : race.SprintResults) ?? []
          const rows = [...rawRows].sort((a: any, b: any) => (Number(a.position) || 999) - (Number(b.position) || 999))
          if (rows.length >= 10) {
            const positions = rows.slice(0, 10).map((r: any) => normalizeDriverId(r.Driver?.driverId)).filter(Boolean)
            const allClassified = rows.map((r: any) => normalizeDriverId(r.Driver?.driverId)).filter(Boolean)
            if (positions.length === 10 && new Set(positions).size === 10) return { result: { positions, allClassified } }
            jolpicaOutcome = 'incomplete result'
          } else {
            jolpicaOutcome = 'empty result'
          }
        }
      } else {
        jolpicaOutcome = 'empty result'
      }
    } else {
      jolpicaOutcome = 'no endpoint'
    }

    if (season !== SEASON) {
      return { result: null, pendingReason: `Jolpica ${jolpicaOutcome}; OpenF1 not supported for season ${season}` }
    }

    let event = raceEvent
    if (!event) {
      const schedule = await getSchedule(season)
      event = schedule.find((r) => r.round === round)
    }

    const openF1 = await getOpenF1OfficialResults(season, round, type, event)
    if (openF1.result) return { result: openF1.result }

    const openF1Part = openF1.resolved
      ? `OpenF1 session ${openF1.sessionKey} resolved (${openF1.classifiedCount} classified)`
      : `OpenF1 session not resolved (${openF1.classifiedCount} classified)`
    const pendingReason = `Jolpica ${jolpicaOutcome}; ${openF1Part}`

    return { result: null, pendingReason }
  } catch {
    return { result: null, pendingReason: 'Error fetching official results' }
  }
}
