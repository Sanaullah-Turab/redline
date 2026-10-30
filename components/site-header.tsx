import Link from 'next/link'
import { Flag } from 'lucide-react'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { MobileMenu } from './mobile-menu'
import { NavLinks } from './nav-links'
import { SignOutButton } from './sign-out-button'

export async function SiteHeader() {
  const session = await auth.api.getSession({ headers: await headers() })
  const user = session?.user ? { id: session.user.id, name: session.user.name } : null

  return (
    <header className="site-header">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-mono text-xl font-black italic tracking-tighter">
          <span className="logo-mark"><Flag aria-hidden="true" /></span>
          REDLINE
        </Link>
        <nav aria-label="Main navigation" className="hidden md:flex items-center gap-1">
          <NavLinks />
          {user ? <SignOutButton id={user.id} name={user.name} /> : <Link href="/sign-in" className="button-primary">Sign in</Link>}
        </nav>
        <div className="flex md:hidden items-center">
          <MobileMenu user={user} />
        </div>
      </div>
    </header>
  )
}
