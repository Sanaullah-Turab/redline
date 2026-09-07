'use server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { predictions } from '@/lib/db/schema'
import { getDrivers, getSchedule, isSprint, SEASON, sessionStart, type SessionType } from '@/lib/f1'
import { and, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

const VALID_TYPES: SessionType[] = ['qualifying', 'race', 'sprint-qualifying', 'sprint']

async function getUser() { const session = await auth.api.getSession({ headers: await headers() }); if (!session?.user) throw new Error('Please sign in'); return { id: session.user.id, name: session.user.name } }

export async function savePrediction(round: number, type: SessionType, positions: string[]) {
  const { id, name: userName } = await getUser()
  if (!Number.isInteger(round) || !VALID_TYPES.includes(type)) throw new Error('Invalid prediction')
  const [schedule, drivers] = await Promise.all([getSchedule(), getDrivers()])
  const event = schedule.find((race) => race.round === round)
  if (!event) throw new Error('Predictions are locked for this session')
  if ((type === 'sprint' || type === 'sprint-qualifying') && !isSprint(event)) throw new Error('This round is not a sprint weekend')
  if (new Date() >= sessionStart(event, type)) throw new Error('Predictions are locked for this session')
  const valid = new Set(drivers.map((driver) => driver.id))
  if (positions.length !== 10 || new Set(positions).size !== 10 || positions.some((position) => !valid.has(position))) throw new Error('Choose 10 unique drivers')
  await db.insert(predictions).values({ userId: id, userName, season: SEASON, round, sessionType: type, positions, updatedAt: new Date() }).onConflictDoUpdate({ target: [predictions.userId, predictions.season, predictions.round, predictions.sessionType], set: { positions, userName, points: 0, scored: false, updatedAt: new Date() } })
  revalidatePath(`/predict/${round}`); revalidatePath('/')
  return { ok: true }
}

export async function getMyPrediction(round: number, type: SessionType) {
  const { id } = await getUser()
  const row = await db.query.predictions.findFirst({
    where: and(eq(predictions.userId, id), eq(predictions.season, SEASON), eq(predictions.round, round), eq(predictions.sessionType, type)),
  })
  return row ?? null
}
