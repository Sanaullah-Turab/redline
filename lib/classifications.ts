import { and, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { sessionClassifications } from '@/lib/db/schema'

export type ClassificationSource = 'manual' | 'openf1' | 'fastf1'

export type StoredClassification = { positions: string[]; source: ClassificationSource; fetchedAt: Date }

export function pickClassification(rows: StoredClassification[], priority: ClassificationSource[]): StoredClassification | null {
  for (const source of priority) {
    const match = rows.find((row) => row.source === source && row.positions.length > 0)
    if (match) return match
  }
  return null
}

export async function getClassification(season: number, round: number, sessionType: string, priority: ClassificationSource[]): Promise<StoredClassification | null> {
  const rows = await db
    .select({ positions: sessionClassifications.positions, source: sessionClassifications.source, fetchedAt: sessionClassifications.fetchedAt })
    .from(sessionClassifications)
    .where(and(eq(sessionClassifications.season, season), eq(sessionClassifications.round, round), eq(sessionClassifications.sessionType, sessionType), inArray(sessionClassifications.source, priority)))
  return pickClassification(rows, priority)
}

export async function saveClassification(season: number, round: number, sessionType: string, source: ClassificationSource, positions: string[]) {
  const unique = Array.from(new Set(positions.filter(Boolean)))
  if (!unique.length) return
  await db
    .insert(sessionClassifications)
    .values({ season, round, sessionType, source, positions: unique })
    .onConflictDoUpdate({ target: [sessionClassifications.season, sessionClassifications.round, sessionClassifications.sessionType, sessionClassifications.source], set: { positions: unique, fetchedAt: new Date() } })
}

export async function deleteClassification(season: number, round: number, sessionType: string, source: ClassificationSource) {
  await db
    .delete(sessionClassifications)
    .where(and(eq(sessionClassifications.season, season), eq(sessionClassifications.round, round), eq(sessionClassifications.sessionType, sessionType), eq(sessionClassifications.source, source)))
}
