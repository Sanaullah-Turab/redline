'use client'
import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import type { Driver } from '@/lib/f1'
import { driverMeta, driverName } from './driver-label'

type Props = { drivers: Driver[]; selected: string[]; disabled: boolean; onAdd: (id: string) => void }

export function DriverPool({ drivers, selected, disabled, onAdd }: Props) {
  const [query, setQuery] = useState('')
  const available = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return drivers.filter((driver) => !selected.includes(driver.id) && (!needle || `${driverName(driver)} ${driver.code} ${driver.number}`.toLowerCase().includes(needle)))
  }, [drivers, selected, query])
  const full = selected.length >= 10

  return (
    <aside className="panel">
      <div className="panel-heading"><div><p className="eyebrow">OFFICIAL ENTRY LIST</p><h2>Add drivers</h2></div></div>
      <label className="search"><Search aria-hidden="true" /><span className="sr-only">Search drivers</span><input id="driver-search" name="driverSearch" placeholder="Search driver" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <div className="driver-pool">
        {available.map((driver) => (
          <button key={driver.id} disabled={disabled || full} onClick={() => onAdd(driver.id)}>
            <span className="driver-number">{driver.number}</span>
            <span><b>{driverName(driver)}</b><small>{driverMeta(driver)}</small></span>
            <span className="add-mark">+</span>
          </button>
        ))}
        {!available.length && <p className="px-1 text-sm text-muted-foreground">{selected.length === drivers.length ? 'Every driver is in your order.' : 'No drivers match your search.'}</p>}
      </div>
    </aside>
  )
}
