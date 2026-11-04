import { areDriversEquivalent, normalizeDriverId } from '@/lib/driver-mapping'
import { getDriverCatalog } from '@/lib/drivers/round-drivers'
import { formatRaceWeekend, getSchedule, isSprint, SEASON, sessionLabel, type Driver, type SessionType } from '@/lib/f1'
import { getSeasonEventResults, getSeasonPredictions } from './my-stats'

const SESSION_SORT: Record<string, number> = {
  'sprint-qualifying': 1,
  sprint: 2,
  qualifying: 3,
  race: 4,
}

export type PickComparisonRow = {
  position: number
  predictedId: string
  predictedCode: string
  predictedName: string
  predictedNumber: string
  isReplacement: boolean
  actualId: string | null
  actualCode: string | null
  actualName: string | null
  exactHit: boolean
  finishedPosition: number | null
}

export type WeekendSessionPicks = {
  sessionType: SessionType
  sessionName: string
  isSprint: boolean
  scored: boolean
  points: number
  hasOfficialResult: boolean
  submittedAt: string
  rows: PickComparisonRow[]
}

export type WeekendPicksGroup = {
  round: number
  raceName: string
  country: string
  circuit: string
  dateLabel: string
  isSprintWeekend: boolean
  totalPoints: number
  maxPossiblePoints: number
  scoredSessionsCount: number
  sessions: WeekendSessionPicks[]
}

function describeDriver(id: string, catalog: Map<string, Driver>) {
  const norm = normalizeDriverId(id)
  const driver = catalog.get(norm)
  if (driver) {
    return {
      id: norm,
      code: driver.code,
      name: `${driver.givenName} ${driver.familyName}`.trim(),
      number: driver.number,
      isReplacement: Boolean(driver.replaces),
    }
  }
  return {
    id: norm,
    code: norm.slice(0, 3).toUpperCase(),
    name: norm.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    number: '--',
    isReplacement: false,
  }
}

export async function getUserWeekendPicks(userId: string, options?: { scoredOnly?: boolean }): Promise<WeekendPicksGroup[]> {
  const [allPreds, allResults, schedule, catalog] = await Promise.all([
    getSeasonPredictions(),
    getSeasonEventResults(),
    getSchedule(SEASON),
    getDriverCatalog(SEASON),
  ])
  const userPreds = allPreds
    .filter((row) => row.userId === userId && (!options?.scoredOnly || row.scored))
    .sort((a, b) => b.round - a.round)

  const resultsMap = new Map<string, string[]>()
  for (const res of allResults) {
    resultsMap.set(`${res.round}:${res.sessionType}`, res.positions.map(normalizeDriverId))
  }
  const raceMap = new Map(schedule.map((race) => [race.round, race]))

  const byRound = new Map<number, typeof userPreds>()
  for (const row of userPreds) {
    const list = byRound.get(row.round) ?? []
    list.push(row)
    byRound.set(row.round, list)
  }

  const groups: WeekendPicksGroup[] = []
  for (const [round, rows] of byRound.entries()) {
    const race = raceMap.get(round)
    const sortedRows = [...rows].sort((a, b) => (SESSION_SORT[a.sessionType] ?? 9) - (SESSION_SORT[b.sessionType] ?? 9))
    const sessions: WeekendSessionPicks[] = sortedRows.map((entry) => {
      const official = resultsMap.get(`${entry.round}:${entry.sessionType}`) ?? []
      const hasOfficialResult = official.length === 10
      const comparisonRows: PickComparisonRow[] = entry.positions.slice(0, 10).map((pickId, index) => {
        const pred = describeDriver(pickId, catalog)
        const actualRaw = official[index]
        const actual = actualRaw ? describeDriver(actualRaw, catalog) : null
        const exactHit = Boolean(actualRaw && areDriversEquivalent(pickId, actualRaw))
        const finishedIdx = hasOfficialResult ? official.findIndex((o) => areDriversEquivalent(o, pickId)) : -1
        return {
          position: index + 1,
          predictedId: pred.id,
          predictedCode: pred.code,
          predictedName: pred.name,
          predictedNumber: pred.number,
          isReplacement: pred.isReplacement,
          actualId: actual?.id ?? null,
          actualCode: actual?.code ?? null,
          actualName: actual?.name ?? null,
          exactHit,
          finishedPosition: finishedIdx >= 0 ? finishedIdx + 1 : null,
        }
      })

      const sessionType = entry.sessionType as SessionType
      return {
        sessionType,
        sessionName: sessionLabel(sessionType) ?? entry.sessionType,
        isSprint: sessionType === 'sprint' || sessionType === 'sprint-qualifying',
        scored: entry.scored,
        points: entry.points,
        hasOfficialResult,
        submittedAt: entry.updatedAt.toISOString(),
        rows: comparisonRows,
      }
    })

    const scoredSessions = sessions.filter((s) => s.scored)
    const totalPoints = scoredSessions.reduce((sum, s) => sum + s.points, 0)

    groups.push({
      round,
      raceName: race?.name ?? `Round ${round}`,
      country: race?.country ?? '',
      circuit: race?.circuit ?? '',
      dateLabel: race?.date ? formatRaceWeekend(race.date, { includeYear: true }) : `Round ${round}`,
      isSprintWeekend: race ? isSprint(race) : sessions.some((s) => s.isSprint),
      totalPoints,
      maxPossiblePoints: scoredSessions.length * 10,
      scoredSessionsCount: scoredSessions.length,
      sessions,
    })
  }

  return groups.sort((a, b) => b.round - a.round)
}

