import { AuthForm } from '@/components/auth-form'
import { auth } from '@/lib/auth'
import { mailEnabled } from '@/lib/mailer'
import { safeNext } from '@/lib/safe-next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

type Params = { next?: string | string[]; reset?: string }

export default async function Page({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams
  const next = safeNext(params.next)
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect(next)
  return (
    <AuthForm
      mode="sign-up"
      next={next}
      canReset={mailEnabled}
      notice={params.reset ? 'Password updated. Sign in with your new password.' : undefined}
    />
  )
}
