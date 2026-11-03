import { SiteHeader } from '@/components/site-header'
import { StatsDashboard } from '@/components/stats/stats-dashboard'
import type { WholeGridData } from '@/components/stats/whole-grid-view'
import { getSchedule, isSprint, sessionStart } from '@/lib/f1'
import { getSession } from '@/lib/session'
import { getMyStats, getRoundTotals, getStandings, getUserWeekendPicks } from '@/lib/stats'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Stats' }

export default async function Page() {
  const session = await getSession()
  const userId = session?.user?.id

  const [standings, rounds, schedule, myStats, weekendPicks] = await Promise.all([
    getStandings(),
    getRoundTotals(),
    getSchedule(),
    userId ? getMyStats(userId) : Promise.resolve(null),
    userId ? getUserWeekendPicks(userId) : Promise.resolve([]),
  ])

  const now = new Date()
  const completedRounds = schedule.filter((race) => sessionStart(race, 'race') < now).length
  const entries = standings.reduce((sum, row) => sum + row.picks, 0)
  const scored = standings.reduce((sum, row) => sum + row.scored, 0)
  const points = standings.reduce((sum, row) => sum + row.points, 0)
  const average = scored ? Math.round((points / scored) * 10) / 10 : 0
  const sharpest = standings
    .filter((row) => row.scored > 0)
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, 5)
    .map((row) => ({ id: row.id, name: row.name, accuracy: row.accuracy }))
  const bestSingle = standings
    .filter((row) => row.best > 0)
    .sort((a, b) => b.best - a.best)
    .slice(0, 5)
    .map((row) => ({ id: row.id, name: row.name, best: row.best }))

  const wholeGrid: WholeGridData = {
    players: standings.length,
    completedRounds,
    totalRounds: schedule.length,
    sprintRounds: schedule.filter(isSprint).length,
    entries,
    scored,
    average,
    rounds: rounds.map((r) => ({ round: r.round, points: r.points })),
    sharpest,
    bestSingle,
  }

  return (
    <>
      <SiteHeader />
      <main>
        <StatsDashboard
          signedIn={Boolean(userId)}
          myStats={myStats}
          weekendPicks={weekendPicks}
          wholeGrid={wholeGrid}
        />
      </main>
    </>
  )
}
