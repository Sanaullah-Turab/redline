import type { Driver } from './types'

export const BASE_DRIVERS: Driver[] = [
  // Red Bull Racing
  { id: 'max_verstappen',  code: 'VER', number: '3',  givenName: 'Max',         familyName: 'Verstappen', nationality: 'Dutch' },
  { id: 'hadjar',          code: 'HAD', number: '6',  givenName: 'Isack',       familyName: 'Hadjar',     nationality: 'French' },

  // McLaren
  { id: 'norris',          code: 'NOR', number: '1',  givenName: 'Lando',       familyName: 'Norris',     nationality: 'British' },
  { id: 'piastri',         code: 'PIA', number: '81', givenName: 'Oscar',       familyName: 'Piastri',    nationality: 'Australian' },

  // Ferrari
  { id: 'leclerc',         code: 'LEC', number: '16', givenName: 'Charles',     familyName: 'Leclerc',    nationality: 'Monegasque' },
  { id: 'hamilton',        code: 'HAM', number: '44', givenName: 'Lewis',       familyName: 'Hamilton',   nationality: 'British' },

  // Mercedes
  { id: 'russell',         code: 'RUS', number: '63', givenName: 'George',      familyName: 'Russell',    nationality: 'British' },
  { id: 'antonelli',       code: 'ANT', number: '12', givenName: 'Andrea Kimi', familyName: 'Antonelli',  nationality: 'Italian' },

  // Aston Martin
  { id: 'alonso',          code: 'ALO', number: '14', givenName: 'Fernando',    familyName: 'Alonso',     nationality: 'Spanish' },
  { id: 'stroll',          code: 'STR', number: '18', givenName: 'Lance',       familyName: 'Stroll',     nationality: 'Canadian' },

  // Alpine
  { id: 'gasly',           code: 'GAS', number: '10', givenName: 'Pierre',      familyName: 'Gasly',      nationality: 'French' },
  { id: 'colapinto',       code: 'COL', number: '43', givenName: 'Franco',      familyName: 'Colapinto',  nationality: 'Argentine' },

  // Audi (formerly Sauber)
  { id: 'hulkenberg',      code: 'HUL', number: '27', givenName: 'Nico',        familyName: 'Hülkenberg', nationality: 'German' },
  { id: 'bortoleto',       code: 'BOR', number: '5',  givenName: 'Gabriel',     familyName: 'Bortoleto',  nationality: 'Brazilian' },

  // Williams
  { id: 'albon',           code: 'ALB', number: '23', givenName: 'Alexander',   familyName: 'Albon',      nationality: 'Thai' },
  { id: 'sainz',           code: 'SAI', number: '55', givenName: 'Carlos',      familyName: 'Sainz',      nationality: 'Spanish' },

  // Haas
  { id: 'ocon',            code: 'OCO', number: '31', givenName: 'Esteban',     familyName: 'Ocon',       nationality: 'French' },
  { id: 'bearman',         code: 'BEA', number: '87', givenName: 'Oliver',      familyName: 'Bearman',    nationality: 'British' },

  // Racing Bulls
  { id: 'lawson',          code: 'LAW', number: '30', givenName: 'Liam',        familyName: 'Lawson',     nationality: 'New Zealander' },
  { id: 'lindblad',        code: 'LIN', number: '41', givenName: 'Arvid',       familyName: 'Lindblad',   nationality: 'British' },

  // Cadillac
  { id: 'perez',           code: 'PER', number: '11', givenName: 'Sergio',      familyName: 'Pérez',      nationality: 'Mexican' },
  { id: 'bottas',          code: 'BOT', number: '77', givenName: 'Valtteri',    familyName: 'Bottas',     nationality: 'Finnish' },
]

export async function getDrivers(): Promise<Driver[]> {
  return BASE_DRIVERS
}
