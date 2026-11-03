export const SEASON = 2026
const API = process.env.JOLPICA_API_URL ?? 'https://api.jolpi.ca/ergast/f1'

export async function api(path: string, options: { timeoutMs?: number; revalidate?: number } = {}) {
  const { timeoutMs = 8000, revalidate } = options
  try {
    const res = await fetch(`${API}/${path}`, { ...(revalidate ? { next: { revalidate } } : { cache: 'no-store' as const }), signal: AbortSignal.timeout(timeoutMs) })
    if (!res.ok) return { ok: false, status: res.status, data: null }
    const text = await res.text()
    try {
      return { ok: true, status: res.status, data: JSON.parse(text) }
    } catch {
      return { ok: false, status: res.status, data: null }
    }
  } catch (err: any) {
    const isTimeout = err?.name === 'TimeoutError' || err?.name === 'AbortError'
    return { ok: false, status: isTimeout ? 408 : 0, data: null }
  }
}
