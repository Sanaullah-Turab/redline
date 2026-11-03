import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { eventResults, predictions } from '@/lib/db/schema'
import { areDriversEquivalent, normalizeDriverId } from '@/lib/driver-mapping'
import { getDriverCatalog } from '@/lib/drivers/round-drivers'
import { getSchedule, SEASON, sessionLabel, type Driver, type SessionType } from '@/lib/f1'
import { accuracy, getStandings, rankStandings } from './standings'

export const MIN_DRIVER_PICKS = 3

const SESSION_ORDER: Record<string, number> = {
  'sprint-qualifying': 1,
  sprint: 2,
  qualifying: 3,
  race: 4,
}

export type MyStatsRoundBar = {
  round: number
  raceName: string
  qualifying: number
  race: number
  sprint: number
  total: number
  gridAvg: number
}

export type PositionAccuracyBar = {
  position: number
  label: string
  hits: number
  attempts: number
  percentage: number
}

export type SessionHitMarker = {
  position: number
  predictedCode: string
  actualCode: string
  hit: boolean
}

export type RecentSessionItem = {
  round: number
  raceName: string
  sessionType: SessionType
  sessionName: string
  points: number
  markers: SessionHitMarker[]
}

export type DriverHitStat = {
  driverId: string
  code: string
  name: string
  hits: number
  picked: number
  percentage: number
  isReplacement: boolean
}

export type HeadToHeadRow = {
  rivalId: string
  rivalName: string
  rivalRank: number
  won: number
  lost: number
  tied: number
  total: number
}

export type MyStatsData = {
  userId: string
  userName: string
  hasScoredSessions: boolean
  rank: number
  totalPlayers: number
  totalPoints: number
  gapLabel: string
  accuracy: number
  correctPicks: number
  totalPicks: number
  avgScore: string
  bestSession: {
    points: number
    label: string
  }
  recentForm: {
    average: string
    diffLabel: string
    trend: 'up' | 'down' | 'even'
  }
  qualifyingAccuracy: {
    percentage: number
    avgLabel: string
    sessions: number
  }
  raceAccuracy: {
    percentage: number
    avgLabel: string
    sessions: number
  }
  pointsPerRound: MyStatsRoundBar[]
  seasonGridAvg: number
  positionAccuracy: PositionAccuracyBar[]
  recentSessions: RecentSessionItem[]
  mostCorrectDrivers: DriverHitStat[]
  mostMissedDrivers: DriverHitStat[]
  headToHead: HeadToHeadRow[]
}

function resolveDriverDisplay(id: string, catalog: Map<string, Driver>) {
  const norm = normalizeDriverId(id)
  const found = catalog.get(norm)
  if (found) {
    return {
      code: found.code,
      name: found.familyName,
      isReplacement: Boolean(found.replaces),
    }
  }
  return {
    code: norm.slice(0, 3).toUpperCase(),
    name: norm.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    isReplacement: false,
  }
}

export async function getMyStats(userId: string): Promise<MyStatsData | null> {
  const [standings, schedule, allPreds, allResults, catalog] = await Promise.all([
    getStandings(),
    getSchedule(SEASON),
    db.select().from(predictions).where(eq(predictions.season, SEASON)),
    db.select().from(eventResults).where(eq(eventResults.season, SEASON)),
    getDriverCatalog(SEASON),
  ])

  const ranked = rankStandings(standings)
  const meIndex = ranked.findIndex((row) => row.id === userId)
  if (meIndex === -1) return null
  const me = ranked[meIndex]

  const resultsMap = new Map<string, string[]>()
  for (const res of allResults) {
    resultsMap.set(`${res.round}:${res.sessionType}`, res.positions.map(normalizeDriverId))
  }
  const raceByRound = new Map(schedule.map((race) => [race.round, race]))

  const myScored = allPreds
    .filter((row) => row.userId === userId && row.scored)
    .sort((a, b) => b.round - a.round || (SESSION_ORDER[b.sessionType] ?? 0) - (SESSION_ORDER[a.sessionType] ?? 0))

  let gapLabel = 'Season leader'
  if (ranked.length > 1) {
    if (me.rank === 1) {
      const runnerUp = ranked.find((row) => row.id !== userId)
      const lead = runnerUp ? me.points - runnerUp.points : 0
      gapLabel = lead > 0 ? `${lead} ahead of 2nd` : 'Tied for 1st'
    } else {
      const gapToFirst = ranked[0].points - me.points
      gapLabel = gapToFirst > 0 ? `${gapToFirst} behind 1st` : 'Tied for 1st'
    }
  }

  const totalPicks = myScored.length * 10
  const avgNum = myScored.length > 0 ? me.points / myScored.length : 0

  const bestSorted = [...myScored].sort(
    (a, b) => b.points - a.points || b.round - a.round || (SESSION_ORDER[b.sessionType] ?? 0) - (SESSION_ORDER[a.sessionType] ?? 0)
  )
  const bestRow = bestSorted[0]
  const bestSession = bestRow
    ? { points: bestRow.points, label: `Round ${bestRow.round} - ${sessionLabel(bestRow.sessionType as SessionType)}` }
    : { points: 0, label: 'No scored sessions yet' }

  const recent5 = myScored.slice(0, 5)
  const recentAvgNum = recent5.length > 0 ? recent5.reduce((sum, row) => sum + row.points, 0) / recent5.length : 0
  const rawDiff = Math.round((recentAvgNum - avgNum) * 10) / 10
  const trend: 'up' | 'down' | 'even' = rawDiff > 0 ? 'up' : rawDiff < 0 ? 'down' : 'even'
  const diffText = rawDiff > 0 ? `up ${rawDiff.toFixed(1)}` : rawDiff < 0 ? `down ${Math.abs(rawDiff).toFixed(1)}` : 'even'

  const qualRows = myScored.filter((row) => row.sessionType === 'qualifying')
  const qualPoints = qualRows.reduce((sum, row) => sum + row.points, 0)
  const qualAvg = qualRows.length > 0 ? (qualPoints / qualRows.length).toFixed(1) : '0.0'

  const raceRows = myScored.filter((row) => row.sessionType === 'race')
  const racePoints = raceRows.reduce((sum, row) => sum + row.points, 0)
  const raceAvg = raceRows.length > 0 ? (racePoints / raceRows.length).toFixed(1) : '0.0'

  const scoredRounds = Array.from(new Set(allPreds.filter((row) => row.scored).map((row) => row.round))).sort((a, b) => a - b)

  const pointsPerRound: MyStatsRoundBar[] = scoredRounds.map((round) => {
    const myRoundRows = myScored.filter((row) => row.round === round)
    const qualifying = myRoundRows.filter((row) => row.sessionType === 'qualifying').reduce((sum, row) => sum + row.points, 0)
    const race = myRoundRows.filter((row) => row.sessionType === 'race').reduce((sum, row) => sum + row.points, 0)
    const sprint = myRoundRows
      .filter((row) => row.sessionType === 'sprint' || row.sessionType === 'sprint-qualifying')
      .reduce((sum, row) => sum + row.points, 0)

    const gridRows = allPreds.filter((row) => row.scored && row.round === round)
    const activePlayers = new Set(gridRows.map((row) => row.userId)).size
    const gridTotal = gridRows.reduce((sum, row) => sum + row.points, 0)
    const gridAvg = activePlayers > 0 ? Math.round((gridTotal / activePlayers) * 10) / 10 : 0

    return {
      round,
      raceName: raceByRound.get(round)?.name ?? `Round ${round}`,
      qualifying,
      race,
      sprint,
      total: qualifying + race + sprint,
      gridAvg,
    }
  })

  const seasonGridAvg =
    pointsPerRound.length > 0
      ? Math.round((pointsPerRound.reduce((sum, bar) => sum + bar.gridAvg, 0) / pointsPerRound.length) * 10) / 10
      : 0

  const positionAccuracy: PositionAccuracyBar[] = Array.from({ length: 10 }, (_, index) => {
    let hits = 0
    const attempts = myScored.length
    for (const row of myScored) {
      const official = resultsMap.get(`${row.round}:${row.sessionType}`)
      const pick = row.positions[index]
      if (official && pick && areDriversEquivalent(pick, official[index])) {
        hits++
      }
    }
    return {
      position: index + 1,
      label: `P${index + 1}`,
      hits,
      attempts,
      percentage: attempts > 0 ? Math.round((hits / attempts) * 100) : 0,
    }
  })

  const recentSessions: RecentSessionItem[] = recent5.map((row) => {
    const official = resultsMap.get(`${row.round}:${row.sessionType}`) ?? []
    const markers: SessionHitMarker[] = Array.from({ length: 10 }, (_, index) => {
      const pick = row.positions[index] ?? ''
      const actual = official[index] ?? ''
      const predMeta = resolveDriverDisplay(pick, catalog)
      const actualMeta = actual ? resolveDriverDisplay(actual, catalog) : { code: '-' }
      return {
        position: index + 1,
        predictedCode: predMeta.code,
        actualCode: actualMeta.code,
        hit: Boolean(pick && actual && areDriversEquivalent(pick, actual)),
      }
    })
    return {
      round: row.round,
      raceName: raceByRound.get(row.round)?.name ?? `Round ${row.round}`,
      sessionType: row.sessionType as SessionType,
      sessionName: sessionLabel(row.sessionType as SessionType) ?? row.sessionType,
      points: row.points,
      markers,
    }
  })

  const driverTallies = new Map<string, { hits: number; picked: number }>()
  for (const row of myScored) {
    const official = resultsMap.get(`${row.round}:${row.sessionType}`) ?? []
    for (let index = 0; index < 10; index++) {
      const normPick = normalizeDriverId(row.positions[index])
      if (!normPick) continue
      const current = driverTallies.get(normPick) ?? { hits: 0, picked: 0 }
      current.picked += 1
      if (official[index] && areDriversEquivalent(normPick, official[index])) {
        current.hits += 1
      }
      driverTallies.set(normPick, current)
    }
  }

  const eligibleDrivers: DriverHitStat[] = Array.from(driverTallies.entries())
    .filter(([, tally]) => tally.picked >= MIN_DRIVER_PICKS)
    .map(([driverId, tally]) => {
      const display = resolveDriverDisplay(driverId, catalog)
      return {
        driverId,
        code: display.code,
        name: display.name,
        hits: tally.hits,
        picked: tally.picked,
        percentage: Math.round((tally.hits / tally.picked) * 100),
        isReplacement: display.isReplacement,
      }
    })

  const mostCorrectDrivers = [...eligibleDrivers]
    .sort((a, b) => b.percentage - a.percentage || b.hits - a.hits || b.picked - a.picked || a.name.localeCompare(b.name))
    .slice(0, 5)

  const mostMissedDrivers = [...eligibleDrivers]
    .sort(
      (a, b) =>
        a.percentage - b.percentage ||
        b.picked - b.hits - (a.picked - a.hits) ||
        b.picked - a.picked ||
        a.name.localeCompare(b.name)
    )
    .slice(0, 5)

  const rivals = ranked
    .filter((row) => row.id !== userId)
    .sort((a, b) => Math.abs(a.rank - me.rank) - Math.abs(b.rank - me.rank) || a.rank - b.rank)
    .slice(0, 6)
    .sort((a, b) => a.rank - b.rank)

  const headToHead: HeadToHeadRow[] = rivals.map((rival) => {
    let won = 0
    let lost = 0
    let tied = 0
    for (const round of scoredRounds) {
      const myRoundRows = allPreds.filter((row) => row.scored && row.round === round && row.userId === userId)
      const rivalRoundRows = allPreds.filter((row) => row.scored && row.round === round && row.userId === rival.id)
      if (myRoundRows.length === 0 && rivalRoundRows.length === 0) continue
      const myPts = myRoundRows.reduce((sum, row) => sum + row.points, 0)
      const rivalPts = rivalRoundRows.reduce((sum, row) => sum + row.points, 0)
      if (myPts > rivalPts) won++
      else if (myPts < rivalPts) lost++
      else tied++
    }
    return {
      rivalId: rival.id,
      rivalName: rival.name,
      rivalRank: rival.rank,
      won,
      lost,
      tied,
      total: won + lost + tied,
    }
  })

  return {
    userId: me.id,
    userName: me.name,
    hasScoredSessions: myScored.length > 0,
    rank: me.rank,
    totalPlayers: ranked.length,
    totalPoints: me.points,
    gapLabel,
    accuracy: me.accuracy,
    correctPicks: me.points,
    totalPicks,
    avgScore: avgNum.toFixed(1),
    bestSession,
    recentForm: {
      average: recentAvgNum.toFixed(1),
      diffLabel: `last ${recent5.length} ${recent5.length === 1 ? 'session' : 'sessions'} (${diffText})`,
      trend,
    },
    qualifyingAccuracy: {
      percentage: accuracy(qualPoints, qualRows.length),
      avgLabel: `${qualAvg} pts per session`,
      sessions: qualRows.length,
    },
    raceAccuracy: {
      percentage: accuracy(racePoints, raceRows.length),
      avgLabel: `${raceAvg} pts per session`,
      sessions: raceRows.length,
    },
    pointsPerRound,
    seasonGridAvg,
    positionAccuracy,
    recentSessions,
    mostCorrectDrivers,
    mostMissedDrivers,
    headToHead,
  }
}

