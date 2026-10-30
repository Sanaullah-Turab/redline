export type Bar = { label: string; value: number }

export function BarChart({ data, unit = 'pts', max }: { data: Bar[]; unit?: string; max?: number }) {
  const top = max ?? Math.max(1, ...data.map((bar) => bar.value))
  return (
    <div className="bar-chart" role="img" aria-label={data.map((bar) => `${bar.label}: ${bar.value} ${unit}`).join(', ')}>
      {data.map((bar, index) => (
        <div className="bar-col" key={bar.label}>
          <span className="bar-value">{bar.value}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ height: `${(bar.value / top) * 100}%`, animationDelay: `${index * 50}ms` }} />
          </div>
          <span className="bar-label">{bar.label}</span>
        </div>
      ))}
    </div>
  )
}
