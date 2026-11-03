import { BarChart3, CalendarDays, Home, ListChecks, ShieldCheck, Trophy, type LucideIcon } from 'lucide-react'

export type NavItem = { href: string; label: string; subtitle: string; icon: LucideIcon }

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Home', subtitle: 'Predictions and round status', icon: Home },
  { href: '/calendar', label: 'Calendar', subtitle: '2026 Grand Prix schedule', icon: CalendarDays },
  { href: '/leaderboard', label: 'Leaderboard', subtitle: 'Championship standings', icon: Trophy },
  { href: '/stats', label: 'Stats', subtitle: 'Season telemetry and accuracy', icon: BarChart3 },
  { href: '/picks', label: 'My Picks', subtitle: 'Weekend predictions and scored hits', icon: ListChecks },
]

const ADMIN_ITEM: NavItem = { href: '/admin', label: 'Admin', subtitle: 'Entry lists and reference data', icon: ShieldCheck }

export function navItemsFor(isAdmin: boolean): NavItem[] {
  return isAdmin ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS
}

export function isActive(href: string, pathname: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}
