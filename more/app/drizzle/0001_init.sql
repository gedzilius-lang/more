CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  pincode_hash text NOT NULL,
  display_name text,
  published boolean NOT NULL DEFAULT true,
  config_json jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  key text NOT NULL,
  label text NOT NULL,
  url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_hidden boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS links_card_idx ON links(card_id);

CREATE TABLE IF NOT EXISTS events (
  id bigserial PRIMARY KEY,
  card_id uuid NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  type text NOT NULL,
  link_key text,
  ts timestamptz NOT NULL DEFAULT now(),
  ua text,
  ref text,
  ip_hash text
);
CREATE INDEX IF NOT EXISTS events_card_ts_idx ON events(card_id, ts DESC);
CREATE INDEX IF NOT EXISTS events_card_type_idx ON events(card_id, type, ts DESC);
CREATE INDEX IF NOT EXISTS events_card_link_idx ON events(card_id, link_key, ts DESC);

CREATE TABLE IF NOT EXISTS reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false
);
