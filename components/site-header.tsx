import Link from 'next/link'
import { Flag, Trophy } from 'lucide-react'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { SignOutButton } from './sign-out-button'

export async function SiteHeader() {
  const session = await auth.api.getSession({ headers: await headers() })
  return <header className="border-b border-border bg-card"><div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 lg:px-8"><Link href="/" className="flex items-center gap-2 font-mono text-xl font-black italic tracking-tighter"><span className="flex size-9 items-center justify-center bg-primary text-primary-foreground"><Flag aria-hidden="true" /></span>REDLINE</Link><nav aria-label="Main navigation" className="flex items-center gap-1"><Link href="/" className="nav-link">Championship</Link><Link href="/leaderboard" className="nav-link"><Trophy aria-hidden="true" /> Leaderboard</Link>{session?.user ? <SignOutButton name={session.user.name} /> : <Link href="/sign-in" className="button-primary">Sign in</Link>}</nav></div></header>
}
