import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { promisify } from 'node:util'
import { getClassification, saveClassification } from '@/lib/classifications'
import { resolveDriverId } from '@/lib/driver-mapping'
import { registerDrivers } from '@/lib/drivers/round-drivers'
import type { Driver, OfficialResult, ReferenceKind, SessionType } from '@/lib/f1'

const execFileAsync = promisify(execFile)
const BRIDGE_PATH = path.join(process.cwd(), 'scripts', 'fastf1_bridge.py')
const PYTHON_CANDIDATES = [
  process.env.FASTF1_PYTHON_BIN,
  '/tmp/w/fv/bin/python',
  '/usr/bin/python3',
  'python3',
].filter((item): item is string => Boolean(item))

type BridgeRow = {
  position: number
  number: string
  code: string
  firstName: string
  lastName: string
  fullName: string
}

function resolvePythonBin(): string | null {
  if (process.env.FASTF1_ENABLED === 'false') return null
  for (const candidate of PYTHON_CANDIDATES) {
    if (!candidate.startsWith('/') || existsSync(candidate)) return candidate
  }
  return null
}

async function runFastF1Bridge(season: number, round: number, kind: SessionType | ReferenceKind): Promise<{ positions: string[]; drivers: Driver[] } | null> {
  const pythonBin = resolvePythonBin()
  if (!pythonBin || !existsSync(BRIDGE_PATH)) return null
  try {
    const { stdout } = await execFileAsync(
      pythonBin,
      [BRIDGE_PATH, '--season', String(season), '--round', String(round), '--kind', kind],
      { timeout: 12000, maxBuffer: 1024 * 1024, windowsHide: true }
    )
    const parsed = JSON.parse(stdout.trim()) as { ok?: boolean; drivers?: BridgeRow[] }
    if (!parsed.ok || !Array.isArray(parsed.drivers) || parsed.drivers.length === 0) return null
    const seen = new Set<string>()
    const positions: string[] = []
    const drivers: Driver[] = []
    const sorted = [...parsed.drivers].sort((a, b) => a.position - b.position)
    for (const row of sorted) {
      const id = resolveDriverId(row.number, row.code, row.lastName)
      if (!id || seen.has(id)) continue
      seen.add(id)
      positions.push(id)
      if (row.number && (row.lastName || row.code)) {
        drivers.push({
          id,
          code: (row.code || row.lastName.slice(0, 3)).toUpperCase(),
          number: row.number,
          givenName: row.firstName,
          familyName: row.lastName || row.code,
          nationality: '',
        })
      }
    }
    return positions.length > 0 ? { positions, drivers } : null
  } catch {
    return null
  }
}

export async function getFastF1OfficialResults(season: number, round: number, sessionType: SessionType): Promise<{ result: OfficialResult | null; resolved: boolean }> {
  const stored = await getClassification(season, round, sessionType, ['manual', 'fastf1'])
  if (stored && stored.positions.length >= 10) {
    const unique = Array.from(new Set(stored.positions))
    if (unique.length >= 10) {
      return { result: { positions: unique.slice(0, 10), allClassified: unique }, resolved: true }
    }
  }
  const fetched = await runFastF1Bridge(season, round, sessionType)
  if (!fetched || fetched.positions.length < 10) return { result: null, resolved: Boolean(fetched) }
  await Promise.all([
    saveClassification(season, round, sessionType, 'fastf1', fetched.positions),
    registerDrivers(season, round, fetched.drivers, 'openf1'),
  ])
  return {
    result: { positions: fetched.positions.slice(0, 10), allClassified: fetched.positions },
    resolved: true,
  }
}

export async function getFastF1Reference(season: number, round: number, kind: ReferenceKind): Promise<{ positions: string[]; drivers: Driver[] } | null> {
  return runFastF1Bridge(season, round, kind)
}

