import { ResetPasswordForm } from '@/components/reset-password-form'
import { mailEnabled } from '@/lib/mailer'
import { notFound } from 'next/navigation'

export const metadata = { title: 'Reset password' }

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  if (!mailEnabled) notFound()
  const { token, error } = await searchParams
  return <ResetPasswordForm token={error ? undefined : token} />
}
