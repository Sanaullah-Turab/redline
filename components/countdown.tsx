'use client'
import { useEffect, useRef, useState } from 'react'

const units = [
  { label: 'Days', ms: 86_400_000 },
  { label: 'Hrs', ms: 3_600_000 },
  { label: 'Min', ms: 60_000 },
  { label: 'Sec', ms: 1_000 },
]

function MechanicalDigit({ digit }: { digit: string }) {
  const prevRef = useRef<string>(digit)
  const tickRef = useRef(0)

  let prev: string | null = null
  if (prevRef.current !== digit) {
    prev = prevRef.current
    prevRef.current = digit
    tickRef.current += 1
  }

  const tick = tickRef.current

  return (
    <span className="mech-digit" aria-hidden="true">
      {prev !== null && (
        <span key={`out-${tick}`} className="mech-digit-out">
          {prev}
        </span>
      )}
      <span
        key={`in-${tick}`}
        className={prev !== null ? 'mech-digit-in' : 'mech-digit-static'}
      >
        {digit}
      </span>
    </span>
  )
}

export function Countdown({ target, label }: { target: string; label: string }) {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const remaining = now === null ? 0 : Math.max(0, new Date(target).getTime() - now)
  let rest = remaining
  const parts = units.map(({ label: unitLabel, ms }) => {
    const value = Math.floor(rest / ms)
    rest -= value * ms
    const formatted = now === null ? '--' : String(value).padStart(2, '0')
    return { label: unitLabel, formatted, chars: formatted.split('') }
  })

  return (
    <div className="countdown" role="timer" aria-label={`${label} countdown`}>
      <p className="eyebrow">{label}</p>
      <div className="countdown-grid">
        {parts.map(({ label: unitLabel, formatted, chars }) => (
          <div key={unitLabel} className="countdown-cell">
            <strong aria-label={`${formatted} ${unitLabel}`}>
              {chars.map((char, idx) => (
                <MechanicalDigit key={`${unitLabel}-${idx}`} digit={char} />
              ))}
            </strong>
            <span>{unitLabel}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
