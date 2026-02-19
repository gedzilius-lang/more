# Operations Guide — PWL More

## Architecture
- **App:** Next.js 14 App Router (standalone output)
- **DB:** Postgres 16 (Docker volume: `/var/lib/pwl-more/db`)
- **Uploads:** `/var/lib/pwl-more/uploads`
- **Port:** `127.0.0.1:3100` → nginx → `https://more.peoplewelike.club`
- **Containers:** `pwl-more-app`, `pwl-more-db` (project: `pwl-more`)

## Environment Variables
All vars in `/opt/pwl-more/more/.env`:

| Var | Required | Description |
|-----|----------|-------------|
| `DB_PASSWORD` | Yes | Postgres password |
| `SESSION_SECRET` | Yes | iron-session signing key (min 32 chars) |
| `ADMIN_EMAIL` | Yes | Admin login email |
| `ADMIN_PASSWORD` | Yes | Admin login password (plaintext, stored only in .env) |
| `SMTP_HOST` | For email | SMTP server hostname |
| `SMTP_PORT` | For email | SMTP port (587 or 465) |
| `SMTP_USER` | For email | SMTP username |
| `SMTP_PASS` | For email | SMTP password |
| `SMTP_FROM` | For email | From address |
| `NEXT_PUBLIC_BASE_URL` | Yes | Public URL (https://more.peoplewelike.club) |

> **Note:** `ADMIN_PASSWORD` uses constant-time comparison (not bcrypt) because bcrypt hash output
> contains `$` characters that docker compose interpolates as env var references.

## Admin Auth Method
- Route: `POST /api/admin/login` with `{ email, password }`
- Verifies email + password against `ADMIN_EMAIL` + `ADMIN_PASSWORD` env vars
- Uses `crypto.timingSafeEqual` to prevent timing attacks
- Sets `pwl-admin-session` iron-session cookie (8h TTL, httpOnly, secure)
- Separate from per-card `pwl-more-session` (7d TTL)

## Redeploy
```bash
cd /opt/pwl-more
git pull
cd more
docker compose up -d --build
```

## DB Migration (manual)
Migrations are applied manually via psql:
```bash
docker exec -i pwl-more-db psql -U pwl_more -d pwl_more << 'SQL'
-- Example: add new table
CREATE TABLE IF NOT EXISTS ...;
SQL
```

## Current Tables
| Table | Purpose |
|-------|---------|
| `cards` | User digital business cards |
| `events` | Analytics (page views, link clicks) |
| `links` | Legacy link rows (superseded by configJson) |
| `reset_tokens` | Email-based pincode reset tokens |
| `invites` | Admin-generated invite links |

## Backup
```bash
docker exec pwl-more-db pg_dump -U pwl_more pwl_more > /tmp/pwl_more_$(date +%Y%m%d).sql
```

## Logs
```bash
docker logs pwl-more-app --tail 100 -f
```

## Health Check
```bash
curl https://more.peoplewelike.club/health
# → {"ok":true}
```
