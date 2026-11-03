'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { isActive, navItemsFor } from './nav-items'

export function NavLinks({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname()
  return (
    <>
      {navItemsFor(isAdmin).map(({ href, label, icon: Icon }) => {
        const active = isActive(href, pathname)
        return (
          <Link key={href} href={href} className="nav-link" data-active={active} aria-current={active ? 'page' : undefined}>
            <Icon aria-hidden="true" />
            <span className="nav-label">{label}</span>
          </Link>
        )
      })}
    </>
  )
}
