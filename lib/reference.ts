import { getClassification, saveClassification, type ClassificationSource } from '@/lib/classifications'
import { registerDrivers } from '@/lib/drivers/round-drivers'
import { sessionStart, thirdPracticeStart, type Race, type ReferenceKind } from '@/lib/f1'
import { getFastF1Reference } from '@/lib/fastf1'
import { getOpenF1Reference } from '@/lib/openf1-reference'

const PRIORITY: ClassificationSource[] = ['manual', 'openf1', 'fastf1']
const GRID_REFRESH_MS = 15 * 60 * 1000
const PRACTICE_MS = 60 * 60 * 1000
const QUALIFYING_MS = 60 * 60 * 1000

export type Shortcut =
  | { status: 'ready'; positions: string[]; source: ClassificationSource }
  | { status: 'unavailable'; reason: string }
  | { status: 'not-applicable' }

export const REFERENCE_LABELS: Record<ReferenceKind, string> = { 'practice-3': 'Free Practice 3', grid: 'Starting Grid' }

function sourceReadyAt(race: Race, kind: ReferenceKind): number {
  return (kind === 'practice-3' ? thirdPracticeStart(race).getTime() + PRACTICE_MS : sessionStart(race, 'qualifying').getTime() + QUALIFYING_MS)
}

export async function refreshReference(season: number, race: Race, kind: ReferenceKind): Promise<boolean> {
  try {
    const fetched = await getOpenF1Reference(season, race.round, kind, race)
    if (fetched) {
      await Promise.all([saveClassification(season, race.round, kind, 'openf1', fetched.positions), registerDrivers(season, race.round, fetched.drivers, 'openf1')])
      return true
    }
    const fastF1 = await getFastF1Reference(season, race.round, kind)
    if (fastF1) {
      await Promise.all([saveClassification(season, race.round, kind, 'fastf1', fastF1.positions), registerDrivers(season, race.round, fastF1.drivers, 'openf1')])
      return true
    }
    return false
  } catch {
    return false
  }
}

export async function getShortcut(season: number, race: Race, kind: ReferenceKind, now: Date = new Date()): Promise<Shortcut> {
  if (kind === 'practice-3' && !race.thirdPracticeDate) return { status: 'not-applicable' }
  const readyAt = sourceReadyAt(race, kind)
  const label = REFERENCE_LABELS[kind]
  const stored = await getClassification(season, race.round, kind, PRIORITY)

  if (stored?.source === 'manual') return { status: 'ready', positions: stored.positions, source: stored.source }
  if (Number.isFinite(readyAt) && now.getTime() < readyAt) {
    return stored ? { status: 'ready', positions: stored.positions, source: stored.source } : { status: 'unavailable', reason: kind === 'grid' ? 'The starting grid is published after qualifying.' : 'Free Practice 3 has not finished yet.' }
  }

  const raceStart = sessionStart(race, 'race').getTime()
  const gridMayChange = kind === 'grid' && (Number.isNaN(raceStart) || now.getTime() < raceStart)
  const stale = !stored || (gridMayChange && now.getTime() - stored.fetchedAt.getTime() > GRID_REFRESH_MS)
  if (stale && (await refreshReference(season, race, kind))) {
    const fresh = await getClassification(season, race.round, kind, PRIORITY)
    if (fresh) return { status: 'ready', positions: fresh.positions, source: fresh.source }
  }
  return stored ? { status: 'ready', positions: stored.positions, source: stored.source } : { status: 'unavailable', reason: `${label} results are not available yet.` }
}
