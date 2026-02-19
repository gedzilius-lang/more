# PWL More — Status

**Domain:** https://more.peoplewelike.club
**VPS:** 72.60.181.89
**Deploy path:** `/opt/pwl-more/more`
**Repo:** https://github.com/gedzilius-lang/more

## Live URLs

| URL | Purpose |
|-----|---------|
| https://more.peoplewelike.club/ | Redirects to radio |
| https://more.peoplewelike.club/health | Health check → `{"ok":true}` |
| https://more.peoplewelike.club/admin/login | Admin login |
| https://more.peoplewelike.club/admin | Admin dashboard (requires login) |
| https://more.peoplewelike.club/invite/`<token>` | Invite redemption |
| https://more.peoplewelike.club/more/oscarzillini | Oscar's public card |
| https://more.peoplewelike.club/more/oscarzillini/login | Oscar's login |
| https://more.peoplewelike.club/more/oscarzillini/admin | Oscar's admin |

## Containers

| Container | Port | Status |
|-----------|------|--------|
| `pwl-more-app` | 127.0.0.1:3100 | ✅ healthy |
| `pwl-more-db` | internal | ✅ healthy |

## Data Directories
- DB: `/var/lib/pwl-more/db` (Docker volume)
- Uploads: `/var/lib/pwl-more/uploads`

## Deploy
```bash
cd /opt/pwl-more
git pull
cd more
docker compose up -d --build
```

## Admin Access
- Email: `ged.zilius@gmail.com`
- Password: in `.env` as `ADMIN_PASSWORD`
- Session: 8 hours
