const DRIVER_MAP: Record<string, string> = {
  '1': 'norris',
  '3': 'max_verstappen',
  '5': 'bortoleto',
  '6': 'hadjar',
  '10': 'gasly',
  '11': 'perez',
  '12': 'antonelli',
  '14': 'alonso',
  '16': 'leclerc',
  '18': 'stroll',
  '22': 'tsunoda',
  '23': 'albon',
  '27': 'hulkenberg',
  '30': 'lawson',
  '31': 'ocon',
  '41': 'lindblad',
  '43': 'colapinto',
  '44': 'hamilton',
  '55': 'sainz',
  '63': 'russell',
  '77': 'bottas',
  '81': 'piastri',
  '87': 'bearman',
}

const CODE_MAP: Record<string, string> = {
  NOR: 'norris',
  VER: 'max_verstappen',
  BOR: 'bortoleto',
  HAD: 'hadjar',
  GAS: 'gasly',
  PER: 'perez',
  ANT: 'antonelli',
  ALO: 'alonso',
  LEC: 'leclerc',
  STR: 'stroll',
  TSU: 'tsunoda',
  ALB: 'albon',
  HUL: 'hulkenberg',
  LAW: 'lawson',
  OCO: 'ocon',
  LIN: 'lindblad',
  COL: 'colapinto',
  HAM: 'hamilton',
  SAI: 'sainz',
  RUS: 'russell',
  BOT: 'bottas',
  PIA: 'piastri',
  BEA: 'bearman',
}

const ALIAS_MAP: Record<string, string> = {
  arvid_lindblad: 'lindblad',
}

export function normalizeDriverId(id: string): string {
  const clean = id.trim().toLowerCase()
  return ALIAS_MAP[clean] ?? clean
}

export function mapOpenF1Driver(driverNumber: number | string, code?: string): string | null {
  const numKey = String(driverNumber).trim()
  if (DRIVER_MAP[numKey]) return DRIVER_MAP[numKey]
  if (code) {
    const codeKey = code.trim().toUpperCase()
    if (CODE_MAP[codeKey]) return CODE_MAP[codeKey]
  }
  return null
}

export function areDriversEquivalent(a: string, b: string): boolean {
  return normalizeDriverId(a) === normalizeDriverId(b)
}
