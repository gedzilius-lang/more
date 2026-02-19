# PWL-MORE Status

**Service:** PeopleWeLike /more — NFC Digital Business Cards
**Domain:** https://more.peoplewelike.club
**VPS:** 72.60.181.89
**Status:** 🟢 Deployed

## Routes
| Endpoint | Purpose |
|----------|---------|
| `/` | 302 → radio.peoplewelike.club |
| `/more/:username` | Public NFC business card |
| `/more/:username/qr` | SVG QR code |
| `/more/:username/l/:linkKey` | Tracked redirect (analytics) |
| `/more/:username/login` | Login (email + pincode) |
| `/more/:username/admin` | Block editor + analytics |
| `/health` | `{"ok":true}` |

## Containers
| Name | Role | Port |
|------|------|------|
| pwl-more-app | Next.js 14 | 127.0.0.1:3100 |
| pwl-more-db | Postgres 16 | internal |

## Paths
| Path | Purpose |
|------|---------|
| /opt/pwl-more | Repo checkout |
| /var/lib/pwl-more/uploads | Image uploads |
| /var/lib/pwl-more/db | Postgres data |

## ⛔ Isolation
- Radio at /opt/radijas-v2 — DO NOT TOUCH
- Ports 1935, 8080 — DO NOT USE (radio)
- Radio nginx vhost — NOT modified

## Redeploy
```bash
cd /opt/pwl-more && git pull && cd more && docker compose up -d --build
```
