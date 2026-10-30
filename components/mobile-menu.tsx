'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BarChart3,
  CalendarDays,
  ChevronRight,
  Home,
  LogOut,
  Menu,
  Trophy,
  UserRound,
  X,
} from 'lucide-react'
import { authClient } from '@/lib/auth-client'

interface MobileMenuProps {
  user?: {
    id: string
    name: string
  } | null
}

const navItems = [
  { href: '/', label: 'Home', subtitle: 'Predictions and round status', icon: Home },
  { href: '/calendar', label: 'Calendar', subtitle: '2026 Grand Prix schedule', icon: CalendarDays },
  { href: '/leaderboard', label: 'Leaderboard', subtitle: 'Championship standings', icon: Trophy },
  { href: '/stats', label: 'Stats', subtitle: 'Season telemetry and accuracy', icon: BarChart3 },
]

export function MobileMenu({ user }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!isOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleSignOut = async () => {
    setIsOpen(false)
    await authClient.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <>
      <button
        type="button"
        className="mobile-menu-toggle"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
      >
        {isOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>

      {isOpen && (
        <>
          <div
            className="mobile-drawer-backdrop"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="mobile-drawer" role="dialog" aria-modal="true" aria-label="Mobile Navigation">
            <div className="mobile-drawer-body">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="eyebrow flex items-center gap-2">
                  <span className="live-dot" aria-hidden="true" />
                  NAVIGATION
                </span>
                <span className="font-mono text-xs text-muted-foreground">F1 2026</span>
              </div>

              <nav className="flex flex-col gap-2" aria-label="Mobile menu links">
                {navItems.map(({ href, label, subtitle, icon: Icon }, index) => {
                  const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
                  return (
                    <Link
                      key={href}
                      href={href}
                      className="mobile-nav-link rise"
                      data-active={active}
                      style={{ '--i': index } as React.CSSProperties}
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="mobile-nav-icon">
                        <Icon aria-hidden="true" />
                      </span>
                      <span className="mobile-nav-content">
                        <span className="mobile-nav-title">{label}</span>
                        <span className="mobile-nav-sub">{subtitle}</span>
                      </span>
                      <ChevronRight className="text-muted-foreground size-4 ml-auto" aria-hidden="true" />
                    </Link>
                  )
                })}
              </nav>

              <div className="mt-2 pt-4 border-t border-border flex flex-col gap-3">
                {user ? (
                  <>
                    <Link
                      href={`/profile/${user.id}`}
                      className="mobile-profile-card rise"
                      style={{ '--i': 4 } as React.CSSProperties}
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="avatar size-9" aria-hidden="true">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="mobile-nav-content">
                        <span className="mobile-nav-title truncate">{user.name}</span>
                        <span className="mobile-nav-sub">View driver profile</span>
                      </span>
                      <UserRound className="size-4 text-primary ml-auto" aria-hidden="true" />
                    </Link>
                    <button
                      type="button"
                      className="mobile-sign-out-btn"
                      onClick={handleSignOut}
                    >
                      <LogOut className="size-4" aria-hidden="true" />
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/sign-in"
                      className="button-primary w-full text-center"
                      onClick={() => setIsOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/sign-up"
                      className="button-secondary w-full text-center"
                      onClick={() => setIsOpen(false)}
                    >
                      Create Account
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
