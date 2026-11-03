import { StatCard } from '@/components/stat-card'
import type { MyStatsData } from '@/lib/stats'

export function MyStatsTiles({ stats }: { stats: MyStatsData }) {
  return (
    <div className="my-stats-tiles">
      <StatCard index={0} label="Rank" value={`#${stats.rank}`} hint={`of ${stats.totalPlayers} ${stats.totalPlayers === 1 ? 'player' : 'players'}`} />
      <StatCard index={1} label="Total points" value={stats.totalPoints} hint={stats.gapLabel} />
      <StatCard index={2} label="Accuracy" value={`${stats.accuracy}%`} hint={`${stats.correctPicks} of ${stats.totalPicks} picks correct`} />
      <StatCard index={3} label="Avg score" value={stats.avgScore} hint="points per scored session" />
      <StatCard index={4} label="Best session" value={`${stats.bestSession.points} pts`} hint={stats.bestSession.label} />
      <StatCard index={5} label="Recent form" value={stats.recentForm.average} hint={stats.recentForm.diffLabel} />
      <StatCard
        index={6}
        label="Qualifying accuracy"
        value={stats.qualifyingAccuracy.sessions ? `${stats.qualifyingAccuracy.percentage}%` : '-'}
        hint={stats.qualifyingAccuracy.sessions ? stats.qualifyingAccuracy.avgLabel : 'Not enough data yet'}
      />
      <StatCard
        index={7}
        label="Race accuracy"
        value={stats.raceAccuracy.sessions ? `${stats.raceAccuracy.percentage}%` : '-'}
        hint={stats.raceAccuracy.sessions ? stats.raceAccuracy.avgLabel : 'Not enough data yet'}
      />
    </div>
  )
}
