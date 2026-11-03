import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { roundDrivers } from '@/lib/db/schema'
import { BASE_DRIVERS, type Driver } from '@/lib/f1'

export type RoundDriverRow = typeof roundDrivers.$inferSelect

function toDriver(row: RoundDriverRow): Driver {
  return { id: row.driverId, code: row.code, number: row.number, givenName: row.givenName, familyName: row.familyName, nationality: row.nationality, replaces: row.replaces ?? undefined }
}

export function mergeRoundDrivers(rows: RoundDriverRow[]): Driver[] {
  const baseIds = new Set(BASE_DRIVERS.map((driver) => driver.id))
  const withdrawn = new Set(rows.filter((row) => row.status === 'withdrawn').map((row) => row.driverId))
  const extras = rows
    .filter((row) => row.status === 'entered' && !baseIds.has(row.driverId))
    .sort((a, b) => Number(a.number) - Number(b.number))
    .map(toDriver)
  return [...BASE_DRIVERS.filter((driver) => !withdrawn.has(driver.id)), ...extras]
}

export async function getRoundDriverRows(season: number, round: number) {
  return db.select().from(roundDrivers).where(and(eq(roundDrivers.season, season), eq(roundDrivers.round, round)))
}

export async function getRoundDrivers(season: number, round: number): Promise<Driver[]> {
  return mergeRoundDrivers(await getRoundDriverRows(season, round))
}

export async function getDriverCatalog(season: number): Promise<Map<string, Driver>> {
  const rows = await db.select().from(roundDrivers).where(eq(roundDrivers.season, season))
  const catalog = new Map(BASE_DRIVERS.map((driver) => [driver.id, driver]))
  for (const row of rows) if (!catalog.has(row.driverId)) catalog.set(row.driverId, toDriver(row))
  return catalog
}

export async function registerDrivers(season: number, round: number, drivers: Driver[], source: RoundDriverRow['source']) {
  const baseIds = new Set(BASE_DRIVERS.map((driver) => driver.id))
  const fresh = drivers.filter((driver) => driver.id && !baseIds.has(driver.id))
  if (!fresh.length) return
  await db
    .insert(roundDrivers)
    .values(fresh.map((driver) => ({ season, round, driverId: driver.id, code: driver.code, number: driver.number, givenName: driver.givenName, familyName: driver.familyName, nationality: driver.nationality, replaces: driver.replaces ?? null, source })))
    .onConflictDoNothing()
}
