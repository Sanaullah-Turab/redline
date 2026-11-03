import { resolveDriverId } from '@/lib/driver-mapping'
import { type Driver, type Race } from '@/lib/f1'
import { getOpenF1Drivers, getOpenF1Sessions, resolveOpenF1Session, type OpenF1Driver, type OpenF1Kind } from '@/lib/openf1'
import { registerDrivers } from './round-drivers'

const WEEKEND_KINDS: OpenF1Kind[] = ['practice-1', 'practice-2', 'practice-3', 'sprint-qualifying', 'sprint', 'qualifying', 'race']

function titleCase(value: string) {
  return value.toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (_, separator: string, letter: string) => separator + letter.toUpperCase())
}

export function openF1ToDriver(meta: OpenF1Driver): Driver | null {
  const id = resolveDriverId(meta.driver_number, meta.name_acronym, meta.last_name)
  if (!id) return null
  const [first = '', ...rest] = (meta.full_name ?? '').split(' ')
  const familyName = meta.last_name || titleCase(rest.join(' ')) || meta.name_acronym
  return {
    id,
    code: (meta.name_acronym || familyName.slice(0, 3)).toUpperCase(),
    number: String(meta.driver_number),
    givenName: meta.first_name || titleCase(first),
    familyName,
    nationality: '',
  }
}

export async function fetchWeekendEntries(season: number, race: Race): Promise<Driver[]> {
  const sessions = await getOpenF1Sessions(season)
  if (!sessions.length) return []
  const now = Date.now()
  const resolved = await Promise.all(WEEKEND_KINDS.map((kind) => resolveOpenF1Session(season, kind, race, race.round, sessions)))
  const started = resolved.filter((session): session is NonNullable<typeof session> => Boolean(session) && new Date(session!.date_start).getTime() <= now)
  if (!started.length) return []
  const sampleKeys = Array.from(new Set([started[0].session_key, started[started.length - 1].session_key]))
  const lists = await Promise.all(sampleKeys.map((key) => getOpenF1Drivers(key, 600, 4000)))
  const entries = new Map<string, Driver>()
  for (const meta of lists.flat()) {
    const driver = openF1ToDriver(meta)
    if (driver && !entries.has(driver.id)) entries.set(driver.id, driver)
  }
  return [...entries.values()]
}

export async function syncRoundDrivers(season: number, race: Race): Promise<void> {
  try {
    await registerDrivers(season, race.round, await fetchWeekendEntries(season, race), 'openf1')
  } catch {
    return
  }
}
