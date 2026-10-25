import { type Race, type SessionType } from '@/lib/f1'

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

async function fetchOpenF1<T>(path: string, timeoutMs = 8000): Promise<{ ok: boolean; status: number; data?: T }> {
  try {
    const res = await fetch(`${OPENF1_API}/${path}`, { cache: 'no-store', signal: AbortSignal.timeout(timeoutMs) })
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
  const res = await fetchOpenF1<OpenF1Session[]>(`sessions?year=${year}`)
  return res.ok && Array.isArray(res.data) ? res.data : []
}

export async function getOpenF1SessionResults(sessionKey: number): Promise<OpenF1SessionResult[]> {
  const res = await fetchOpenF1<OpenF1SessionResult[]>(`session_result?session_key=${sessionKey}`)
  return res.ok && Array.isArray(res.data) ? res.data : []
}

export async function getOpenF1Drivers(sessionKey: number): Promise<OpenF1Driver[]> {
  const res = await fetchOpenF1<OpenF1Driver[]>(`drivers?session_key=${sessionKey}`)
  return res.ok && Array.isArray(res.data) ? res.data : []
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function matchSessionName(sessionType: SessionType, sessionName: string): boolean {
  switch (sessionType) {
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

export async function resolveOpenF1Session(year: number, sessionType: SessionType, race: Race): Promise<OpenF1Session | null> {
  const sessions = await getOpenF1Sessions(year)
  const raceDateMs = new Date(`${race.date}T12:00:00Z`).getTime()
  const locTarget = normalize(race.locality || '')
  const circuitTarget = normalize(race.circuit || '')
  const countryTarget = normalize(race.country || '')

  for (const s of sessions) {
    if (!matchSessionName(sessionType, s.session_name)) continue
    if (s.is_cancelled) continue
    const sDateMs = new Date(s.date_start).getTime()
    const diffDays = Math.abs(sDateMs - raceDateMs) / (1000 * 60 * 60 * 24)
    if (diffDays > 4) continue
    const sLoc = normalize(s.location || '')
    const sCircuit = normalize(s.circuit_short_name || '')
    const sCountry = normalize(s.country_name || '')
    const locationMatches =
      (locTarget && (sLoc.includes(locTarget) || locTarget.includes(sLoc))) ||
      (circuitTarget && (sCircuit.includes(circuitTarget) || circuitTarget.includes(sCircuit))) ||
      (locTarget && (sCircuit.includes(locTarget) || locTarget.includes(sCircuit))) ||
      (countryTarget && (sCountry.includes(countryTarget) || countryTarget.includes(sCountry)))

    if (locationMatches) return s
  }
  return null
}
