import { type Race, type SessionType } from '@/lib/f1'
import { resolveDriverId } from '@/lib/driver-mapping'

const OPENF1_API = 'https://api.openf1.org/v1'

export type OpenF1Session = {
  session_key: number
  session_name: string
  session_type: string
  date_start: string
  date_end: string
  circuit_key: number
  circuit_short_name: string
  country_name: string
  country_code: string
  location: string
  year: number
  is_cancelled?: boolean
}

export type OpenF1SessionResult = {
  position: number | string | null
  driver_number: number | string
  dnf?: boolean
  dns?: boolean
  dsq?: boolean
  number_of_laps?: number
}

export type OpenF1Driver = {
  driver_number: number
  name_acronym: string
  full_name: string
  first_name: string
  last_name: string
}

export type OpenF1Kind = SessionType | 'practice-1' | 'practice-2' | 'practice-3'

export type OpenF1GridRow = {
  position: number | string | null
  driver_number: number | string
}

async function fetchOpenF1<T>(path: string, options: { timeoutMs?: number; revalidate?: number } = {}): Promise<{ ok: boolean; status: number; data?: T }> {
  const { timeoutMs = 8000, revalidate } = options
  try {
    const res = await fetch(`${OPENF1_API}/${path}`, { ...(revalidate ? { next: { revalidate } } : { cache: 'no-store' as const }), signal: AbortSignal.timeout(timeoutMs) })
    if (!res.ok) return { ok: false, status: res.status }
    const text = await res.text()
    try {
      return { ok: true, status: res.status, data: JSON.parse(text) as T }
    } catch {
      return { ok: false, status: res.status }
    }
  } catch (err: any) {
    const isTimeout = err?.name === 'TimeoutError' || err?.name === 'AbortError'
    return { ok: false, status: isTimeout ? 408 : 0 }
  }
}

export async function getOpenF1Sessions(year: number): Promise<OpenF1Session[]> {
  const res = await fetchOpenF1<OpenF1Session[]>(`sessions?year=${year}`, { revalidate: 300 })
  return res.ok && Array.isArray(res.data) ? res.data : []
}

export async function getOpenF1SessionResults(sessionKey: number): Promise<OpenF1SessionResult[]> {
  const res = await fetchOpenF1<OpenF1SessionResult[]>(`session_result?session_key=${sessionKey}`)
  return res.ok && Array.isArray(res.data) ? res.data : []
}

export async function getOpenF1Drivers(sessionKey: number, revalidate?: number): Promise<OpenF1Driver[]> {
  const res = await fetchOpenF1<OpenF1Driver[]>(`drivers?session_key=${sessionKey}`, { revalidate })
  return res.ok && Array.isArray(res.data) ? res.data : []
}

export async function getOpenF1StartingGrid(sessionKey: number): Promise<OpenF1GridRow[]> {
  const res = await fetchOpenF1<OpenF1GridRow[]>(`starting_grid?session_key=${sessionKey}`)
  return res.ok && Array.isArray(res.data) ? res.data : []
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function matchSessionName(sessionType: OpenF1Kind, sessionName: string): boolean {
  switch (sessionType) {
    case 'practice-1':
      return sessionName === 'Practice 1'
    case 'practice-2':
      return sessionName === 'Practice 2'
    case 'practice-3':
      return sessionName === 'Practice 3'
    case 'qualifying':
      return sessionName === 'Qualifying'
    case 'race':
      return sessionName === 'Race'
    case 'sprint':
      return sessionName === 'Sprint'
    case 'sprint-qualifying':
      return sessionName === 'Sprint Qualifying' || sessionName === 'Sprint Shootout'
    default:
      return false
  }
}

export async function resolveOpenF1Session(year: number, sessionType: OpenF1Kind, race?: Race, round?: number, knownSessions?: OpenF1Session[]): Promise<OpenF1Session | null> {
  const sessions = knownSessions ?? await getOpenF1Sessions(year)
  const targetDate = race ? ((sessionType === 'qualifying' ? race.qualifyingDate : sessionType === 'sprint' ? race.sprintDate : sessionType === 'sprint-qualifying' ? race.sprintQualifyingDate : race.date) || race.date) : ''
  const rawRaceDateMs = targetDate ? new Date(`${targetDate}T12:00:00Z`).getTime() : 0
  const hasValidDate = Number.isFinite(rawRaceDateMs) && rawRaceDateMs > 0
  const locTarget = normalize(race?.locality || (round === 18 ? 'austin' : ''))
  const circuitTarget = normalize(race?.circuit || '')
  const countryTarget = normalize(race?.country || (round === 18 ? 'usa' : ''))
  const nameTarget = normalize(race?.name || (round === 18 ? 'unitedstatesgrandprix' : ''))

  for (const s of sessions) {
    if (!matchSessionName(sessionType, s.session_name)) continue
    if (s.is_cancelled) continue
    const sDateMs = new Date(s.date_start).getTime()
    if (Number.isNaN(sDateMs)) continue
    if (hasValidDate) {
      const diffDays = Math.abs(sDateMs - rawRaceDateMs) / (1000 * 60 * 60 * 24)
      if (diffDays > 4) continue
    }
    const sLoc = normalize(s.location || '')
    const sCircuit = normalize(s.circuit_short_name || '')
    const sCountry = normalize(s.country_name || '')
    const sCountryCode = normalize(s.country_code || '')
    const specificVenueMatch =
      Boolean(locTarget && sLoc && (sLoc.includes(locTarget) || locTarget.includes(sLoc))) ||
      Boolean(circuitTarget && sCircuit && (sCircuit.includes(circuitTarget) || circuitTarget.includes(sCircuit))) ||
      Boolean(locTarget && sCircuit && (sCircuit.includes(locTarget) || locTarget.includes(sCircuit))) ||
      Boolean(nameTarget && ((sLoc && nameTarget.includes(sLoc)) || (sCircuit && nameTarget.includes(sCircuit))))
    const broadCountryMatch =
      Boolean(countryTarget && (sCountryCode === countryTarget || (sCountry && (sCountry.includes(countryTarget) || countryTarget.includes(sCountry))))) ||
      Boolean(nameTarget && sCountry && nameTarget.includes(sCountry))

    if (specificVenueMatch || (hasValidDate && broadCountryMatch)) return s
  }
  return null
}

export type OpenF1ResultOutcome = {
  result: { positions: string[]; allClassified: string[] } | null
  resolved: boolean
  sessionKey?: number
  classifiedCount: number
}

export async function getOpenF1OfficialResults(season: number, round: number, sessionType: SessionType, race?: Race): Promise<OpenF1ResultOutcome> {
  const session = await resolveOpenF1Session(season, sessionType, race, round)
  if (!session) return { result: null, resolved: false, classifiedCount: 0 }
  if (session.date_end) {
    const endMs = new Date(session.date_end).getTime()
    if (Number.isNaN(endMs) || Date.now() < endMs) return { result: null, resolved: true, sessionKey: session.session_key, classifiedCount: 0 }
  }
  const raw = await getOpenF1SessionResults(session.session_key)
  if (!raw || raw.length === 0) return { result: null, resolved: true, sessionKey: session.session_key, classifiedCount: 0 }
  const classified = raw.filter((r) => {
    const p = Number(r.position)
    return r.position != null && Number.isInteger(p) && p >= 1 && !r.dsq && !r.dns
  })
  classified.sort((a, b) => Number(a.position) - Number(b.position))
  const classifiedCount = classified.length
  if (classifiedCount < 10) return { result: null, resolved: true, sessionKey: session.session_key, classifiedCount }
  const drivers = await getOpenF1Drivers(session.session_key)
  const driverByNum = new Map(drivers.map((d) => [Number(d.driver_number), d]))
  const positions: string[] = []
  for (let pos = 1; pos <= 10; pos++) {
    const matches = classified.filter((r) => Number(r.position) === pos)
    if (matches.length !== 1) return { result: null, resolved: true, sessionKey: session.session_key, classifiedCount }
    const item = matches[0]
    const dMeta = driverByNum.get(Number(item.driver_number))
    const mappedId = resolveDriverId(item.driver_number, dMeta?.name_acronym, dMeta?.last_name)
    if (!mappedId) return { result: null, resolved: true, sessionKey: session.session_key, classifiedCount }
    positions.push(mappedId)
  }
  if (new Set(positions).size !== 10) return { result: null, resolved: true, sessionKey: session.session_key, classifiedCount }
  const allClassified = Array.from(
    new Set(
      classified
        .map((r) => {
          const dMeta = driverByNum.get(Number(r.driver_number))
          return resolveDriverId(r.driver_number, dMeta?.name_acronym, dMeta?.last_name)
        })
        .filter((id): id is string => Boolean(id))
    )
  )
  return { result: { positions, allClassified }, resolved: true, sessionKey: session.session_key, classifiedCount }
}
