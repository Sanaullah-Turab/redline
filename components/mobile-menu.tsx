'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowUpRight, LogOut, Menu, X } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { isActive, navItemsFor } from './nav-items'

interface MobileMenuProps {
  user?: {
    id: string
    name: string
  } | null
  isAdmin?: boolean
}

export function MobileMenu({ user, isAdmin = false }: MobileMenuProps) {
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
              {user && (
                <Link
                  href={`/profile/${user.id}`}
                  className="mobile-profile-card"
                  onClick={() => setIsOpen(false)}
                >
                  <span className="mobile-profile-avatar" aria-hidden="true">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="mobile-nav-content">
                    <span className="mobile-profile-name">{user.name}</span>
                    <span className="mobile-nav-sub">View profile & stats</span>
                  </span>
                  <ArrowUpRight className="size-4 text-muted-foreground" aria-hidden="true" />
                </Link>
              )}

              <nav className="mobile-nav-list" aria-label="Mobile menu links">
                {navItemsFor(isAdmin).map(({ href, label, subtitle, icon: Icon }) => {
                  const active = isActive(href, pathname)
                  return (
                    <Link
                      key={href}
                      href={href}
                      className="mobile-nav-link"
                      data-active={active}
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="mobile-nav-icon">
                        <Icon aria-hidden="true" />
                      </span>
                      <span className="mobile-nav-content">
                        <span className="mobile-nav-title">{label}</span>
                        <span className="mobile-nav-sub">{subtitle}</span>
                      </span>
                      {active && <span className="mobile-active-dot" aria-hidden="true" />}
                    </Link>
                  )
                })}
              </nav>

              <div className="mobile-drawer-footer">
                {user ? (
                  <button
                    type="button"
                    className="mobile-sign-out-btn"
                    onClick={handleSignOut}
                  >
                    <LogOut className="size-4" aria-hidden="true" />
                    <span>Sign out</span>
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    <Link
                      href="/sign-in"
                      className="button-primary text-center"
                      onClick={() => setIsOpen(false)}
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/sign-up"
                      className="button-secondary text-center"
                      onClick={() => setIsOpen(false)}
                    >
                      Sign up
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
