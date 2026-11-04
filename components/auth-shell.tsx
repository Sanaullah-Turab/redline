import Link from 'next/link'

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <Link href="/" className="font-mono text-xl font-black italic tracking-wide">
          <span className="text-white">RED</span>
          <span className="text-primary">LINE</span>
        </Link>
        {children}
      </section>
      <aside className="auth-art" aria-hidden="true">
        <div className="speed-lines" />
        <div className="auth-art-lights">
          {[0, 1, 2, 3, 4].map((light) => (
            <i key={light} style={{ '--light': light } as React.CSSProperties} />
          ))}
        </div>
        <p className="font-mono text-8xl font-black italic text-primary-foreground">P1</p>
        <p className="max-w-sm text-3xl font-bold text-primary-foreground">
          Every position. Every point. Every race.
        </p>
      </aside>
    </main>
  )
}
