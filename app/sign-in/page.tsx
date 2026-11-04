import { AuthForm } from '@/components/auth-form'
import { auth } from '@/lib/auth'
import { safeNext } from '@/lib/safe-next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const next = safeNext((await searchParams).next)
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect(next)
  return <AuthForm mode="sign-in" next={next} />
}
