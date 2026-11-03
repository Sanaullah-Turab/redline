import { resolveDriverId } from '@/lib/driver-mapping'
import { openF1ToDriver } from '@/lib/drivers/sync'
import type { Driver, ReferenceKind, Race } from '@/lib/f1'
import { getOpenF1Drivers, getOpenF1SessionResults, getOpenF1StartingGrid, resolveOpenF1Session, type OpenF1Driver } from '@/lib/openf1'

const FETCH_TIMEOUT_MS = 4000

export type ReferenceFetch = { positions: string[]; drivers: Driver[] }

function orderedIds(rows: Array<{ position: number | string | null; driver_number: number | string }>, metaByNumber: Map<number, OpenF1Driver>) {
  const seen = new Set<string>()
  const ids: string[] = []
  const newDrivers: Driver[] = []
  const sorted = rows
    .filter((row) => row.position != null && Number.isInteger(Number(row.position)) && Number(row.position) >= 1)
    .sort((a, b) => Number(a.position) - Number(b.position))
  for (const row of sorted) {
    const meta = metaByNumber.get(Number(row.driver_number))
    const id = resolveDriverId(row.driver_number, meta?.name_acronym, meta?.last_name)
    if (!id || seen.has(id)) continue
    seen.add(id)
    ids.push(id)
    const driver = meta ? openF1ToDriver(meta) : null
    if (driver) newDrivers.push(driver)
  }
  return { ids, newDrivers }
}

export async function getOpenF1Reference(season: number, round: number, kind: ReferenceKind, race: Race): Promise<ReferenceFetch | null> {
  const session = await resolveOpenF1Session(season, kind === 'grid' ? 'race' : 'practice-3', race, round)
  if (!session) return null
  const sessionEnd = session.date_end ? new Date(session.date_end).getTime() : NaN
  if (kind === 'practice-3' && (Number.isNaN(sessionEnd) || Date.now() < sessionEnd)) return null

  const [rows, drivers] = await Promise.all([
    kind === 'grid' ? getOpenF1StartingGrid(session.session_key, FETCH_TIMEOUT_MS) : getOpenF1SessionResults(session.session_key, FETCH_TIMEOUT_MS),
    getOpenF1Drivers(session.session_key, 600, FETCH_TIMEOUT_MS),
  ])
  if (!rows.length) return null
  const { ids, newDrivers } = orderedIds(rows, new Map(drivers.map((meta) => [Number(meta.driver_number), meta])))
  return ids.length ? { positions: ids, drivers: newDrivers } : null
}
