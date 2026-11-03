'use server'
import { and, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getAdminSession } from '@/lib/admin'
import { deleteClassification, saveClassification } from '@/lib/classifications'
import { db } from '@/lib/db'
import { predictions, roundDrivers } from '@/lib/db/schema'
import { deriveDriverId } from '@/lib/driver-mapping'
import { getDriverCatalog, getRoundDrivers } from '@/lib/drivers/round-drivers'
import { getSchedule, SEASON, type ReferenceKind } from '@/lib/f1'
import { refreshReference } from '@/lib/reference'
import { allPredictionsLocked } from '@/lib/round-state'

type ActionResult = { ok: true } | { ok: false; error: string }

const KINDS: ReferenceKind[] = ['practice-3', 'grid']

async function authorize(round: number, options: { requireOpen?: boolean } = {}) {
  if (!(await getAdminSession())) throw new Error('Not authorized')
  if (!Number.isInteger(round) || round < 1) throw new Error('Invalid round')
  const race = (await getSchedule(SEASON)).find((entry) => entry.round === round)
  if (!race) throw new Error('Round not found')
  if (options.requireOpen && allPredictionsLocked(race)) throw new Error('Predictions for this round are locked')
  return race
}

async function run(action: () => Promise<void>): Promise<ActionResult> {
  try {
    await action()
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Something went wrong' }
  }
}

function clean(value: unknown, max = 40) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export async function addRoundDriver(round: number, input: { number: string; code: string; givenName: string; familyName: string; nationality?: string; replaces?: string }) {
  return run(async () => {
    await authorize(round, { requireOpen: true })
    const number = clean(input.number, 3)
    const code = clean(input.code, 3).toUpperCase()
    const givenName = clean(input.givenName)
    const familyName = clean(input.familyName)
    if (!/^\d{1,3}$/.test(number)) throw new Error('Enter a valid car number')
    if (!/^[A-Z]{3}$/.test(code)) throw new Error('Driver code must be three letters')
    if (!givenName || !familyName) throw new Error('Enter the full name')
    const id = deriveDriverId(familyName)
    if (!id) throw new Error('Invalid driver name')
    const catalog = await getDriverCatalog(SEASON)
    const existing = catalog.get(id)
    if (existing && existing.number !== number) throw new Error('Another driver already uses that name id')
    const replaces = clean(input.replaces) || null
    if (replaces && !catalog.has(replaces)) throw new Error('Unknown driver to replace')
    await db
      .insert(roundDrivers)
      .values({ season: SEASON, round, driverId: id, code, number, givenName, familyName, nationality: clean(input.nationality), replaces, status: 'entered', source: 'manual' })
      .onConflictDoUpdate({ target: [roundDrivers.season, roundDrivers.round, roundDrivers.driverId], set: { code, number, givenName, familyName, nationality: clean(input.nationality), replaces, status: 'entered', source: 'manual' } })
    revalidatePath(`/predict/${round}`); revalidatePath(`/admin/${round}`)
  })
}

export async function setDriverEntry(round: number, driverId: string, entered: boolean) {
  return run(async () => {
    await authorize(round, { requireOpen: true })
    const current = await getRoundDrivers(SEASON, round)
    const catalog = await getDriverCatalog(SEASON)
    const driver = catalog.get(driverId)
    if (!driver) throw new Error('Unknown driver')
    if (!entered) {
      if (current.length <= 10) throw new Error('At least 10 drivers must stay entered')
      const [used] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(predictions)
        .where(and(eq(predictions.season, SEASON), eq(predictions.round, round), sql`${predictions.positions} ? ${driverId}`))
      if ((used?.count ?? 0) > 0) throw new Error('Existing predictions already include this driver')
      await db
        .insert(roundDrivers)
        .values({ season: SEASON, round, driverId, code: driver.code, number: driver.number, givenName: driver.givenName, familyName: driver.familyName, nationality: driver.nationality, replaces: driver.replaces ?? null, status: 'withdrawn', source: 'manual' })
        .onConflictDoUpdate({ target: [roundDrivers.season, roundDrivers.round, roundDrivers.driverId], set: { status: 'withdrawn', source: 'manual' } })
    } else {
      await db.update(roundDrivers).set({ status: 'entered', source: 'manual' }).where(and(eq(roundDrivers.season, SEASON), eq(roundDrivers.round, round), eq(roundDrivers.driverId, driverId)))
    }
    revalidatePath(`/predict/${round}`); revalidatePath(`/admin/${round}`)
  })
}

export async function saveReferenceOrder(round: number, kind: ReferenceKind, positions: string[]) {
  return run(async () => {
    await authorize(round)
    if (!KINDS.includes(kind)) throw new Error('Invalid reference type')
    if (!Array.isArray(positions) || positions.length !== 10 || new Set(positions).size !== 10) throw new Error('Choose 10 unique drivers')
    const catalog = await getDriverCatalog(SEASON)
    if (positions.some((id) => !catalog.has(id))) throw new Error('Unknown driver in order')
    await saveClassification(SEASON, round, kind, 'manual', positions)
    revalidatePath(`/predict/${round}`); revalidatePath(`/admin/${round}`)
  })
}

export async function clearReferenceOrder(round: number, kind: ReferenceKind) {
  return run(async () => {
    const race = await authorize(round)
    if (!KINDS.includes(kind)) throw new Error('Invalid reference type')
    await deleteClassification(SEASON, round, kind, 'manual')
    await refreshReference(SEASON, race, kind)
    revalidatePath(`/predict/${round}`); revalidatePath(`/admin/${round}`)
  })
}

export async function refreshReferenceOrder(round: number, kind: ReferenceKind) {
  return run(async () => {
    const race = await authorize(round)
    if (!KINDS.includes(kind)) throw new Error('Invalid reference type')
    if (!(await refreshReference(SEASON, race, kind))) throw new Error('OpenF1 has no data for this session yet')
    revalidatePath(`/predict/${round}`); revalidatePath(`/admin/${round}`)
  })
}
