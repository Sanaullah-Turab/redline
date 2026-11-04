'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, LoaderCircle } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { AuthShell } from '@/components/auth-shell'
import { PasswordInput } from '@/components/password-input'

export function ResetPasswordForm({ token }: { token?: string }) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const result = await authClient.resetPassword({ newPassword: password, token })
      if (result.error) {
        setError(result.error.message || 'Unable to reset password')
        return
      }
      router.push('/sign-in?reset=1')
    } catch {
      setError('Network error. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <div className="flex flex-col gap-2">
        <p className="eyebrow">ACCOUNT RECOVERY</p>
        <h1 className="text-balance font-mono text-4xl font-black uppercase italic">New password</h1>
        <p className="text-muted-foreground">Choose a new password with at least 8 characters.</p>
      </div>
      {token ? (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <label className="field">
            New password
            <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" invalid={Boolean(error)} />
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
                Reset password
                <ArrowRight aria-hidden="true" />
              </>
            )}
          </button>
        </form>
      ) : (
        <p role="alert" className="text-sm text-destructive">
          This reset link is invalid or has expired.{' '}
          <Link href="/forgot-password" className="font-bold underline">
            Request a new one
          </Link>
        </p>
      )}
    </AuthShell>
  )
}
