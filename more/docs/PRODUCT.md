# PeopleWeLike /more — Product

NFC digital business cards at more.peoplewelike.club.

## Routes
| URL | Description |
|-----|-------------|
| `/` | 302 → radio.peoplewelike.club |
| `/more/:username` | Public card (NFC target) |
| `/more/:username/qr` | SVG QR code |
| `/more/:username/l/:linkKey` | Tracked redirect |
| `/more/:username/login` | Email + pincode login |
| `/more/:username/reset` | Pincode reset request |
| `/more/:username/reset/:token` | Set new pincode |
| `/more/:username/admin` | Block editor + analytics |
| `/health` | {"ok":true} |

## Block types
- profile — name, title, bio, avatar
- links — tracked outbound links
- text — freeform text
- image — uploaded image
- contact — email/phone/whatsapp
- qr — shows own QR code

## Analytics
All outbound links go through /l/:linkKey which records the click then redirects.
Dashboard shows: total clicks, page views, top links, 7-day daily trend.

## Auth
Email + pincode per card. bcrypt hashed. iron-session cookies.
No public signup — admin provisions cards via CLI.
