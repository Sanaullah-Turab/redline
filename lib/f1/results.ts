import { normalizeDriverId, resolveDriverId } from '@/lib/driver-mapping'
import { getFastF1OfficialResults } from '@/lib/fastf1'
import { getOpenF1OfficialResults } from '@/lib/openf1'
import { api, SEASON } from './client'
import { getSchedule } from './schedule'
import type { OfficialResult, OfficialResultOutcome, Race, SessionType } from './types'

function rowDriverId(row: any): string {
  return (
    normalizeDriverId(row?.Driver?.driverId) ||
    resolveDriverId(row?.number ?? row?.Driver?.permanentNumber, row?.Driver?.code, row?.Driver?.familyName) ||
    ''
  )
}

function parseJolpicaClassification(rawRows: any[], type: SessionType): { result: OfficialResult | null; reason?: string } {
  if (!Array.isArray(rawRows) || rawRows.length < 10) {
    return { result: null, reason: 'empty result' }
  }

  const positions: string[] = []
  for (let pos = 1; pos <= 10; pos++) {
    const matches = rawRows.filter((r: any) => {
      const p = Number(r?.position)
      return Number.isInteger(p) && p === pos
    })
    if (matches.length === 0) return { result: null, reason: 'incomplete result' }
    if (matches.length > 1) return { result: null, reason: 'duplicate position in result' }

    const row = matches[0]
    if (row.positionText != null && String(row.positionText).trim() !== '' && Number(row.positionText) !== pos) {
      return { result: null, reason: 'invalid position text' }
    }
    if (type === 'qualifying' && row.Q1 === '' && Boolean(row.Q2 || row.Q3)) {
      return { result: null, reason: 'incomplete qualifying times' }
    }

    const driverId = rowDriverId(row)
    if (!driverId) return { result: null, reason: 'incomplete result' }
    positions.push(driverId)
  }

  if (positions.length !== 10 || new Set(positions).size !== 10) {
    return { result: null, reason: 'incomplete result' }
  }

  const driverCounts = new Map<string, number>()
  for (const r of rawRows) {
    const id = rowDriverId(r)
    if (id) driverCounts.set(id, (driverCounts.get(id) ?? 0) + 1)
  }
  if (positions.some((id) => (driverCounts.get(id) ?? 0) !== 1)) {
    return { result: null, reason: 'duplicate driver in result' }
  }

  const sortedRows = [...rawRows]
    .filter((r: any) => {
      const p = Number(r?.position)
      return Number.isInteger(p) && p >= 1
    })
    .sort((a: any, b: any) => Number(a.position) - Number(b.position))

  const allClassified = Array.from(
    new Set(sortedRows.map((r: any) => rowDriverId(r)).filter(Boolean))
  )

  return { result: { positions, allClassified } }
}

export async function getOfficialResults(season: number, round: number, type: SessionType, raceEvent?: Race): Promise<OfficialResultOutcome> {
  try {
    let endpoint = ''
    if (type === 'qualifying') endpoint = `${season}/${round}/qualifying.json`
    else if (type === 'race') endpoint = `${season}/${round}/results.json`
    else if (type === 'sprint') endpoint = `${season}/${round}/sprint.json`

    let jolpicaOutcome = ''
    if (endpoint) {
      try {
        const res = await api(endpoint, { timeoutMs: 4000 })
        if (!res.ok) {
          jolpicaOutcome = String(res.status || 'error')
        } else if (res.data) {
          const race = res.data.MRData?.RaceTable?.Races?.[0]
          if (!race || Number(race.season) !== season || Number(race.round) !== round) {
            jolpicaOutcome = 'empty result'
          } else {
            const rawRows: any[] = (type === 'qualifying' ? race.QualifyingResults : type === 'race' ? race.Results : race.SprintResults) ?? []
            const parsed = parseJolpicaClassification(rawRows, type)
            if (parsed.result) return { result: parsed.result }
            jolpicaOutcome = parsed.reason || 'incomplete result'
          }
        } else {
          jolpicaOutcome = 'empty result'
        }
      } catch {
        jolpicaOutcome = 'error'
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

    const fastF1 = await getFastF1OfficialResults(season, round, type)
    if (fastF1.result) return { result: fastF1.result }

    const openF1Part = openF1.resolved
      ? `OpenF1 session ${openF1.sessionKey} resolved (${openF1.classifiedCount} classified)`
      : `OpenF1 session not resolved (${openF1.classifiedCount} classified)`
    const fastF1Part = fastF1.resolved ? 'FastF1 incomplete' : 'FastF1 unavailable'
    const pendingReason = `Jolpica ${jolpicaOutcome}; ${openF1Part}; ${fastF1Part}`

    return { result: null, pendingReason }
  } catch {
    return { result: null, pendingReason: 'Error fetching official results' }
  }
}
