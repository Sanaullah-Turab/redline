export const SEASON = 2026
const API = 'https://api.jolpi.ca/ergast/f1'

export type Driver = { id: string; code: string; number: string; givenName: string; familyName: string; nationality: string }
export type Race = { round: number; name: string; circuit: string; locality: string; country: string; date: string; time: string; qualifyingDate?: string; qualifyingTime?: string; sprintDate?: string; sprintTime?: string; sprintQualifyingDate?: string; sprintQualifyingTime?: string }
export type SessionType = 'qualifying' | 'race' | 'sprint-qualifying' | 'sprint'

async function api(path: string) {
  const res = await fetch(`${API}/${path}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('F1 data is temporarily unavailable')
  return res.json()
}

export async function getSchedule(): Promise<Race[]> {
  try {
    const data = await api(`${SEASON}.json`)
    return (data.MRData.RaceTable.Races ?? []).map((r: any) => ({ round: Number(r.round), name: r.raceName, circuit: r.Circuit.circuitName, locality: r.Circuit.Location.locality, country: r.Circuit.Location.country, date: r.date, time: r.time ?? '00:00:00Z', qualifyingDate: r.Qualifying?.date, qualifyingTime: r.Qualifying?.time, sprintDate: r.Sprint?.date, sprintTime: r.Sprint?.time, sprintQualifyingDate: r.SprintQualifying?.date, sprintQualifyingTime: r.SprintQualifying?.time }))
  } catch { return [] }
}

export async function getDrivers(): Promise<Driver[]> {
  try {
    const data = await api(`${SEASON}/drivers.json`)
    return (data.MRData.DriverTable.Drivers ?? []).map((d: any) => ({ id: d.driverId, code: d.code || d.familyName.slice(0, 3).toUpperCase(), number: d.permanentNumber ?? '—', givenName: d.givenName, familyName: d.familyName, nationality: d.nationality }))
  } catch { return [] }
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

export async function getOfficialResults(round: number, type: SessionType) {
  try {
    let rows: any[]
    if (type === 'qualifying') {
      const data = await api(`${SEASON}/${round}/qualifying.json`)
      rows = data.MRData.RaceTable.Races?.[0]?.QualifyingResults ?? []
    } else if (type === 'race') {
      const data = await api(`${SEASON}/${round}/results.json`)
      rows = data.MRData.RaceTable.Races?.[0]?.Results ?? []
    } else if (type === 'sprint') {
      const data = await api(`${SEASON}/${round}/sprint.json`)
      rows = data.MRData.RaceTable.Races?.[0]?.SprintResults ?? []
    } else {
      return []
    }
    return rows.slice(0, 10).map((r: any) => r.Driver.driverId) as string[]
  } catch (err) {
    console.error(`getOfficialResults failed for round ${round} ${type}:`, err)
    return []
  }
}
