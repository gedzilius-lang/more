# Backup & Restore — pwl-more

## Backup DB
```bash
docker exec pwl-more-db pg_dump -U pwl_more pwl_more \
  | gzip > /opt/backups/pwl-more-db-$(date +%Y%m%d-%H%M).sql.gz
```

## Backup Uploads
```bash
tar -czf /opt/backups/pwl-more-uploads-$(date +%Y%m%d).tar.gz /var/lib/pwl-more/uploads/
```

## Cron (root crontab)
```
0 3 * * * docker exec pwl-more-db pg_dump -U pwl_more pwl_more | gzip > /opt/backups/pwl-more-db-$(date +\%Y\%m\%d).sql.gz
0 3 * * 1 tar -czf /opt/backups/pwl-more-uploads-$(date +\%Y\%m\%d).tar.gz /var/lib/pwl-more/uploads/
```

## Restore DB
```bash
gunzip < /opt/backups/pwl-more-db-YYYYMMDD-HHMM.sql.gz \
  | docker exec -i pwl-more-db psql -U pwl_more -d pwl_more
```

## Restore Uploads
```bash
tar -xzf /opt/backups/pwl-more-uploads-YYYYMMDD.tar.gz -C /
```
