'use client'
import { useMemo, useState, useTransition } from 'react'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowDown, ArrowUp, Check, Copy, GripVertical, RotateCcw, Search, X, Zap } from 'lucide-react'
import type { Driver, SessionType } from '@/lib/f1'
import { savePrediction } from '@/app/actions/predictions'

type TabConfig = { type: SessionType; label: string; isSprint: boolean }

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

function SortableDriver({ driver, index, total, move, remove }: { driver: Driver; index: number; total: number; move: (from: number, to: number) => void; remove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: driver.id })
  return <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`prediction-row ${isDragging ? 'opacity-60' : ''}`}><span className="position">P{index + 1}</span><button className="drag-handle" {...attributes} {...listeners} aria-label={`Drag ${driver.familyName}`}><GripVertical /></button><span className="driver-number">{driver.number}</span><span className="min-w-0 flex-1"><b>{driver.givenName} {driver.familyName}</b><small>{driver.code} · {driver.nationality}</small></span><span className="flex gap-1"><button type="button" className="icon-button" disabled={index === 0} onClick={() => move(index, index - 1)} aria-label="Move up"><ArrowUp /></button><button type="button" className="icon-button" disabled={index === total - 1} onClick={() => move(index, index + 1)} aria-label="Move down"><ArrowDown /></button><button type="button" className="icon-button" onClick={remove} aria-label="Remove driver"><X /></button></span></li>
}

type Props = {
  drivers: Driver[]
  round: number
  isSprintWeekend: boolean
  initialQualifying: string[]
  initialRace: string[]
  initialSprintQualifying: string[]
  initialSprint: string[]
  qualLocked: boolean
  raceLocked: boolean
  sprintQualLocked: boolean
  sprintLocked: boolean
}

export function PredictionPicker({ drivers, round, isSprintWeekend, initialQualifying, initialRace, initialSprintQualifying, initialSprint, qualLocked, raceLocked, sprintQualLocked, sprintLocked }: Props) {
  const tabs = isSprintWeekend ? SPRINT_TABS : STANDARD_TABS
  const [tab, setTab] = useState<SessionType>(tabs[0].type)
  const [qual, setQual] = useState(initialQualifying)
  const [race, setRace] = useState(initialRace)
  const [sprintQual, setSprintQual] = useState(initialSprintQualifying)
  const [sprint, setSprint] = useState(initialSprint)
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState('')
  const [pending, startTransition] = useTransition()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))

  const stateMap: Record<SessionType, { picks: string[]; set: (v: string[]) => void; locked: boolean }> = {
    'qualifying': { picks: qual, set: setQual, locked: qualLocked },
    'race': { picks: race, set: setRace, locked: raceLocked },
    'sprint-qualifying': { picks: sprintQual, set: setSprintQual, locked: sprintQualLocked },
    'sprint': { picks: sprint, set: setSprint, locked: sprintLocked },
  }

  const { picks: selected, set: setSelected, locked } = stateMap[tab]

  const available = useMemo(() => drivers.filter((d) => !selected.includes(d.id) && `${d.givenName} ${d.familyName} ${d.code}`.toLowerCase().includes(query.toLowerCase())), [drivers, selected, query])
  const lookup = new Map(drivers.map((d) => [d.id, d]))
  const selectedDrivers = selected.map((id) => lookup.get(id)).filter(Boolean) as Driver[]

  function dragEnd(e: DragEndEvent) { if (e.over && e.active.id !== e.over.id) { const from = selected.indexOf(String(e.active.id)); const to = selected.indexOf(String(e.over.id)); setSelected(arrayMove(selected, from, to)) } }

  function save() {
    setMessage('')
    startTransition(async () => {
      try { await savePrediction(round, tab, selected); setMessage('Prediction saved to the grid.') }
      catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to save') }
    })
  }

  const tabLabel = tabs.find((t) => t.type === tab)?.label ?? tab

  const copySource: { label: string; picks: string[] } | null =
    tab === 'race' && qual.length === 10 ? { label: 'Copy qualifying', picks: qual }
    : tab === 'sprint' && sprintQual.length === 10 ? { label: 'Copy sprint quali', picks: sprintQual }
    : null

  return <div className="flex flex-col gap-6">
    <div className="session-tabs" role="tablist">
      {tabs.map(({ type, label, isSprint: isSprintTab }) => {
        const count = stateMap[type].picks.length
        return <button key={type} role="tab" aria-selected={tab === type} onClick={() => { setTab(type); setQuery(''); setMessage('') }}>
          {isSprintTab && <Zap className="sprint-tab-icon" aria-hidden="true" />}{label} <span>{count}/10</span>
        </button>
      })}
    </div>
    {locked && <div className="lock-banner">This session has started. Predictions are now locked.</div>}
    <div className="prediction-layout">
      <section className="panel">
        <div className="panel-heading">
          <div><p className="eyebrow">YOUR ORDER</p><h2>Build your top 10</h2></div>
          <div className="flex gap-2">
            {copySource && !locked && <button className="button-secondary" onClick={() => setSelected(copySource.picks)}><Copy />{copySource.label}</button>}
            <button className="icon-button" disabled={locked || selected.length === 0} onClick={() => setSelected([])} aria-label="Reset picks"><RotateCcw /></button>
          </div>
        </div>
        {selected.length === 0
          ? <div className="empty-grid"><GripVertical /><p>Select drivers from the entry list to start your order.</p></div>
          : <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={dragEnd}>
              <SortableContext items={selected} strategy={verticalListSortingStrategy}>
                <ol className="flex flex-col gap-2">
                  {selectedDrivers.map((driver, index) => <SortableDriver key={driver.id} driver={driver} index={index} total={selected.length} move={(from, to) => setSelected(arrayMove(selected, from, to))} remove={() => setSelected(selected.filter((id) => id !== driver.id))} />)}
                </ol>
              </SortableContext>
            </DndContext>}
      </section>
      <aside className="panel">
        <div className="panel-heading"><div><p className="eyebrow">OFFICIAL ENTRY LIST</p><h2>Add drivers</h2></div></div>
        <label className="search"><Search aria-hidden="true" /><span className="sr-only">Search drivers</span><input placeholder="Search driver" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
        <div className="driver-pool">
          {available.map((driver) => <button key={driver.id} disabled={locked || selected.length >= 10} onClick={() => setSelected([...selected, driver.id])}><span className="driver-number">{driver.number}</span><span><b>{driver.givenName} {driver.familyName}</b><small>{driver.code} · {driver.nationality}</small></span><span className="add-mark">+</span></button>)}
        </div>
      </aside>
    </div>
    <div className="save-bar">
      <div><b>{selected.length === 10 ? 'Grid complete' : `${10 - selected.length} positions remaining`}</b>{message && <p role="status">{message}</p>}</div>
      <button className="button-primary" disabled={locked || selected.length !== 10 || pending} onClick={save}>{pending ? 'Saving...' : <><Check /> Save {tabLabel}</>}</button>
    </div>
  </div>
}
