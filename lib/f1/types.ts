export type Driver = { id: string; code: string; number: string; givenName: string; familyName: string; nationality: string; replaces?: string }
export type Race = { round: number; name: string; circuit: string; locality: string; country: string; date: string; time: string; qualifyingDate?: string; qualifyingTime?: string; sprintDate?: string; sprintTime?: string; sprintQualifyingDate?: string; sprintQualifyingTime?: string }
export type SessionType = 'qualifying' | 'race' | 'sprint-qualifying' | 'sprint'

export type OfficialResult = {
  positions: string[]
  allClassified: string[]
}

export type OfficialResultOutcome = {
  result: OfficialResult | null
  pendingReason?: string
}
