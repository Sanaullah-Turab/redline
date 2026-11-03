'use client'
import { useState, useTransition } from 'react'
import { RefreshCw, Save, Trash2 } from 'lucide-react'
import { clearReferenceOrder, refreshReferenceOrder, saveReferenceOrder } from '@/app/actions/admin'
import { driverFallback } from '@/components/prediction/driver-label'
import { DriverOrderList } from '@/components/prediction/driver-order-list'
import { DriverPool } from '@/components/prediction/driver-pool'
import type { Driver, ReferenceKind } from '@/lib/f1'
import { ActionMessage } from './action-message'

type Props = { round: number; kind: ReferenceKind; title: string; drivers: Driver[]; catalog: Driver[]; initial: string[]; source: string | null }

export function ReferenceEditor({ round, kind, title, drivers, catalog, initial, source }: Props) {
  const [order, setOrder] = useState(initial)
  const [error, setError] = useState<string>()
  const [notice, setNotice] = useState<string>()
  const [pending, startTransition] = useTransition()
  const lookup = new Map(catalog.map((driver) => [driver.id, driver]))

  function run(action: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    startTransition(async () => {
      const result = await action()
      setError(result.ok ? undefined : result.error)
      setNotice(result.ok ? success : undefined)
    })
  }

  return (
    <div className="panel admin-panel">
      <div className="panel-heading">
        <div><p className="eyebrow">REFERENCE DATA</p><h2>{title}</h2></div>
        <span className="pill" data-tone={source ? 'live' : undefined}>{source ? `Source: ${source}` : 'No data'}</span>
      </div>
      <div className="prediction-layout">
        <DriverOrderList selected={order} lookup={(id) => lookup.get(id) ?? driverFallback(id)} onChange={setOrder} disabled={pending} />
        <DriverPool drivers={drivers} selected={order} disabled={pending} onAdd={(id) => setOrder([...order, id])} />
      </div>
      <div className="admin-actions">
        <button className="button-primary" disabled={pending || order.length !== 10} onClick={() => run(() => saveReferenceOrder(round, kind, order), 'Saved as the manual override.')}><Save aria-hidden="true" />Save override</button>
        <button className="button-secondary" disabled={pending} onClick={() => run(() => refreshReferenceOrder(round, kind), 'Refreshed from OpenF1.')}><RefreshCw aria-hidden="true" />Refresh from OpenF1</button>
        <button className="button-secondary" disabled={pending} onClick={() => run(() => clearReferenceOrder(round, kind), 'Manual override removed.')}><Trash2 aria-hidden="true" />Clear override</button>
        <ActionMessage error={error} notice={notice} />
      </div>
    </div>
  )
}
