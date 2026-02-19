# Admin Provisioning — Option B (Invite Link Flow)

## How to Invite a Friend

### Step 1: Log in as Admin
1. Go to `https://more.peoplewelike.club/admin/login`
2. Email: `ged.zilius@gmail.com`
3. Password: (see ADMIN_PASSWORD in `/opt/pwl-more/more/.env` on VPS)

### Step 2: Create an Invite
1. Click the **Invites** tab in the admin dashboard
2. Enter the friend's email address
3. Check "Email the invite link to them" if SMTP is configured
4. Click **Generate Invite**
5. The invite link appears — copy and share it manually if email is not configured

The invite link looks like:
```
https://more.peoplewelike.club/invite/<64-char-token>
```

Links expire after **7 days** and can only be used once.

### Step 3: Friend Registers
The friend opens the invite link and:
1. Chooses a username (e.g. `johndoe`) — becomes the card URL
2. Optionally sets a display name
3. Sets a pincode (min 4 chars)
4. Clicks **Create My Card**
5. Automatically logged in and redirected to their admin dashboard

### Resulting URLs for the new user:
| URL | Purpose |
|-----|---------|
| `https://more.peoplewelike.club/more/<username>` | Public card |
| `https://more.peoplewelike.club/more/<username>/login` | Login |
| `https://more.peoplewelike.club/more/<username>/admin` | Card editor + analytics |

## Admin Actions per Card
From the admin Cards tab:
- **Live/Hidden** toggle — publishes or hides the card
- **Edit** — opens the card's admin dashboard (you can edit their config)
- **Reset** — sends a pincode reset email to the card's registered email

## Changing Admin Password
On the VPS:
```bash
nano /opt/pwl-more/more/.env
# Change ADMIN_PASSWORD=<new-password>
cd /opt/pwl-more/more
docker compose up -d --build
```
