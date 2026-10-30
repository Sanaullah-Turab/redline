import type { ReactNode } from 'react'

export function StatCard({ label, value, hint, index = 0 }: { label: string; value: ReactNode; hint?: string; index?: number }) {
  return (
    <div className="stat-card rise" style={{ '--i': index } as React.CSSProperties}>
      <span>{label}</span>
      <strong>{value}</strong>
      {hint && <small>{hint}</small>}
    </div>
  )
}
