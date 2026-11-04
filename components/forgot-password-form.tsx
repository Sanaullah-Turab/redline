'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, LoaderCircle, MailCheck } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { AuthShell } from '@/components/auth-shell'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await authClient.requestPasswordReset({ email, redirectTo: '/reset-password' })
      if (result.error) setError(result.error.message || 'Unable to send reset link')
      else setSent(true)
    } catch {
      setError('Network error. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      {sent ? (
        <div className="flex flex-col gap-4" role="status">
          <MailCheck className="size-10 text-primary" aria-hidden="true" />
          <h1 className="text-balance font-mono text-4xl font-black uppercase italic">Check your inbox</h1>
          <p className="text-muted-foreground">
            If an account exists for <strong className="text-foreground">{email}</strong>, a reset link is on its way. It expires in 1 hour.
          </p>
          <Link href="/sign-in" className="button-primary h-12">
            Back to sign in
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <p className="eyebrow">ACCOUNT RECOVERY</p>
            <h1 className="text-balance font-mono text-4xl font-black uppercase italic">Forgot password</h1>
            <p className="text-muted-foreground">Enter your email and we'll send you a link to reset it.</p>
          </div>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <label className="field">
              Email address
              <input
                id="auth-email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'auth-error' : undefined}
              />
            </label>
            {error && (
              <p id="auth-error" role="alert" aria-live="assertive" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <button className="button-primary h-12" disabled={loading}>
              {loading ? (
                <LoaderCircle className="animate-spin" aria-label="Loading" />
              ) : (
                <>
                  Send reset link
                  <ArrowRight aria-hidden="true" />
                </>
              )}
            </button>
          </form>
          <p className="text-sm text-muted-foreground">
            Remembered it?{' '}
            <Link className="font-bold text-foreground underline" href="/sign-in">
              Sign in
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  )
}
