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

export interface Block {
  id: string
  type: 'profile' | 'links' | 'text' | 'image' | 'gallery' | 'embed' | 'contact' | 'qr'
  title?: string
  is_hidden: boolean
  data: Record<string, unknown>
}

export interface CardConfig {
  theme: string
  blocks: Block[]
}

export type Card = typeof cards.$inferSelect
export type NewCard = typeof cards.$inferInsert
export type Link = typeof links.$inferSelect
export type Event = typeof events.$inferSelect
