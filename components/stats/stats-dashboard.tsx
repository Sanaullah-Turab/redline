'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, BarChart3, LockKeyhole } from 'lucide-react'
import { WeekendPicksExplorer } from '@/components/picks/weekend-picks-explorer'
import type { MyStatsData, WeekendPicksGroup } from '@/lib/stats'
import { DriverHitLists } from './driver-hit-lists'
import { HeadToHeadPanel } from './head-to-head-panel'
import { MyStatsTiles } from './my-stats-tiles'
import { PointsPerRoundChart } from './points-per-round-chart'
import { PositionAccuracyChart } from './position-accuracy-chart'
import { RecentSessionsList } from './recent-sessions-list'
import { WholeGridView, type WholeGridData } from './whole-grid-view'

type StatsMode = 'me' | 'grid'

const STORAGE_KEY = 'redline:stats-view'

export function StatsDashboard({
  signedIn,
  myStats,
  weekendPicks,
  wholeGrid,
}: {
  signedIn: boolean
  myStats: MyStatsData | null
  weekendPicks: WeekendPicksGroup[]
  wholeGrid: WholeGridData
}) {
  const [mode, setMode] = useState<StatsMode>('me')
  const [focusedRound, setFocusedRound] = useState<number | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const queryView = params.get('view')
    if (queryView === 'grid' || queryView === 'me') {
      setMode(queryView)
      return
    }
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved === 'grid' || saved === 'me') setMode(saved)
    } catch {
      return
    }
  }, [])

  function selectMode(next: StatsMode) {
    setMode(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
      const url = new URL(window.location.href)
      if (next === 'me') url.searchParams.delete('view')
      else url.searchParams.set('view', 'grid')
      window.history.replaceState(null, '', url.toString())
    } catch {
      return
    }
  }

  function handleSelectRound(round: number) {
    setFocusedRound(round)
    const el = document.getElementById('weekend-picks')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <section className="race-hero">
        <div className="racing-stripes" aria-hidden="true"><span /><span /><span /></div>
        <div className="relative mx-auto flex max-w-7xl flex-col justify-between gap-6 px-4 py-12 md:flex-row md:items-end lg:px-8">
          <div>
            <p className="eyebrow">SEASON TELEMETRY</p>
            <h1 className="mt-3 font-mono text-5xl font-black uppercase italic md:text-7xl">Stats</h1>
            <p className="mt-4 max-w-xl text-muted-foreground">
              {mode === 'me'
                ? 'How you are performing across the season.'
                : 'How the whole grid is performing across the season.'}
            </p>
          </div>

          <div className="stats-mode-switch" role="tablist" aria-label="Stats view switch">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'me'}
              className="stats-mode-btn"
              onClick={() => selectMode('me')}
            >
              MY STATS
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'grid'}
              className="stats-mode-btn"
              onClick={() => selectMode('grid')}
            >
              WHOLE GRID
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-10 lg:px-8">
        {mode === 'grid' ? (
          <WholeGridView data={wholeGrid} />
        ) : !signedIn ? (
          <div className="empty-grid">
            <LockKeyhole />
            <p>Sign in to view your personal telemetry, driver accuracy, and head-to-head record.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/sign-in" className="button-primary">Sign in <ArrowRight /></Link>
              <button type="button" className="button-secondary" onClick={() => selectMode('grid')}>
                View Whole Grid
              </button>
            </div>
          </div>
        ) : !myStats || !myStats.hasScoredSessions ? (
          <div className="flex flex-col gap-10">
            <div className="empty-grid">
              <BarChart3 />
              <p>Your stats appear after your first scored session.</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/calendar" className="button-primary">Make predictions <ArrowRight /></Link>
                <button type="button" className="button-secondary" onClick={() => selectMode('grid')}>
                  Explore Whole Grid
                </button>
              </div>
            </div>
            {weekendPicks.length > 0 && <WeekendPicksExplorer weekends={weekendPicks} focusedRound={focusedRound} />}
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            <MyStatsTiles stats={myStats} />
            <PointsPerRoundChart rounds={myStats.pointsPerRound} seasonGridAvg={myStats.seasonGridAvg} />
            <div className="grid gap-4 lg:grid-cols-2">
              <PositionAccuracyChart positions={myStats.positionAccuracy} />
              <RecentSessionsList sessions={myStats.recentSessions} onSelectRound={handleSelectRound} />
            </div>
            <DriverHitLists mostCorrect={myStats.mostCorrectDrivers} mostMissed={myStats.mostMissedDrivers} />
            <HeadToHeadPanel rows={myStats.headToHead} />
            <WeekendPicksExplorer weekends={weekendPicks} focusedRound={focusedRound} />
          </div>
        )}
      </section>
    </>
  )
}

