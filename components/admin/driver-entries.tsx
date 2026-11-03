'use client'
import { useState, useTransition } from 'react'
import { Plus, RotateCcw, UserMinus } from 'lucide-react'
import { addRoundDriver, setDriverEntry } from '@/app/actions/admin'
import type { Driver } from '@/lib/f1'
import { ActionMessage } from './action-message'

type Props = { round: number; entered: Driver[]; withdrawn: Driver[]; replaceable: Driver[]; editable: boolean }

const EMPTY = { number: '', code: '', givenName: '', familyName: '', nationality: '', replaces: '' }

export function DriverEntries({ round, entered, withdrawn, replaceable, editable }: Props) {
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState<string>()
  const [notice, setNotice] = useState<string>()
  const [pending, startTransition] = useTransition()

  function report(result: { ok: boolean; error?: string }, success: string) {
    setError(result.ok ? undefined : result.error)
    setNotice(result.ok ? success : undefined)
    return result.ok
  }

  function toggle(driverId: string, enter: boolean) {
    startTransition(async () => { report(await setDriverEntry(round, driverId, enter), enter ? 'Driver restored.' : 'Driver withdrawn.') })
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => { if (report(await addRoundDriver(round, form), 'Driver added to this round.')) setForm(EMPTY) })
  }

  const field = (key: keyof typeof EMPTY, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="admin-field"><span>{label}</span><input value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} disabled={!editable || pending} {...props} /></label>
  )

  return (
    <div className="panel admin-panel">
      <div className="panel-heading"><div><p className="eyebrow">ENTRY LIST</p><h2>Drivers this weekend</h2></div><span className="pill">{entered.length} entered</span></div>
      {!editable && <p className="shortcut-note">Predictions are locked for this round, so the entry list can no longer change.</p>}
      <ul className="admin-driver-list">
        {entered.map((driver) => (
          <li key={driver.id}>
            <span className="driver-number">{driver.number}</span>
            <span className="min-w-0 flex-1"><b>{driver.givenName} {driver.familyName}</b><small>{driver.code}{driver.replaces ? ' · Replacement' : ''}</small></span>
            <button type="button" className="icon-button" disabled={!editable || pending} onClick={() => toggle(driver.id, false)} aria-label={`Withdraw ${driver.familyName}`} title="Withdraw from this round"><UserMinus /></button>
          </li>
        ))}
      </ul>
      {withdrawn.length > 0 && (
        <>
          <p className="eyebrow mt-6">WITHDRAWN</p>
          <ul className="admin-driver-list">
            {withdrawn.map((driver) => (
              <li key={driver.id} data-muted="true">
                <span className="driver-number">{driver.number}</span>
                <span className="min-w-0 flex-1"><b>{driver.givenName} {driver.familyName}</b><small>{driver.code}</small></span>
                <button type="button" className="icon-button" disabled={!editable || pending} onClick={() => toggle(driver.id, true)} aria-label={`Restore ${driver.familyName}`} title="Restore"><RotateCcw /></button>
              </li>
            ))}
          </ul>
        </>
      )}
      <form className="admin-form" onSubmit={submit}>
        <p className="eyebrow">ADD A REPLACEMENT OR RESERVE</p>
        <div className="admin-form-grid">
          {field('givenName', 'First name', { autoComplete: 'off', maxLength: 40 })}
          {field('familyName', 'Last name', { autoComplete: 'off', maxLength: 40 })}
          {field('number', 'Car number', { inputMode: 'numeric', maxLength: 3 })}
          {field('code', 'Code', { maxLength: 3, placeholder: 'ABC' })}
          {field('nationality', 'Nationality', { maxLength: 40 })}
          <label className="admin-field"><span>Replaces</span>
            <select value={form.replaces} onChange={(event) => setForm({ ...form, replaces: event.target.value })} disabled={!editable || pending}>
              <option value="">Nobody (reserve)</option>
              {replaceable.map((driver) => <option key={driver.id} value={driver.id}>{driver.givenName} {driver.familyName}</option>)}
            </select>
          </label>
        </div>
        <div className="flex items-center gap-3">
          <button className="button-primary" disabled={!editable || pending}><Plus aria-hidden="true" />Add driver</button>
          <ActionMessage error={error} notice={notice} />
        </div>
      </form>
    </div>
  )
}
