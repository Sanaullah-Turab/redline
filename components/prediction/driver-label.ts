import type { Driver } from '@/lib/f1'

export function driverFallback(id: string): Driver {
  return { id, code: id.slice(0, 3).toUpperCase(), number: '', givenName: '', familyName: id.replace(/_/g, ' '), nationality: '' }
}

export function driverMeta(driver: Driver) {
  return [driver.code, driver.replaces ? 'Replacement' : driver.nationality].filter(Boolean).join(' · ')
}

export function driverName(driver: Driver) {
  return `${driver.givenName} ${driver.familyName}`.trim()
}
