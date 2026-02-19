# services.md — Inventory

## PWL-MORE
| Container | Image | Host Port | Network |
|-----------|-------|-----------|---------|
| pwl-more-app | built locally | 127.0.0.1:3100 | pwl-more-net |
| pwl-more-db | postgres:16-alpine | none | pwl-more-net |

## Volumes
| Host | Container | Purpose |
|------|-----------|---------|
| /var/lib/pwl-more/uploads | /data/uploads | Image uploads |
| /var/lib/pwl-more/db | /var/lib/postgresql/data | DB data |

## Port Summary (VPS 72.60.181.89)
| Port | Service |
|------|---------|
| 80/443 | nginx |
| 1935 | radio-rtmp (DO NOT USE) |
| 8080 | radio-web (DO NOT USE) |
| 3100 | pwl-more-app (localhost only) |

## Radio (DO NOT TOUCH)
Service root: /opt/radijas-v2
Containers: radio-web, radio-rtmp, radio-rtmp-auth, radio-autodj, radio-switch
