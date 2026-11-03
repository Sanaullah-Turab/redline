export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-transition-shell">
      <div className="page-transition-sweep" aria-hidden="true" />
      {children}
    </div>
  )
}
