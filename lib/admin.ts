import { getSession } from '@/lib/session'

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const allowed = (process.env.ADMIN_EMAILS ?? '').split(',').map((entry) => entry.trim().toLowerCase()).filter(Boolean)
  return allowed.includes(email.toLowerCase())
}

export async function getAdminSession() {
  const session = await getSession()
  return session?.user && isAdminEmail(session.user.email) ? session : null
}
