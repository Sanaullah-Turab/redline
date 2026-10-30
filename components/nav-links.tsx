'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, CalendarDays, Home, Trophy } from 'lucide-react'

const links = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/stats', label: 'Stats', icon: BarChart3 },
]

export function NavLinks() {
  const pathname = usePathname()
  return (
    <>
      {links.map(({ href, label, icon: Icon }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
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
