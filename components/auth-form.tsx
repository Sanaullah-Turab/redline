'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Eye, EyeOff, LoaderCircle, MailCheck } from 'lucide-react'
import { authClient } from '@/lib/auth-client'

export function AuthForm({ mode, next = '/' }: { mode: 'sign-in' | 'sign-up'; next?: string }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
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
      <main className="auth-shell">
        <section className="auth-panel" role="status">
          <MailCheck className="size-10 text-primary" aria-hidden="true" />
          <h1 className="text-balance font-mono text-4xl font-black uppercase italic">Check your inbox</h1>
          <p className="text-muted-foreground">
            We sent a verification link to <strong className="text-foreground">{sentTo}</strong>. Open it to activate your account, then sign in.
          </p>
          <button type="button" className="button-primary h-12" onClick={() => setSentTo('')}>
            Back
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <Link href="/" className="font-mono text-xl font-black italic tracking-wide">
          <span className="text-white">RED</span>
          <span className="text-primary">LINE</span>
        </Link>
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
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'auth-error' : undefined}
              autoComplete="email"
            />
          </label>
          <label className="field">
            Password
            <span className="relative flex">
              <input
                id="auth-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={signUp ? 'new-password' : 'current-password'}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'auth-error' : undefined}
                className="w-full pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
              </button>
            </span>
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
      </section>
      <aside className="auth-art" aria-hidden="true">
        <div className="speed-lines" />
        <p className="font-mono text-8xl font-black italic text-primary">1</p>
        <p className="max-w-sm text-3xl font-bold text-primary-foreground">
          Every position. Every point. Every race.
        </p>
      </aside>
    </main>
  )
}
