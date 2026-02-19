# Operations — pwl-more

## Infrastructure
| | Value |
|--|--|
| VPS | 72.60.181.89 |
| Domain | more.peoplewelike.club |
| Repo | /opt/pwl-more |
| Docker project | pwl-more |
| App container | pwl-more-app |
| DB container | pwl-more-db |
| Host port | 127.0.0.1:3100 |
| Uploads | /var/lib/pwl-more/uploads |
| DB data | /var/lib/pwl-more/db |
| Nginx vhost | /etc/nginx/sites-enabled/more.peoplewelike.club.conf |

## DO NOT TOUCH
- /opt/radijas-v2 (radio)
- Port 1935 (radio RTMP)
- Port 8080 (radio HTTP)
- /etc/nginx/sites-enabled/radio.peoplewelike.club.conf

## Tech decisions
- ORM: Drizzle (SQL-like, fast migrations)
- Hashing: bcrypt 12 rounds
- Sessions: iron-session (signed httpOnly cookies)
- Images: sharp (resize 256/512/1024, EXIF strip)
- QR: qrcode (SVG on-demand)
- Email: nodemailer SMTP

## Env vars (/opt/pwl-more/more/.env)
- DB_PASSWORD
- SESSION_SECRET (32+ chars)
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM

## Logs
```bash
docker logs pwl-more-app -f
docker logs pwl-more-db
```
