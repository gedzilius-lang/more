import {
  pgTable, uuid, text, boolean, jsonb, timestamp, bigserial, integer, index
} from 'drizzle-orm/pg-core'

export const cards = pgTable('cards', {
  id:           uuid('id').primaryKey().defaultRandom(),
  username:     text('username').unique().notNull(),
  email:        text('email').unique().notNull(),
  pincodeHash:  text('pincode_hash').notNull(),
  displayName:  text('display_name'),
  published:    boolean('published').default(true).notNull(),
  configJson:   jsonb('config_json').notNull().$type<CardConfig>(),
  createdAt:    timestamp('created_at').defaultNow().notNull(),
  updatedAt:    timestamp('updated_at').defaultNow().notNull(),
})

export const links = pgTable('links', {
  id:        uuid('id').primaryKey().defaultRandom(),
  cardId:    uuid('card_id').references(() => cards.id, { onDelete: 'cascade' }).notNull(),
  key:       text('key').notNull(),
  label:     text('label').notNull(),
  url:       text('url').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isHidden:  boolean('is_hidden').default(false).notNull(),
}, (t) => ({
  cardIdx: index('links_card_idx').on(t.cardId),
}))

export const events = pgTable('events', {
  id:      bigserial('id', { mode: 'number' }).primaryKey(),
  cardId:  uuid('card_id').references(() => cards.id, { onDelete: 'cascade' }).notNull(),
  type:    text('type').notNull(),
  linkKey: text('link_key'),
  ts:      timestamp('ts', { withTimezone: true }).defaultNow().notNull(),
  ua:      text('ua'),
  ref:     text('ref'),
  ipHash:  text('ip_hash'),
}, (t) => ({
  cardTsIdx:   index('events_card_ts_idx').on(t.cardId, t.ts),
  cardTypeIdx: index('events_card_type_idx').on(t.cardId, t.type, t.ts),
  cardLinkIdx: index('events_card_link_idx').on(t.cardId, t.linkKey, t.ts),
}))

export const resetTokens = pgTable('reset_tokens', {
  id:        uuid('id').primaryKey().defaultRandom(),
  cardId:    uuid('card_id').references(() => cards.id, { onDelete: 'cascade' }).notNull(),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  used:      boolean('used').default(false).notNull(),
})

export type ProfileBlock  = { id: string; type: 'profile';  name: string; bio?: string; avatar?: string; hidden?: boolean }
export type LinkBlock     = { id: string; type: 'link';     key: string; label: string; url: string; icon?: string; hidden?: boolean }
export type TextBlock     = { id: string; type: 'text';     markdown: string; hidden?: boolean }
export type ImageBlock    = { id: string; type: 'image';    src: string; alt?: string; hidden?: boolean }
export type ContactBlock  = { id: string; type: 'contact';  email?: string; phone?: string; hidden?: boolean }
export type QRBlock       = { id: string; type: 'qr';       hidden?: boolean }

export type Block = ProfileBlock | LinkBlock | TextBlock | ImageBlock | ContactBlock | QRBlock

export interface CardConfig {
  theme?: 'dark' | 'light' | 'neon'
  blocks: Block[]
}

export const invites = pgTable('invites', {
  id:        uuid('id').primaryKey().defaultRandom(),
  email:     text('email').notNull(),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  used:      boolean('used').default(false).notNull(),
  usedAt:    timestamp('used_at', { withTimezone: true }),
  cardId:    uuid('card_id').references(() => cards.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export type Card    = typeof cards.$inferSelect
export type NewCard = typeof cards.$inferInsert
export type Link    = typeof links.$inferSelect
export type Event   = typeof events.$inferSelect
export type Invite  = typeof invites.$inferSelect
