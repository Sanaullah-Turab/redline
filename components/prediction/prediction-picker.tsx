'use client'
import { useMemo, useState, useTransition } from 'react'
import { Check, Copy, RotateCcw, Zap } from 'lucide-react'
import { savePrediction } from '@/app/actions/predictions'
import type { Driver, SessionType } from '@/lib/f1'
import { driverFallback } from './driver-label'
import { DriverOrderList } from './driver-order-list'
import { DriverPool } from './driver-pool'
import { ShortcutButton, type ShortcutAction } from './shortcut-button'

type TabConfig = { type: SessionType; label: string; isSprint: boolean }
export type ShortcutView = { status: 'ready'; positions: string[] } | { status: 'unavailable'; reason: string } | { status: 'not-applicable' }
type PerSession<T> = Record<SessionType, T>

const STANDARD_TABS: TabConfig[] = [
  { type: 'qualifying', label: 'Qualifying', isSprint: false },
  { type: 'race', label: 'Race', isSprint: false },
]

const SPRINT_TABS: TabConfig[] = [
  { type: 'sprint-qualifying', label: 'Sprint Qualifying', isSprint: true },
  { type: 'sprint', label: 'Sprint', isSprint: true },
  { type: 'qualifying', label: 'Qualifying', isSprint: false },
  { type: 'race', label: 'Race', isSprint: false },
]

type Props = {
  drivers: Driver[]
  catalog: Driver[]
  round: number
  isSprintWeekend: boolean
  initial: PerSession<string[]>
  locked: PerSession<boolean>
  practice3: ShortcutView
  grid: ShortcutView
}

export function PredictionPicker({ drivers, catalog, round, isSprintWeekend, initial, locked, practice3, grid }: Props) {
  const tabs = isSprintWeekend ? SPRINT_TABS : STANDARD_TABS
  const [tab, setTab] = useState<SessionType>(tabs[0].type)
  const [picks, setPicks] = useState<PerSession<string[]>>(initial)
  const [message, setMessage] = useState('')
  const [pending, startTransition] = useTransition()

  const lookup = useMemo(() => new Map([...catalog, ...drivers].map((driver) => [driver.id, driver])), [catalog, drivers])
  const selectable = useMemo(() => new Set(drivers.map((driver) => driver.id)), [drivers])
  const selected = picks[tab]
  const isLocked = locked[tab]
  const tabLabel = tabs.find((item) => item.type === tab)?.label ?? tab

  function setSelected(next: string[]) {
    setPicks((current) => ({ ...current, [tab]: next }))
    setMessage('')
  }

  function save() {
    setMessage('')
    startTransition(async () => {
      try { await savePrediction(round, tab, selected); setMessage('Prediction saved to the grid.') }
      catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to save') }
    })
  }

  function fromShortcut(view: ShortcutView, label: string, key: string, waitingLabel: string): ShortcutAction | null {
    if (view.status === 'not-applicable') return null
    if (view.status === 'unavailable') return { key, label, picks: [], disabledReason: view.reason || waitingLabel }
    return { key, label, picks: view.positions.filter((id) => selectable.has(id)).slice(0, 10) }
  }

  const shortcuts: ShortcutAction[] = []
  if (tab === 'qualifying') {
    const action = fromShortcut(practice3, 'Copy Free Practice 3', 'fp3', 'Free Practice 3 results are not available yet.')
    if (action) shortcuts.push(action)
  }
  if (tab === 'race') {
    const action = fromShortcut(grid, 'Copy Starting Grid', 'grid', 'The starting grid is not available yet.')
    if (action) shortcuts.push(action)
    if (picks.qualifying.length === 10) shortcuts.push({ key: 'own-qualifying', label: 'Copy my qualifying', picks: picks.qualifying })
  }
  if (tab === 'sprint' && picks['sprint-qualifying'].length === 10) shortcuts.push({ key: 'own-sprint-qualifying', label: 'Copy my sprint qualifying', picks: picks['sprint-qualifying'] })
  const blocked = shortcuts.find((action) => action.disabledReason)

  return (
    <div className="flex flex-col gap-6">
      <div className="session-tabs" role="tablist">
        {tabs.map(({ type, label, isSprint }) => (
          <button key={type} role="tab" aria-selected={tab === type} onClick={() => { setTab(type); setMessage('') }}>
            {isSprint && <Zap className="sprint-tab-icon" aria-hidden="true" />}{label} <span>{picks[type].length}/10</span>
          </button>
        ))}
      </div>
      {isLocked && <div className="lock-banner">This session has started. Predictions are now locked.</div>}
      {!isLocked && tab === 'sprint-qualifying' && <div className="practice-banner"><Zap aria-hidden="true" />Practice round. No points scored here, but see how well you can call the shootout.</div>}
      <div className="prediction-layout">
        <section className="panel">
          <div className="panel-heading">
            <div><p className="eyebrow">YOUR ORDER</p><h2>Build your top 10</h2></div>
            <div className="flex flex-wrap items-center gap-2">
              {!isLocked && shortcuts.map((action) => <ShortcutButton key={action.key} action={action} hasPicks={selected.length > 0} onApply={setSelected} />)}
              <button className="icon-button" disabled={isLocked || selected.length === 0} onClick={() => setSelected([])} aria-label="Reset picks"><RotateCcw /></button>
            </div>
          </div>
          {!isLocked && blocked && <p className="shortcut-note"><Copy aria-hidden="true" />{blocked.disabledReason}</p>}
          <DriverOrderList selected={selected} lookup={(id) => lookup.get(id) ?? driverFallback(id)} onChange={setSelected} disabled={isLocked} />
        </section>
        <DriverPool drivers={drivers} selected={selected} disabled={isLocked} onAdd={(id) => setSelected([...selected, id])} />
      </div>
      <div className="save-bar">
        <div><b>{selected.length === 10 ? 'Grid complete' : `${10 - selected.length} positions remaining`}</b>{message && <p role="status">{message}</p>}</div>
        <button className="button-primary" disabled={isLocked || selected.length !== 10 || pending} onClick={save}>{pending ? 'Saving...' : <><Check /> Save {tabLabel}</>}</button>
      </div>
    </div>
  )
}
