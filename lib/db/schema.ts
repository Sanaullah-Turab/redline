import { boolean, index, integer, jsonb, pgTable, serial, text, timestamp, unique } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const user = pgTable('user', { id: text('id').primaryKey(), name: text('name').notNull(), email: text('email').notNull().unique(), emailVerified: boolean('emailVerified').notNull().default(false), image: text('image'), createdAt: timestamp('createdAt').notNull().defaultNow(), updatedAt: timestamp('updatedAt').notNull().defaultNow() })
export const session = pgTable('session', { id: text('id').primaryKey(), expiresAt: timestamp('expiresAt').notNull(), token: text('token').notNull().unique(), createdAt: timestamp('createdAt').notNull().defaultNow(), updatedAt: timestamp('updatedAt').notNull().defaultNow(), ipAddress: text('ipAddress'), userAgent: text('userAgent'), userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }) })
export const account = pgTable('account', { id: text('id').primaryKey(), accountId: text('accountId').notNull(), providerId: text('providerId').notNull(), userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }), accessToken: text('accessToken'), refreshToken: text('refreshToken'), idToken: text('idToken'), accessTokenExpiresAt: timestamp('accessTokenExpiresAt'), refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'), scope: text('scope'), password: text('password'), createdAt: timestamp('createdAt').notNull().defaultNow(), updatedAt: timestamp('updatedAt').notNull().defaultNow() })
export const verification = pgTable('verification', { id: text('id').primaryKey(), identifier: text('identifier').notNull(), value: text('value').notNull(), expiresAt: timestamp('expiresAt').notNull(), createdAt: timestamp('createdAt').defaultNow(), updatedAt: timestamp('updatedAt').defaultNow() })

export const predictions = pgTable('predictions', { id: serial('id').primaryKey(), userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }), userName: text('userName').notNull().default(''), season: integer('season').notNull(), round: integer('round').notNull(), sessionType: text('sessionType').notNull(), positions: jsonb('positions').$type<string[]>().notNull(), points: integer('points').notNull().default(0), scored: boolean('scored').notNull().default(false), submittedAt: timestamp('submittedAt').notNull().defaultNow(), updatedAt: timestamp('updatedAt').notNull().defaultNow() }, (table) => [unique().on(table.userId, table.season, table.round, table.sessionType), index('predictions_season_round_idx').on(table.season, table.round)])
export const eventResults = pgTable('event_results', { id: serial('id').primaryKey(), season: integer('season').notNull(), round: integer('round').notNull(), sessionType: text('sessionType').notNull(), positions: jsonb('positions').$type<string[]>().notNull(), fetchedAt: timestamp('fetchedAt').notNull().defaultNow() }, (table) => [unique().on(table.season, table.round, table.sessionType)])

export const roundDrivers = pgTable('round_drivers', {
  id: serial('id').primaryKey(),
  season: integer('season').notNull(),
  round: integer('round').notNull(),
  driverId: text('driverId').notNull(),
  code: text('code').notNull(),
  number: text('number').notNull(),
  givenName: text('givenName').notNull(),
  familyName: text('familyName').notNull(),
  nationality: text('nationality').notNull().default(''),
  replaces: text('replaces'),
  status: text('status').$type<'entered' | 'withdrawn'>().notNull().default('entered'),
  source: text('source').$type<'manual' | 'openf1'>().notNull().default('manual'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
}, (table) => [unique().on(table.season, table.round, table.driverId)])

export const sessionClassifications = pgTable('session_classifications', {
  id: serial('id').primaryKey(),
  season: integer('season').notNull(),
  round: integer('round').notNull(),
  sessionType: text('sessionType').notNull(),
  source: text('source').$type<'manual' | 'openf1' | 'fastf1'>().notNull(),
  positions: jsonb('positions').$type<string[]>().notNull(),
  fetchedAt: timestamp('fetchedAt').notNull().defaultNow(),
}, (table) => [unique().on(table.season, table.round, table.sessionType, table.source)])

export const roundPodiums = pgTable('round_podiums', {
  id: serial('id').primaryKey(),
  season: integer('season').notNull(),
  round: integer('round').notNull(),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  points: integer('points').notNull(),
  position: integer('position').notNull(),
  computedAt: timestamp('computedAt').notNull().defaultNow(),
}, (table) => [unique().on(table.season, table.round, table.userId), index('round_podiums_season_round_idx').on(table.season, table.round)])

// Relations: lets Drizzle relational queries resolve user names from predictions and vice-versa
export const userRelations = relations(user, ({ many }) => ({
  predictions: many(predictions),
}))

export const predictionsRelations = relations(predictions, ({ one }) => ({
  user: one(user, { fields: [predictions.userId], references: [user.id] }),
}))
