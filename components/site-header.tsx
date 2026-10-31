import Link from 'next/link'
import Image from 'next/image'
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
        <Link href="/" className="group flex items-center gap-2.5 font-mono text-xl font-black italic tracking-wide">
          <span className="logo-mark">
            <Image
              src="/images/brand/redline-logo-mark.png"
              alt="Redline logo"
              width={48}
              height={30}
              className="h-7 w-auto object-contain"
              priority
            />
          </span>
          <span>
            <span className="text-white">RED</span>
            <span className="text-primary">LINE</span>
          </span>
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
