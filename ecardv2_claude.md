# ecardv2_claude.md — /more “Networking Experience v1” Upgrade (Oscar Zillini) — IMPLEMENTATION BRIEF

You are Claude Code working in repo: `https://github.com/gedzilius-lang/more`  
Target VPS: `72.60.181.89` (srv1178155). Radio is already deployed and MUST NOT be impacted.  
All changes must be shipped as a safe incremental upgrade to the existing deployed `/more` service.

## Non-negotiable boundaries
- Do NOT touch `/opt/radijas-v2` or any radio containers/ports/vhosts.
- Do NOT use radio ports `1935` or `8080`.
- Keep `/more` as a separate compose stack (`pwl-more-*`) and localhost-only app binding.
- Run `/compact` immediately. Minimize token usage.
- No SCP hotfixes. Code changes must be committed + deployed via git pull + docker compose rebuild.
- Maintain a session log committed to repo: `more/ops/logs/SESSION-YYYYMMDD-HHMMZ.md`

---

## Current production state (already deployed)
Live public card:
- `https://more.peoplewelike.club/more/oscarzillini`

Deployed features (already exist):
- AdminDashboard.tsx with tabs: editor / analytics / QR (block CRUD, image upload)
- Login/reset API moved under `/api/card/[username]/...`
- Block schema: flat union (`profile|link|text|image|contact|qr`)
- DB migrations: `cards, links, events, reset_tokens`
- Containers healthy; TLS working; `/` redirects to radio
Immediate note: oscarzillini pincode was weak previously; the new UX must push changing pincode.

---

## Objective
Transform the NFC card from “profile + links” into a **memorably interactive micro-experience**:
- first 5–10 seconds: “wow”
- then: personalization, reciprocity, and retention
- without being creepy; keep premium aesthetic

We will implement **Networking Experience v1** for Oscar and later generalize to all users, with tiering:
- **Basic**: core card + save contact + tracked links + analytics
- **Premium (paid/VIP)**: countdown secret section, keyword unlocks, live blocks, richer analytics

This task implements the core system changes + Oscar v1 template.

---

# A) UX / Product Spec — “Oscar Zillini Networking Experience v1”

## A1) First 3 seconds: “Portal” intro (pattern interrupt)
Add a new optional block type: `intro`
- plays a subtle 500–1200ms animation (CSS only; no heavy libraries)
- text example:
  - “Connection established.”
  - “You unlocked Oscar’s portal.”
- must be toggleable per card in config

## A2) Context-aware greeting (light personalization)
Add lightweight context fields for display:
- time of day (server time)
- city/country (approx IP geolocation)
Constraints:
- Do not store raw IP; only derive city display and discard raw IP (privacy).
- If geo lookup fails, fall back gracefully.

Implementation: `context` is computed at request time for `/more/:username` and injected into render, not stored.

## A3) Mode selection (interest-based paths)
After intro, show a “What do you want to see?” block (new type: `mode_select`)
Modes for v1:
- “🎧 Radio”
- “🧠 Tech / OS”
- “🎬 AV / Creative”
- “🪪 Contact”

When mode chosen:
- either (a) scrolls to relevant section, or (b) filters blocks to show a subset.
Choose (a) for v1 (simpler, less state issues). Option (b) is premium later.

## A4) Save-to-contacts (must save number/email on phones)
Add a **“Save Contact”** action that triggers native contact saving.

Required deliverables:
1) Generate a vCard `.vcf` dynamically per user:
   - route: `/more/:username/vcf`
   - includes:
     - full name
     - phone number (if provided)
     - email
     - website = public card URL
     - optional org/title
2) On card UI show a button:
   - “Save to Contacts”
   - link directly to the vCard route
3) Ensure the vCard content-type and headers trigger download/open on iOS/Android.

vCard fields must be editable in the editor (profile/contact blocks).

## A5) Memory hook (how we met) + retention
Add a block type: `memory_hook`
- Button: “Save how we met”
- opens minimal modal:
  - event (short text)
  - note (one line)
- Stores locally in the visitor’s browser (localStorage), keyed by username.
- On next visit, show:
  - “We met at {event} — {note}”
- Do NOT require login for this. It’s per-visitor memory.

## A6) Instant reciprocity (frictionless contact capture) — multiple options
We need “Share your contact with Oscar” but even more frictionless.

Implement **two options** (v1):
1) **Contact share quick form** (fastest to ship):
   - one tap opens minimal bottom sheet:
     - name
     - phone OR email (one required)
     - optional linkedin/instagram
   - submit triggers:
     - store as `lead` in DB
     - send email notification to card owner (SMTP)
   - If SMTP missing, still store lead in DB and show: “Saved. Oscar will see it.”
2) **QR reverse-share** (very low typing):
   - Show a QR code that encodes a “lead capture link” for Oscar:
     - visitor scans with camera and fills minimal form on their own device
   - This is useful when people don’t want to type on someone else’s phone.

Future (not now): device contact picker / Web Share API integration, native passkeys.

DB: add `leads` table.

## A7) Hidden “Backstage” section with countdown (projects in progress)
Add block type: `countdown_unlock`
- On first tap or on keyword unlock, user sees:
  - “Backstage opens for 10:00”
  - countdown timer
  - during countdown, reveal a hidden section “Projects in progress”
- After timer ends, hide again.
- Use client-side state; optionally store a short-lived token in localStorage.

Blocks revealed can be normal block types but flagged:
- `visibility: "locked"` with `unlock_group: "backstage"`

Owner can configure:
- duration (minutes)
- content blocks in that group

## A8) Live metadata pull (Radio)
Add block type: `live_radio`
- Pull currently-playing metadata from radio stack endpoint.
We must not break radio. Prefer read-only HTTP fetch.

Implementation approach:
- Add server route in /more that fetches radio now-playing JSON:
  - `GET /api/radio/now-playing`
- It proxies from whatever radio endpoint exists (determine URL from radijas STATUS / nginx routes).
- Cache response server-side 5–15 seconds.
UI displays:
- “Live now: {track} — {artist}”
- optional “Listen” button linking to radio stream page.

If radio has no now-playing endpoint, implement a placeholder that can be wired later, but keep the block functional with “Live now” hidden when unavailable.

## A9) Keyword unlock (choose one reward)
Add feature: keyword unlock -> visitor chooses ONE reward to unlock.

Add block type: `keyword_unlock`
- Input field: “Enter keyword”
- On correct keyword (per card, configurable):
  - show a choice modal (pick one):
    1) “Private playlist”
    2) “More Invite”
    3) “Couple of drinks”
  - After selection, reveal corresponding reward block(s).
Rewards:
- playlist: reveals links block or embed block
- invite: reveals one-time invite link generation (see below)
- drinks: reveals a coupon-style screen (text + QR) or “show this to Oscar” code

Security:
- Keywords are not secrets; treat as “light gate”.
- Prevent brute force: rate limit attempts client-side + server-side (store attempts per session/day).
- Do not store keyword in plain text in DB; store hash and compare.

## A10) Social proof counters (popularity)
Add “Popularity” display:
- “Taps today: N”
- “Last tap: X minutes ago”
We already track analytics; extend to count page views or “taps” as page views of `/more/:username`.

Implementation:
- record `page_view` events on server render (dedupe optional by session cookie to avoid spam).
- compute:
  - today views
  - last view timestamp
Return in `/api/card/:username/analytics-summary` for public display.

## A11) Conversation continuation (follow-up choices)
Add block type: `follow_up`
Options required:
- call
- email
- video call
- coffee
- night out

Visitor selects one -> creates a `lead_request` entry + optional message.
Owner sees in dashboard.

## A12) “Tell me what you’re building” (inbound opportunity)
Add a block type: `inbound_prompt`
- one question + short text box
- submits as lead message
- shows “Sent.”

---

# B) Admin / Owner Dashboard upgrades

## B1) Owner dashboard additions (per-card /more/:username/admin)
Add tabs or sections:
- **Leads**: list captured contacts + follow-up requests + messages
- **Security**: change pincode in-dashboard (clear UI)
  - requires current pincode OR session re-auth
  - also show “Forgot pincode?” -> triggers email reset
- **Experience**: toggle Networking Experience v1 features
  - enable/disable blocks: intro, mode_select, memory_hook, keyword_unlock, countdown_unlock, live_radio, social_proof, follow_up, inbound_prompt
- **Rewards**: configure keywords + reward blocks

## B2) Global admin (if already planned) — optional in this iteration
If global `/admin` exists already, integrate invite generation there too. If not, do not block this release; implement “More Invite” reward as card-owner capability:
- Owner can generate invite links for friends (Option B).

---

# C) Registration Option B (Invite Link) — REQUIRED NOW

We need “Invite link flow” so Oscar can invite friends.

Implement:
- `POST /api/invites/create` (auth: owner or global admin)
  - body: email
  - generates token, stores hashed token with expiry (7 days), status unused
  - returns invite URL: `https://more.peoplewelike.club/invite/:token`
- `GET /invite/:token`
  - if valid and unused: show “Create your card”
  - fields: username, pincode, display name optional
  - on submit:
    - creates card bound to invited email
    - marks invite used
    - redirects to new public card + shows login URL
- `invites` table:
  - id uuid
  - email
  - token_hash
  - expires_at
  - used_at nullable
  - created_by_card_id nullable
  - created_at

Optionally send email with invite link if SMTP configured; otherwise just show link to copy.

---

# D) Data model changes (migrations)

Add tables:
1) `invites` (above)
2) `leads`
- id uuid
- card_id (owner)
- name
- email nullable
- phone nullable
- social nullable (jsonb)
- message nullable
- created_at
3) `lead_actions` (optional) or encode as fields:
- type enum: follow_up_request | inbound_message
- payload jsonb
- created_at

Events:
- ensure `page_view` is recorded for social proof.

---

# E) Public card rendering changes

## E1) Block system extension
Current block union must be extended to include new types:
- intro
- mode_select
- memory_hook
- countdown_unlock
- live_radio
- keyword_unlock
- social_proof
- follow_up
- inbound_prompt
- save_contact (or integrate into contact/profile as button)
Keep schema clean: discriminated union with stable `id`, `type`, `data`.

## E2) vCard generation
- Add route `/more/:username/vcf`
- Build vCard from card config
- Headers:
  - `Content-Type: text/vcard; charset=utf-8`
  - `Content-Disposition: attachment; filename="{username}.vcf"`

---

# F) Security + performance requirements
- Rate limit:
  - keyword attempts
  - invite redemption
  - login/reset already rate limited (keep)
- Do not store raw IP. If needed for abuse, store hashed IP with salt.
- Cache radio now-playing proxy briefly.
- Keep first paint fast; avoid heavy client libs.

---

# G) Oscar v1 default template
After implementing features, update Oscar’s card config to a new default order:

1) intro (enabled)
2) social_proof (enabled)
3) mode_select (enabled)
4) profile (name/title/bio)
5) save_contact button + contact links
6) live_radio block
7) featured links blocks grouped by mode anchors:
   - Radio
   - OS/Tech
   - AV/Creative
8) memory_hook
9) instant reciprocity block (“Share your contact”)
10) follow_up block
11) inbound_prompt
12) keyword_unlock block
13) countdown_unlock backstage group (projects in progress)

Also create “Projects in progress” blocks inside backstage unlock group.

---

# H) Deliverables + reporting

## H1) Code deliverables
- migrations for new tables
- new API routes for invites, leads, vcard, radio proxy
- new UI blocks for the public card
- dashboard updates (Leads tab, Security tab, Experience tab)
- updated docs:
  - `/more/docs/PRODUCT.md` add Networking Experience v1
  - `/more/docs/ADMIN_PROVISIONING.md` include Invite flow (Option B)
  - `/more/docs/NFC.md` include “tap -> save contact -> invite”
  - root `STATUS.md` update
- update `scripts/verify.sh` to cover:
  - /vcf returns vCard
  - /invite token flow works
  - leads endpoint works
  - radio proxy returns 200 (or gracefully handles unavailable)

## H2) Deployment steps
- commit to main
- VPS: `git pull` in `/opt/pwl-more/more`
- `docker compose -f /opt/pwl-more/more/docker-compose.yml up -d --build`
- run verify script and record outputs

## H3) Final report must include links (copy-paste)
Provide:
- Public card (Oscar): `https://more.peoplewelike.club/more/oscarzillini`
- Oscar login: `https://more.peoplewelike.club/more/oscarzillini/login`
- Oscar dashboard: `https://more.peoplewelike.club/more/oscarzillini/admin`
- Save contact: `https://more.peoplewelike.club/more/oscarzillini/vcf`
- Invite flow instructions + example invite URL format
- Keyword unlock usage (where to configure keyword in dashboard)
- Where to see leads + follow-up requests
- Confirm radio untouched

---

## Implementation order (min risk)
1) DB migrations: invites + leads + page_view events
2) API routes: invites create/redeem, leads submit/list, vcard, radio proxy
3) Public blocks: save_contact + social_proof + memory_hook + reciprocity + follow_up + inbound_prompt
4) Dashboard tabs: Leads + Security (change pincode) + Experience toggles
5) Keyword unlock + countdown backstage
6) Live radio block wiring
7) Update Oscar config template + test full experience
8) Docs + verify + deploy

Start now. Follow /compact. Log everything. Commit often.
