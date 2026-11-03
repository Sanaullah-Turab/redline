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
  '50': 'hirakawa',
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
  HIR: 'hirakawa',
  SAI: 'sainz',
  RUS: 'russell',
  BOT: 'bottas',
  PIA: 'piastri',
  BEA: 'bearman',
}

const ALIAS_MAP: Record<string, string> = {
  arvid_lindblad: 'lindblad',
  andrea_kimi_antonelli: 'antonelli',
  kimi_antonelli: 'antonelli',
  isack_hadjar: 'hadjar',
  gabriel_bortoleto: 'bortoleto',
  franco_colapinto: 'colapinto',
  oliver_bearman: 'bearman',
  liam_lawson: 'lawson',
  sergio_perez: 'perez',
  carlos_sainz: 'sainz',
  nico_hulkenberg: 'hulkenberg',
  pierre_gasly: 'gasly',
  lance_stroll: 'stroll',
  fernando_alonso: 'alonso',
  alexander_albon: 'albon',
  esteban_ocon: 'ocon',
  valtteri_bottas: 'bottas',
  oscar_piastri: 'piastri',
  lando_norris: 'norris',
  george_russell: 'russell',
  charles_leclerc: 'leclerc',
  lewis_hamilton: 'hamilton',
  verstappen: 'max_verstappen',
  ryo_hirakawa: 'hirakawa',
}

export function normalizeDriverId(id: unknown): string {
  if (typeof id !== 'string') return ''
  const clean = id.trim().toLowerCase()
  if (!clean) return ''
  return ALIAS_MAP[clean] ?? clean
}

export function mapOpenF1Driver(driverNumber: number | string | null | undefined, code?: string | null): string | null {
  if (driverNumber != null) {
    const numKey = String(driverNumber).trim()
    if (DRIVER_MAP[numKey]) return DRIVER_MAP[numKey]
  }
  if (typeof code === 'string') {
    const codeKey = code.trim().toUpperCase()
    if (CODE_MAP[codeKey]) return CODE_MAP[codeKey]
  }
  return null
}

export function deriveDriverId(lastName: string | null | undefined): string {
  if (typeof lastName !== 'string') return ''
  return lastName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

export function resolveDriverId(driverNumber: number | string | null | undefined, code?: string | null, lastName?: string | null): string | null {
  return mapOpenF1Driver(driverNumber, code) ?? (deriveDriverId(lastName) || null)
}

export function areDriversEquivalent(a: unknown, b: unknown): boolean {
  const normA = normalizeDriverId(a)
  const normB = normalizeDriverId(b)
  return Boolean(normA && normB && normA === normB)
}
