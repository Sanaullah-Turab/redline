'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, LoaderCircle, MailCheck } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { AuthShell } from '@/components/auth-shell'
import { PasswordInput } from '@/components/password-input'

type Props = { mode: 'sign-in' | 'sign-up'; next?: string; canReset?: boolean; notice?: string }

export function AuthForm({ mode, next = '/', canReset = false, notice }: Props) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sentTo, setSentTo] = useState('')
  const signUp = mode === 'sign-up'
  const query = next === '/' ? '' : `?next=${encodeURIComponent(next)}`

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = signUp
        ? await authClient.signUp.email({ name, email, password, callbackURL: next })
        : await authClient.signIn.email({ email, password, callbackURL: next })
      if (result.error) {
        if (result.error.status === 403) {
          setSentTo(email)
          return
        }
        setError(result.error.message || 'Unable to continue')
        return
      }
      if (signUp && !result.data?.token) {
        setSentTo(email)
        return
      }
      router.push(next)
      router.refresh()
    } catch {
      setError('Network error. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sentTo) {
    return (
      <AuthShell>
        <div className="flex flex-col gap-4" role="status">
          <MailCheck className="size-10 text-primary" aria-hidden="true" />
          <h1 className="text-balance font-mono text-4xl font-black uppercase italic">Check your inbox</h1>
          <p className="text-muted-foreground">
            We sent a verification link to <strong className="text-foreground">{sentTo}</strong>. Open it to activate your account, then sign in.
          </p>
          <button type="button" className="button-primary h-12" onClick={() => setSentTo('')}>
            Back
          </button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <div className="flex flex-col gap-2">
        <p className="eyebrow">2026 PREDICTION CHAMPIONSHIP</p>
        <h1 className="text-balance font-mono text-4xl font-black uppercase italic">
          {signUp ? 'Join the grid' : 'Back on track'}
        </h1>
        <p className="text-muted-foreground">
          {signUp
            ? 'Create your profile and start making picks.'
            : 'Sign in to manage your race weekend predictions.'}
        </p>
      </div>
      {notice && (
        <p role="status" className="auth-notice">
          {notice}
        </p>
      )}
      <form onSubmit={submit} className="flex flex-col gap-4">
        {signUp && (
          <label className="field">
            Display name
            <input
              id="auth-name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </label>
        )}
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
        <label className="field">
          <span className="flex items-center justify-between">
            Password
            {!signUp && canReset && (
              <Link href={`/forgot-password${query}`} className="text-foreground underline">
                Forgot password?
              </Link>
            )}
          </span>
          <PasswordInput
            value={password}
            onChange={setPassword}
            autoComplete={signUp ? 'new-password' : 'current-password'}
            invalid={Boolean(error)}
          />
          {signUp && <span className="font-normal">At least 8 characters.</span>}
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
              {signUp ? 'Create account' : 'Sign in'}
              <ArrowRight aria-hidden="true" />
            </>
          )}
        </button>
      </form>
      <p className="text-sm text-muted-foreground">
        {signUp ? 'Already racing? ' : 'New to Redline? '}
        <Link className="font-bold text-foreground underline" href={`${signUp ? '/sign-in' : '/sign-up'}${query}`}>
          {signUp ? 'Sign in' : 'Create account'}
        </Link>
      </p>
    </AuthShell>
  )
}
