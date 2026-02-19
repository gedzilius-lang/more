# explained.md — PWL-MORE

## What this is
NFC digital business cards at more.peoplewelike.club.
Each card = a page at /more/:username (NFC/QR target).

## Boundaries
- Separate from radio (/opt/radijas-v2) — never touch it
- Does NOT use ports 1935 (RTMP) or 8080 (radio HTTP)
- Port: 127.0.0.1:3100 (localhost, nginx proxies)
- Docker Compose project: pwl-more
- Nginx vhost: more.peoplewelike.club.conf (separate file)
- Data: /var/lib/pwl-more/

## Stack
- Next.js 14 App Router
- Drizzle ORM + Postgres 16
- bcrypt pincode hashing
- iron-session cookies
- sharp image processing
- qrcode SVG QR
- nodemailer SMTP
