'use server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { predictions } from '@/lib/db/schema'
import { getDrivers, getSchedule, SEASON, sessionStart } from '@/lib/f1'
import { and, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function userId() { const session = await auth.api.getSession({ headers: await headers() }); if (!session?.user) throw new Error('Please sign in'); return session.user.id }

export async function savePrediction(round: number, type: 'qualifying' | 'race', positions: string[]) {
  const id = await userId()
  if (!Number.isInteger(round) || !['qualifying', 'race'].includes(type)) throw new Error('Invalid prediction')
  const [schedule, drivers] = await Promise.all([getSchedule(), getDrivers()])
  const event = schedule.find((race) => race.round === round)
  if (!event || new Date() >= sessionStart(event, type)) throw new Error('Predictions are locked for this session')
  const valid = new Set(drivers.map((driver) => driver.id))
  if (positions.length !== 10 || new Set(positions).size !== 10 || positions.some((position) => !valid.has(position))) throw new Error('Choose 10 unique drivers')
  await db.insert(predictions).values({ userId: id, season: SEASON, round, sessionType: type, positions, updatedAt: new Date() }).onConflictDoUpdate({ target: [predictions.userId, predictions.season, predictions.round, predictions.sessionType], set: { positions, points: 0, scored: false, updatedAt: new Date() } })
  revalidatePath(`/predict/${round}`); revalidatePath('/')
  return { ok: true }
}

export async function getMyPrediction(round: number, type: 'qualifying' | 'race') {
  const id = await userId()
  const rows = await db.select().from(predictions).where(and(eq(predictions.userId, id), eq(predictions.season, SEASON), eq(predictions.round, round), eq(predictions.sessionType, type))).limit(1)
  return rows[0] ?? null
}
