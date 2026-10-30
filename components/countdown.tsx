'use client'
import { useEffect, useState } from 'react'

const units = [
  { label: 'Days', ms: 86_400_000 },
  { label: 'Hrs', ms: 3_600_000 },
  { label: 'Min', ms: 60_000 },
  { label: 'Sec', ms: 1_000 },
]

export function Countdown({ target, label }: { target: string; label: string }) {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const remaining = now === null ? 0 : Math.max(0, new Date(target).getTime() - now)
  let rest = remaining
  const parts = units.map(({ label, ms }) => {
    const value = Math.floor(rest / ms)
    rest -= value * ms
    return { label, value }
  })

  return (
    <div className="countdown" role="timer" aria-label={`${label} countdown`}>
      <p className="eyebrow">{label}</p>
      <div className="countdown-grid">
        {parts.map(({ label, value }) => (
          <div key={label}>
            <strong suppressHydrationWarning>{now === null ? '--' : String(value).padStart(2, '0')}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
