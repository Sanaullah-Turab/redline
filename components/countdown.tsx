'use client'
import { useEffect, useState } from 'react'

const UNITS = [
  { label: 'Days', ms: 86_400_000 },
  { label: 'Hrs', ms: 3_600_000 },
  { label: 'Min', ms: 60_000 },
  { label: 'Sec', ms: 1_000 },
]

interface TimeSnapshot {
  prev: number | null
  curr: number | null
  tick: number
}

function computeUnitStrings(targetMs: number, timestamp: number | null): string[] {
  if (timestamp === null) return UNITS.map(() => '--')
  let rest = Math.max(0, targetMs - timestamp)
  return UNITS.map(({ ms }) => {
    const value = Math.floor(rest / ms)
    rest -= value * ms
    return String(value).padStart(2, '0')
  })
}

export function Countdown({ target, label }: { target: string; label: string }) {
  const [snapshot, setSnapshot] = useState<TimeSnapshot>({
    prev: null,
    curr: null,
    tick: 0,
  })

  useEffect(() => {
    const initial = Date.now()
    setSnapshot({ prev: initial, curr: initial, tick: 0 })
    const id = setInterval(() => {
      setSnapshot((state) => {
        const nextNow = Date.now()
        return {
          prev: state.curr ?? nextNow,
          curr: nextNow,
          tick: state.tick + 1,
        }
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const targetMs = new Date(target).getTime()
  const prevUnits = computeUnitStrings(targetMs, snapshot.prev)
  const currUnits = computeUnitStrings(targetMs, snapshot.curr)

  return (
    <div className="countdown" role="timer" aria-label={`${label} countdown`}>
      <p className="eyebrow">{label}</p>
      <div className="countdown-grid">
        {UNITS.map(({ label: unitLabel }, unitIdx) => {
          const currFormatted = currUnits[unitIdx]
          const prevFormatted = prevUnits[unitIdx]
          const maxLen = Math.max(currFormatted.length, prevFormatted.length)
          const currPadded = currFormatted.padStart(maxLen, '0')
          const prevPadded = prevFormatted.padStart(maxLen, '0')

          return (
            <div key={unitLabel} className="countdown-cell">
              <div className="countdown-digits" aria-label={`${currFormatted} ${unitLabel}`}>
                {currPadded.split('').map((currChar, charIdx) => {
                  const prevChar = prevPadded[charIdx] ?? currChar
                  const isRolling =
                    snapshot.tick > 0 && prevChar !== currChar && prevChar !== '-'
                  return (
                    <span
                      key={`${unitLabel}-${charIdx}`}
                      className="mech-window"
                      aria-hidden="true"
                    >
                      {isRolling ? (
                        <span
                          key={`${currChar}-${snapshot.tick}`}
                          className="mech-track mech-track--roll"
                        >
                          <b className="mech-glyph">{prevChar}</b>
                          <b className="mech-glyph">{currChar}</b>
                        </span>
                      ) : (
                        <span className="mech-track">
                          <b className="mech-glyph">{currChar}</b>
                        </span>
                      )}
                    </span>
                  )
                })}
              </div>
              <span className="countdown-unit">{unitLabel}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
