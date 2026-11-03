export function ActionMessage({ error, notice }: { error?: string; notice?: string }) {
  if (!error && !notice) return null
  return <p role="status" className={error ? 'admin-message admin-message--error' : 'admin-message'}>{error ?? notice}</p>
}
