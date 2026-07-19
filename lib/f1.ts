export const SEASON = 2026
const API = 'https://api.jolpi.ca/ergast/f1'

export type Driver = { id: string; code: string; number: string; givenName: string; familyName: string; nationality: string }
export type Race = { round: number; name: string; circuit: string; locality: string; country: string; date: string; time: string; qualifyingDate?: string; qualifyingTime?: string }

async function api(path: string) {
  const res = await fetch(`${API}/${path}`, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error('F1 data is temporarily unavailable')
  return res.json()
}

export async function getSchedule(): Promise<Race[]> {
  try {
    const data = await api(`${SEASON}.json`)
    return (data.MRData.RaceTable.Races ?? []).map((r: any) => ({ round: Number(r.round), name: r.raceName, circuit: r.Circuit.circuitName, locality: r.Circuit.Location.locality, country: r.Circuit.Location.country, date: r.date, time: r.time ?? '00:00:00Z', qualifyingDate: r.Qualifying?.date, qualifyingTime: r.Qualifying?.time }))
  } catch { return [] }
}

export async function getDrivers(): Promise<Driver[]> {
  try {
    const data = await api(`${SEASON}/drivers.json`)
    return (data.MRData.DriverTable.Drivers ?? []).map((d: any) => ({ id: d.driverId, code: d.code || d.familyName.slice(0, 3).toUpperCase(), number: d.permanentNumber ?? '—', givenName: d.givenName, familyName: d.familyName, nationality: d.nationality }))
  } catch { return [] }
}

export function sessionStart(race: Race, type: 'qualifying' | 'race') {
  const date = type === 'qualifying' ? race.qualifyingDate : race.date
  const time = type === 'qualifying' ? race.qualifyingTime : race.time
  return new Date(`${date}T${time || '00:00:00Z'}`)
}

export async function getOfficialResults(round: number, type: 'qualifying' | 'race') {
  const endpoint = type === 'qualifying' ? 'qualifying' : 'results'
  try {
    const data = await api(`${SEASON}/${round}/${endpoint}.json`)
    const race = data.MRData.RaceTable.Races?.[0]
    const rows = type === 'qualifying' ? race?.QualifyingResults : race?.Results
    return (rows ?? []).slice(0, 10).map((r: any) => r.Driver.driverId) as string[]
  } catch { return [] }
}
