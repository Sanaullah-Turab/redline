import { CIRCUIT_PATHS } from '@/lib/circuit-paths'
import { CIRCUIT_MAP } from '@/lib/circuit-mapping'

export function CircuitDecor({ circuitId }: { circuitId?: string }) {
  const key = circuitId ? (CIRCUIT_MAP[circuitId] ?? circuitId) : ''
  const path = CIRCUIT_PATHS[key]
  if (!path) return null
  return (
    <svg
      viewBox="0 0 170 100"
      className="f1-circuit-svg"
      aria-hidden="true"
      fill="none"
    >
      <path
        d={path}
        stroke="currentColor"
        strokeWidth="4.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
      />
      <path
        d={path}
        stroke="var(--card-bg, #0e0f14)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={path}
        pathLength={100}
        stroke="var(--primary)"
        strokeWidth="2.1"
        strokeDasharray="18 82"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.92"
      />
    </svg>
  )
}
