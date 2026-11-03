'use client'
import { useEffect, useState } from 'react'

const INTRO_KEY = 'redline:lights-out-v1'

export function StartLightsIntro() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      if (window.sessionStorage.getItem(INTRO_KEY) === '1') return
      window.sessionStorage.setItem(INTRO_KEY, '1')
      setVisible(true)
      const timer = window.setTimeout(() => setVisible(false), 1250)
      return () => window.clearTimeout(timer)
    } catch {
      return
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className="start-lights-overlay"
      aria-hidden="true"
      onClick={() => setVisible(false)}
    >
      <div className="start-lights-gantry">
        <div className="start-lights-pods">
          {[0, 1, 2, 3, 4].map((pod) => (
            <span
              key={pod}
              className="start-light-pod"
              style={{ '--pod': pod } as React.CSSProperties}
            >
              <i />
              <i />
            </span>
          ))}
        </div>
        <p className="start-lights-caption">REDLINE TELEMETRY · LIGHTS OUT</p>
      </div>
    </div>
  )
}

