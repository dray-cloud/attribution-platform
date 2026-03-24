# Builder Funnel — Attribution Platform

A production marketing attribution dashboard for home services agencies. Multi-client HubSpot integration, lead/deal analytics, ROI tracking, PDF reports, and email alerts.

## Stack

- **Next.js 14** (App Router, TypeScript, inline styles)
- **Neon Postgres** + Drizzle ORM
- **NextAuth v4** with HubSpot OAuth (invite-only)
- **Resend** for email alerts
- **@react-pdf/renderer** for PDF export
- **Vercel** hosting + cron jobs

---

## Environment Variables

Set these in Vercel (or `.env.local` for local dev):

```env
# Database
DATABASE_URL=postgres://...   # Neon pooled connection string

# NextAuth
NEXTAUTH_SECRET=              # Generate: openssl rand -hex 32
NEXTAUTH_URL=                 # e.g. https://your-app.vercel.app

# HubSpot — User Auth App (scopes: openid email profile)
HUBSPOT_CLIENT_ID=
HUBSPOT_CLIENT_SECRET=

# HubSpot — Client Portal App (scopes: contacts deals content crm.objects.contacts.read crm.objects.deals.read)
HUBSPOT_CLIENT_PORTAL_ID=
HUBSPOT_CLIENT_PORTAL_SECRET=
NEXT_PUBLIC_HUBSPOT_CLIENT_PORTAL_ID=  # Same as above (used client-side for auth URL)

# Email (Resend)
EMAIL_API_KEY=                # Resend API key
EMAIL_FROM=                   # e.g. alerts@yourdomain.com

# Security
TOKEN_ENCRYPTION_KEY=         # 32-byte hex: openssl rand -hex 32
OAUTH_STATE_SECRET=           # Any secret for HMAC state signing
CRON_SECRET=                  # Protects /api/cron/* routes
```

---

## Two HubSpot OAuth Apps Required

### 1. User Auth App (for agency staff login)
- **App Type:** HubSpot Public App
- **Scopes:** `openid`, `email`, `profile`
- **Redirect URI:** `{NEXTAUTH_URL}/api/auth/callback/hubspot`
- Credentials → `HUBSPOT_CLIENT_ID` + `HUBSPOT_CLIENT_SECRET`

### 2. Client Portal App (for connecting each client's HubSpot portal)
- **App Type:** HubSpot Public App
- **Scopes:** `contacts`, `deals`, `content`, `crm.objects.contacts.read`, `crm.objects.deals.read`
- **Redirect URI:** `{NEXTAUTH_URL}/api/hubspot/callback`
- Credentials → `HUBSPOT_CLIENT_PORTAL_ID` + `HUBSPOT_CLIENT_PORTAL_SECRET`

---

## Neon Database Setup

1. Create a project at [neon.tech](https://neon.tech) (free tier works)
2. Copy the **pooled** connection string → `DATABASE_URL`
3. After deployment, run the migration from the Vercel console (or locally if Node is available):
   ```bash
   npx drizzle-kit push:pg
   ```

---

## Vercel Deployment

1. Push this repo to GitHub (`dray-cloud/attribution-platform` or similar)
2. Import the GitHub repo in Vercel
3. Set all environment variables in Vercel project settings
4. Deploy — Vercel will run `next build` automatically
5. Run the DB migration (see above)

**Cron jobs** configured in `vercel.json`:
- Every 15 min: `/api/cron/sync-hubspot` — pre-warms HubSpot cache
- Every 4 hours: `/api/cron/check-alerts` — evaluates alert rules

Cron requests include `Authorization: Bearer {CRON_SECRET}` header.

---

## First Admin User

After initial deployment, manually insert the first admin user into the database:

```sql
-- 1. Add to allowed_users so OAuth login succeeds
INSERT INTO allowed_users (id, email, notes, created_at)
VALUES (gen_random_uuid(), 'your@email.com', 'First admin', NOW());

-- 2. After logging in once via /auth/login, promote to admin
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

Then log out and back in — you'll have admin access to `/admin`.

---

## Adding Clients

1. Go to `/admin/clients/new` — create the client record (name, initials, color)
2. Go to `/admin/clients/[id]` — click "Connect HubSpot Portal"
3. Authorize access on the HubSpot OAuth consent screen (log in with **the client's** HubSpot account)
4. Redirect back → tokens stored encrypted in DB
5. Navigate to the dashboard to see live data

---

## Updates

Push changes to GitHub → Vercel auto-deploys. No local Node.js required for deploys.

If you add/change database tables, run `drizzle-kit push:pg` again after deployment.

---

## Architecture Notes

- Each client = one HubSpot portal with its own OAuth tokens (encrypted AES-256-GCM)
- Token refresh handled automatically before each API call
- HubSpot API responses cached in `hubspot_cache` table (15 min for contacts/deals, 1 hr for pages/CTAs)
- Attribution models (linear/first/last/decay) are computed server-side using `lib/attribution/models.ts`
- Full multi-touch linear/decay requires HubSpot Enterprise Timeline API; current implementation uses first/last URL as a proxy (documented in UI tooltips)
