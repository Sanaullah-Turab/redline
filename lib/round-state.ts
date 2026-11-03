import { isSprint, sessionStart, type Race, type SessionType } from '@/lib/f1'

export function weekendSessions(race: Race): SessionType[] {
  return isSprint(race) ? ['sprint-qualifying', 'sprint', 'qualifying', 'race'] : ['qualifying', 'race']
}

export function sessionLocked(race: Race, type: SessionType, now: Date = new Date()): boolean {
  const start = sessionStart(race, type)
  return Number.isNaN(start.getTime()) || now >= start
}

export function allPredictionsLocked(race: Race, now: Date = new Date()): boolean {
  return weekendSessions(race).every((type) => sessionLocked(race, type, now))
}
