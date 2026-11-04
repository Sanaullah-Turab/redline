import { ForgotPasswordForm } from '@/components/forgot-password-form'
import { mailEnabled } from '@/lib/mailer'
import { notFound } from 'next/navigation'

export const metadata = { title: 'Forgot password' }

export default function Page() {
  if (!mailEnabled) notFound()
  return <ForgotPasswordForm />
}
