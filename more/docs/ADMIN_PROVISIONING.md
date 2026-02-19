# Admin Provisioning

No public signup. Cards created by admin via CLI.

## Create card
```bash
cd /opt/pwl-more/more
DATABASE_URL="postgresql://pwl_more:PASSWORD@127.0.0.1:5432/pwl_more" \
  npx tsx scripts/create_card.ts \
  --username oscarzillini \
  --email oscar@example.com \
  --pincode 1234 \
  --display-name "Oscar Zillini" \
  --send-email
```

## What it does
1. Creates cards row with hashed pincode
2. Sets default config: profile + links + contact blocks
3. Optionally emails the user their public URL + login URL

## After
- Public: https://more.peoplewelike.club/more/:username
- Login: https://more.peoplewelike.club/more/:username/login
