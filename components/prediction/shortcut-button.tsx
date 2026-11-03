'use client'
import { useEffect, useState } from 'react'
import { Copy } from 'lucide-react'

export type ShortcutAction = { key: string; label: string; picks: string[]; disabledReason?: string }

type Props = { action: ShortcutAction; hasPicks: boolean; onApply: (picks: string[]) => void }

export function ShortcutButton({ action, hasPicks, onApply }: Props) {
  const [confirming, setConfirming] = useState(false)
  const disabled = Boolean(action.disabledReason) || action.picks.length === 0

  useEffect(() => { setConfirming(false) }, [action.key, hasPicks])

  function apply() {
    onApply(action.picks)
    setConfirming(false)
  }

  if (confirming) {
    return (
      <div className="shortcut-confirm" role="alertdialog" aria-label={`Replace picks with ${action.label}`}>
        <span>Replace your current picks?</span>
        <button type="button" className="button-primary" onClick={apply}>Replace</button>
        <button type="button" className="button-secondary" onClick={() => setConfirming(false)}>Cancel</button>
      </div>
    )
  }

  return (
    <button type="button" className="button-secondary" disabled={disabled} title={action.disabledReason} onClick={() => (hasPicks ? setConfirming(true) : apply())}>
      <Copy aria-hidden="true" />{action.label}
    </button>
  )
}
