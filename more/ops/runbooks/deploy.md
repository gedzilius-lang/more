# Deploy Runbook — pwl-more

VPS: 72.60.181.89 | Service: /opt/pwl-more | DO NOT touch /opt/radijas-v2

## First Deploy

```bash
# 1. Clone
git clone git@github.com:gedzilius-lang/more.git /opt/pwl-more

# 2. Host dirs
mkdir -p /var/lib/pwl-more/uploads /var/lib/pwl-more/db

# 3. Env
cp /opt/pwl-more/more/.env.example /opt/pwl-more/more/.env
nano /opt/pwl-more/more/.env   # fill DB_PASSWORD, SESSION_SECRET, SMTP_*

# 4. Build + start
cd /opt/pwl-more/more
docker compose up -d --build

# 5. DB migrations
docker exec -i pwl-more-db psql -U pwl_more -d pwl_more \
  < /opt/pwl-more/more/app/drizzle/0001_init.sql

# 6. Nginx
cat > /etc/nginx/proxy_params_more << 'EOF'
proxy_http_version 1.1;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_cache_bypass $http_upgrade;
EOF

cp /opt/pwl-more/more/ops/nginx/more.peoplewelike.club.conf /etc/nginx/sites-available/
ln -sf /etc/nginx/sites-available/more.peoplewelike.club.conf /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# 7. Check SSL cert path — update nginx conf if different from /etc/ssl/certs/cf-origin.pem
ls /etc/ssl/certs/ | grep -i cf
# If using Let's Encrypt instead, edit the ssl_certificate lines in the nginx conf

# 8. Create first card
cd /opt/pwl-more/more
DATABASE_URL="postgresql://pwl_more:$(grep DB_PASSWORD .env | cut -d= -f2)@127.0.0.1:5432/pwl_more" \
  npx tsx scripts/create_card.ts \
  --username oscarzillini \
  --email oscar@example.com \
  --pincode 1234 \
  --display-name "Oscar Zillini"

# 9. Verify
bash /opt/pwl-more/more/scripts/verify.sh oscarzillini
```

## Update / Redeploy

```bash
cd /opt/pwl-more && git pull
cd more && docker compose up -d --build
```

## Logs

```bash
docker logs pwl-more-app --tail=100 -f
docker logs pwl-more-db --tail=50
```

## Restart

```bash
cd /opt/pwl-more/more && docker compose restart
```

## Port check (verify no radio conflict)
```bash
ss -tlnp | grep -E '1935|8080|3100'
docker ps --format 'table {{.Names}}\t{{.Ports}}'
```
