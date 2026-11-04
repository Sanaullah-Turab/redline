'use client'
import { useState } from 'react'

export function StartLightsIntro() {
  const [visible, setVisible] = useState(true)

  if (!visible) return null

  return (
    <div
      className="start-lights-overlay"
      aria-hidden="true"
      onClick={() => setVisible(false)}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) setVisible(false)
      }}
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
