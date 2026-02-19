# more_claude.md — PeopleWeLike /more (NFC Digital Business Cards) — Source of Truth

You are Claude Code operating in repository: `https://github.com/gedzilius-lang/more`

Act as the owning engineer. Deliver a production deployment on the existing VPS without interrupting radio or any other services.

This project is a *separate* service: separate repo, separate docker compose stack, separate host nginx vhost, separate data directories, separate logs, separate ports. Reuse the same operating discipline as the existing runbooks: `/compact`, session logs, small commits, verification gates. :contentReference[oaicite:0]{index=0}

---

## 0) Session Rules (non-negotiable)

1) Immediately run `/compact` and keep responses minimal and execution-focused. :contentReference[oaicite:1]{index=1}  
2) Maintain a Git-tracked log of everything you do:
   - Create `ops/logs/SESSION-YYYYMMDD-HHMMZ.md`
   - Every VPS action must be recorded: intent, command, files changed, restarts, short test outputs. :contentReference[oaicite:2]{index=2}
3) Commit early and often with clear messages.
4) No broad repo scans. Only open what you need; max 8 files at a time. :contentReference[oaicite:3]{index=3}
5) Never modify unrelated sites (radio/os/admin/av/etc). :contentReference[oaicite:4]{index=4}

---

## 1) Product Contract

### 1.1 Domains + routes
- `https://more.peoplewelike.club/` must **redirect (302 or 301)** to `https://radio.peoplewelike.club/`.
- Public business card URL (NFC target):
  - `https://more.peoplewelike.club/more/:username`
  - Example: `https://more.peoplewelike.club/more/oscarzillini`

### 1.2 Login location + behavior
- Login URL is **per-card**:
  - `https://more.peoplewelike.club/more/:username/login`
- Public card must include a **subtle hyperlink at the bottom** (e.g. “login”) that goes to the per-card login URL.
- Login requires:
  - **email + pincode** (pincode acts as password)
- Password reset:
  - user requests reset → system sends email to the registered email for that card
  - reset sets a new pincode (or a one-time reset token leading to “set new pincode”)

### 1.3 Registration / provisioning policy
- No public signup.
- Accounts are provisioned by admin (“private email registration”):
  - Admin creates a card with `{username, email, pincode}`
  - System sends a registration email containing:
    - the public NFC URL
    - the login URL
    - minimal instructions

### 1.4 Editor requirements
Authenticated user can configure card with:
- custom sections
- reorder sections
- hide/show sections
- add new blocks (within a supported block set)
- edit block content (text, links, media)
- upload profile images (png/jpg)

### 1.5 Analytics (required)
- Track click analytics for outbound links:
  - per-card totals
  - per-link totals
  - time series (daily)
- Display analytics in the admin dashboard for that card.

### 1.6 QR code (required)
- Each card has an individual QR code pointing to:
  - `https://more.peoplewelike.club/more/:username`
- QR should be displayed on the public card (optional) and in the dashboard (required).
- QR can be generated on-demand (no need to store a PNG), but must render fast.

### 1.7 UI consistency
- Match `os.peoplewelike.club` visual language:
  - typography, spacing, dark theme feel, card glow, button styles, inputs.
- Implementation strategy:
  - copy a minimal set of design tokens (CSS variables + a small component style sheet) into this repo.
  - do **not** hard-couple to other repos at build time (no shared package dependency required for v1).

---

## 2) NFC Reality + Recommendation

NFC tags will open the URL in a browser. The simplest and most compatible solution is correct:
- Encode the NFC tag as a plain URL:
  - `https://more.peoplewelike.club/more/:username`

Recommendation (safe, optional for v1):
- Make `/more/:username` a lightweight, fast SSR page with:
  - proper OpenGraph tags (name, image)
  - `apple-mobile-web-app-capable` and viewport settings
  - optional “Add to Home Screen” hint (non-blocking)
Do **not** require any app install for v1.

---

## 3) Architecture (best solution, isolated from radio)

### 3.1 Deploy model
- Create a standalone docker compose stack for `/more`:
  - app container (Next.js)
  - (optional) worker container if needed later
- Do **not** bind to ports already used by radio/os/admin.
- Host nginx remains TLS terminator and routes by Host header. :contentReference[oaicite:5]{index=5}

### 3.2 Database choice (clarified)
There is already a Postgres 16 container in the broader VPS ecosystem. :contentReference[oaicite:6]{index=6}  
Best practice here:
- Reuse the existing Postgres container *without sharing schemas blindly*:
  - create a new database: `pwl_more`
  - create a new user: `pwl_more`
  - use separate tables/migrations
This avoids running a second Postgres while staying operationally isolated.

If the existing Postgres is not reachable from the `/more` compose network, then add a dedicated Postgres container for `/more` only. Prefer reuse first.

### 3.3 Data storage (uploads)
- Store uploaded images on VPS disk (as requested), in a dedicated path:
  - `/var/lib/pwl-more/uploads/`
- App writes to that directory via a docker volume mount.
- Host nginx serves `/uploads/` from that directory as static files (read-only).
- Allow png/jpg only.
- Max upload size:
  - 10 MB per file (enough for modern phone photos; still controlled)
- On upload, the server must:
  - validate MIME + magic bytes
  - strip EXIF (privacy + size) OR re-encode via sharp
  - generate resized variants (e.g. 256, 512, 1024) to keep pages fast

### 3.4 Security posture
- Rate limit login + reset endpoints (nginx `limit_req`).
- Store pincode as a strong hash (argon2id or bcrypt).
- Sessions:
  - Use signed cookies (httpOnly, secure, sameSite=lax).
- Public endpoints must not leak email.

---

## 4) Data Model (v1)

### 4.1 Tables (minimum)
Use migrations (e.g. drizzle/knex/prisma; pick one and standardize).

1) `cards`
- `id` uuid pk
- `username` text unique not null
- `email` text unique not null
- `pincode_hash` text not null
- `display_name` text
- `published` bool default true
- `config_json` jsonb not null  -- sections + theme + content
- `created_at`, `updated_at`

2) `links`
- `id` uuid pk
- `card_id` fk -> cards
- `key` text not null          -- stable identifier per link
- `label` text not null
- `url` text not null
- `sort_order` int not null
- `is_hidden` bool default false

(If links are fully inside `config_json`, still create a derived table for analytics key stability OR ensure config includes stable IDs.)

3) `events`
- `id` bigserial pk
- `card_id` fk
- `type` text not null         -- e.g. "link_click", "page_view"
- `link_key` text null
- `ts` timestamptz not null default now()
- `ua` text null (truncate)
- `ref` text null (truncate)
- `ip_hash` text null (optional; privacy-preserving)
Indexes:
- `(card_id, ts desc)`
- `(card_id, type, ts desc)`
- `(card_id, link_key, ts desc)`

### 4.2 Card config format (required capability)
`config_json` must support “custom sections” with reorder/hide/add blocks.

Define block types (v1):
- `profile` (name, title, bio, avatar, cover)
- `links` (render from config or `links` table)
- `text` (markdown-lite)
- `image` (uploaded image)
- `gallery` (list of images)
- `embed` (safe allowlist: e.g. Spotify, SoundCloud, YouTube)
- `contact` (email/phone/whatsapp)
- `qr` (renders QR)
Each block has:
- `id` (uuid)
- `type`
- `title` optional
- `is_hidden`
- `data` (type-specific)

Reordering is literally ordering of the blocks array.

---

## 5) HTTP Routes / Pages (contract)

### Public
- `GET /` → redirect to `https://radio.peoplewelike.club/`
- `GET /more/:username` → render business card
- `GET /more/:username/qr` → returns QR (SVG preferred)
- `GET /more/:username/l/:linkKey` → records analytics then 302 redirect to external URL
  - All outbound links rendered on the card should go through this redirect to track clicks.

### Auth
- `GET /more/:username/login` → login page
- `POST /more/:username/login` → sets session cookie
- `POST /more/:username/logout` → clears cookie
- `GET /more/:username/reset` → reset request form
- `POST /more/:username/reset` → emails a reset token
- `GET /more/:username/reset/:token` → set new pincode form
- `POST /more/:username/reset/:token` → updates pincode_hash

### Dashboard
- `GET /more/:username/admin` → editor + analytics (auth required)
- `POST /api/card/:username/config` → update config (auth)
- `POST /api/card/:username/upload` → upload image (auth)
- `GET /api/card/:username/analytics` → analytics JSON (auth)

### Health
- `GET /health` → `{"ok":true}` (no auth)

---

## 6) Email sending (reset + registration)

Use SMTP (preferred) or a transactional provider if already available.

Minimum:
- `.env` contains SMTP settings
- all emails must be plain text + minimal HTML
- store reset tokens hashed in DB with expiry (15–60 minutes)

---

## 7) VPS Deployment Plan (must not interrupt radio)

### 7.1 Constraints
- Host nginx keeps `:80/:443` and routes subdomains. :contentReference[oaicite:7]{index=7}
- Cloudflare is proxied for `more.peoplewelike.club` and points to:
  - `72.60.181.89` (given)
- Do not touch radio compose stacks or nginx vhosts.

### 7.2 Proposed filesystem layout
- Repo checkout:
  - `/opt/pwl-more/more` (git clone here)
- Runtime data:
  - `/var/lib/pwl-more/uploads`
  - `/var/lib/pwl-more/state` (optional)
- Nginx site:
  - `/etc/nginx/sites-available/more.peoplewelike.club.conf`
  - symlink into `sites-enabled`

### 7.3 Compose
Create:
- `docker-compose.yml` with a project name prefix `pwl-more`
- App container exposes internal port `3000`
- Map host port `127.0.0.1:3100 -> container:3000`
  - (choose a free localhost port; 3100 is a suggestion)
- Mount uploads volume:
  - `/var/lib/pwl-more/uploads:/data/uploads`

### 7.4 Nginx vhost (host)
- `server_name more.peoplewelike.club;`
- `/` → 301 to `https://radio.peoplewelike.club/` (or 302; choose 302 during rollout, 301 once stable)
- `/more/` and `/health` and `/_next/` proxied to `http://127.0.0.1:3100`
- `/uploads/` served directly:
  - `alias /var/lib/pwl-more/uploads/;`
  - add caching headers (immutable for hashed variants)
- Add `client_max_body_size 10m;`
- Add rate limiting for login/reset:
  - `limit_req_zone $binary_remote_addr zone=more_auth:10m rate=5r/m;`
  - apply to `/more/*/login` and `/more/*/reset`

Note: Cloudflare SSL mode should remain consistent with the rest of the stack (likely Full). Existing infrastructure uses Cloudflare with origin cert handling; do not change global SSL settings for other services. :contentReference[oaicite:8]{index=8}

---

## 8) Implementation Steps (agent execution checklist)

### Phase A — Repo scaffold
1) Initialize Next.js app (App Router).
2) Add minimal design system:
   - `app/styles/tokens.css` (CSS vars)
   - `app/styles/ui.css` (card/button/input)
3) Add DB layer + migrations.
4) Implement public card route: `/more/[username]`
5) Implement tracked redirects: `/more/[username]/l/[linkKey]`
6) Implement QR endpoint.

### Phase B — Auth + dashboard
1) Implement per-card login page.
2) Implement session cookies.
3) Implement dashboard editor (blocks reorder/hide/add).
4) Implement uploads + image serving (saved to `/data/uploads`).
5) Implement reset flow email.

### Phase C — Analytics
1) Track:
   - page views (on `/more/:username`)
   - link clicks (on `/l/:linkKey`)
2) Dashboard charts:
   - clicks last 7/30 days
   - top links
Keep it simple: server aggregates via SQL group-by.

### Phase D — Admin provisioning tooling
Add a CLI script:
- `scripts/create_card.ts` (or `.js`)
- Inputs: username, email, pincode
- Creates card row with default config + default blocks + default links
- Sends registration email (optional flag `--send-email`)
This is the only way to create accounts in v1.

### Phase E — Deployment
1) Clone repo to `/opt/pwl-more/more`
2) Create `.env` (DB + SMTP + secrets)
3) Start compose
4) Add nginx vhost + reload nginx
5) Verify gates below

---

## 9) Verification Gates (must pass before “done”)

### Gate 1 — Routing
- `curl -I https://more.peoplewelike.club/` returns redirect to radio.
- `curl -fsS https://more.peoplewelike.club/health` returns `{"ok":true}`.
- Public card renders:
  - `curl -fsS https://more.peoplewelike.club/more/oscarzillini | head`

### Gate 2 — NFC contract
- On phone, scanning NFC opens:
  - `https://more.peoplewelike.club/more/oscarzillini`
- Page loads on iOS Safari + Android Chrome.

### Gate 3 — Auth
- `https://more.peoplewelike.club/more/oscarzillini/login` accepts email+pincode.
- Wrong creds → generic error (no user enumeration).
- Session persists across refresh.

### Gate 4 — Editor
- Add block, reorder, hide → public reflects.
- Upload png/jpg → appears on public page.
- Uploaded files exist on VPS under `/var/lib/pwl-more/uploads`.

### Gate 5 — Analytics
- Clicking any link increments counters.
- Dashboard shows totals and top links.

### Gate 6 — Reset email
- Reset request sends email.
- Token expires.
- New pincode works, old pincode invalid.

### Gate 7 — Isolation
- Confirm radio is unaffected:
  - no nginx changes to radio vhost
  - no port conflicts
  - `docker ps` shows `/more` stack separate from radio stack

All gate outputs must be recorded in the session log. :contentReference[oaicite:9]{index=9}

---

## 10) Deliverables Checklist (must exist in `gedzilius-lang/more`)

- [ ] `docker-compose.yml`
- [ ] `Dockerfile`
- [ ] `ops/logs/SESSION-YYYYMMDD-HHMMZ.md`
- [ ] `ops/runbooks/deploy.md` (exact commands to deploy/update)
- [ ] `ops/runbooks/backup.md` (DB + uploads backup/restore)
- [ ] `docs/PRODUCT.md` (this contract summarized)
- [ ] `docs/ADMIN_PROVISIONING.md` (how to create users/cards)
- [ ] `docs/NFC.md` (how to encode tags + QR usage)
- [ ] `scripts/create_card.*`
- [ ] `scripts/verify.sh` (runs key curls and sanity checks)

---

## 11) Recommendations (ship-fast, low-risk)

1) Track analytics via internal redirect (`/l/:linkKey`). Do not rely on client-side JS beacons as the only source of truth.
2) Keep block types limited in v1; “custom sections” is achieved by block array reorder/hide/add.
3) Generate QR as SVG on demand (fast, no storage); show it in dashboard and optionally public page.
4) For uploads: always re-encode + resize to control bandwidth and prevent EXIF leaks.
5) Use a single DB transaction per config update; store config as jsonb to avoid premature schema complexity.
6) Once stable, switch `/` redirect from 302 to 301.

---

## 12) Open Items the agent must decide (choose defaults that work)

- Choose DB toolkit: Prisma OR Drizzle. Prefer whichever yields fastest reliable migrations.
- Choose pincode hashing: argon2id preferred.
- Choose charting for dashboard: simplest (server-rendered counts + minimal client chart lib).

When choosing, document the decision in `docs/OPERATIONS.md` and in the session log. :contentReference[oaicite:10]{index=10}
