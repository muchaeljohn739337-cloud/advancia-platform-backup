# Vercel Environment Variables Checklist

Do NOT commit real secrets (some sample values below were previously exposed). Rotate anything that was public and replace with new credentials.

## Frontend (Public) Variables

Set these in Vercel (Production & Preview). Prefix `NEXT_PUBLIC_` makes them readable client-side.

| Key                                     | Description            | Production Example                           | Sensitive |
| --------------------------------------- | ---------------------- | -------------------------------------------- | --------- |
| NEXT_PUBLIC_API_URL                     | Base API endpoint      | `https://api.advanciapayledger.com/api`      | no        |
| NEXT_PUBLIC_SOCKET_URL                  | Socket.IO base         | `https://api.advanciapayledger.com`          | no        |
| NEXT_PUBLIC_APP_NAME                    | Display name           | Advancia Pay                                 | no        |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY      | Stripe public key      | pk\*live**\*\*\***\*\*\*\***\*\***           | no        |
| NEXT_PUBLIC_FEATURE_FLAGS               | Comma features         | notifications,rewards,debit_card             | no        |
| NEXT_PUBLIC_ORG_NAME                    | Org for SEO            | Advancia                                     | no        |
| NEXT_PUBLIC_ORG_URL                     | Canonical URL          | `https://www.advanciapayledger.com`          | no        |
| NEXT_PUBLIC_LOGO_URL                    | Logo absolute URL      | `https://www.advanciapayledger.com/logo.png` | no        |
| NEXT_PUBLIC_TRUSTPILOT_BUSINESS_UNIT_ID | Trustpilot widget      | (optional)                                   | no        |
| NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION    | GSC code               | (optional)                                   | no        |
| NEXT_PUBLIC_GA_MEASUREMENT_ID           | GA4 ID                 | G-XXXXXXXXXX                                 | no        |
| NEXT_PUBLIC_TURNSTILE_SITE_KEY          | CAPTCHA site key       | (optional)                                   | no        |
| NEXT_TELEMETRY_DISABLED                 | Disable Next telemetry | 1                                            | no        |

Remove any of: `NEXT_PUBLIC_ADMIN_KEY`, raw VAPID private keys, or seeds—these must NOT be public.

## Frontend (Private) Variables

Use Vercel environment (non-prefixed). Never expose these to client:

| Key             | Description                 | Sensitive |
| --------------- | --------------------------- | --------- |
| NEXTAUTH_SECRET | NextAuth JWT/signing secret | yes       |
| NEXTAUTH_URL    | Base auth URL               | yes       |

## Backend Variables (Render / Server Hosting)

Mirror backend `.env.example` securely. Highlights:

| Key                                       | Purpose                 | Sensitive       |
| ----------------------------------------- | ----------------------- | --------------- |
| DATABASE_URL                              | Postgres connection     | yes             |
| JWT_SECRET / JWT_REFRESH_SECRET           | Auth tokens             | yes             |
| STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET | Payments                | yes             |
| EMAIL_USER / EMAIL_PASSWORD               | SMTP auth               | yes             |
| RESEND_API_KEY / SENDGRID_API_KEY         | Email providers         | yes             |
| WALLET_MASTER_SEED                        | Custodial wallet seed   | CRITICAL        |
| WALLET_ENCRYPTION_KEY                     | Encrypt wallet data     | yes             |
| VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY      | Web Push                | private key yes |
| ADMIN\_\*\_WALLET_ADDRESS                 | Withdrawal destinations | yes             |
| SENTRY_DSN                                | Error tracking          | no              |
| RATE_LIMIT_MAX_REQUESTS / WINDOW_MS       | Security throttling     | no              |
| ALLOWED_ORIGINS                           | CORS whitelist          | no              |

## Immediate Security Actions

The previously listed sample secrets (Stripe test key, Gmail credentials, NextAuth secret, admin key) must be considered compromised.

1. Rotate Stripe keys: Dashboard → Developers → API keys.
2. Revoke Gmail app password & create a new one (Google Account → Security → App passwords).
3. Generate a new `NEXTAUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

4. Remove any hardcoded admin override keys from frontend; replace with server-side role checks.
5. Audit logs for suspicious usage since exposure.

## Deployment Steps

1. In Vercel project settings, add public vars first (avoid blanks causing build warnings).
2. Add private vars (Stripe publishable already public; secret key stays backend only).
3. Trigger a Preview build; confirm no missing env warnings.
4. Run automated env validation script (add CI step calling `backend/scripts/verify-env.ts`).
5. Promote Preview → Production once confirmed.

## Validation Checklist

-   [ ] Stripe key matches environment (test vs live).
-   [ ] NextAuth secret length >= 64 bytes.
-   [ ] No wallet seed or encryption key exposed in client bundle (`grep -R WALLET_MASTER_SEED .next`).
-   [ ] CORS accepts only required production origins.
-   [ ] WebSocket connects successfully with auth.
-   [ ] Sentry events received (no PII in payloads).

## Rotation Policy (Suggested)

| Secret                | Interval | Method                                         |
| --------------------- | -------- | ---------------------------------------------- |
| JWT secrets           | 90 days  | Dual-secret rollover (accept old for 7 days)   |
| Stripe keys           | 180 days | Create new, update backend, remove old         |
| Wallet encryption key | 180 days | Re-encrypt stored data (planned maintenance)   |
| SMTP passwords        | 90 days  | Generate new app password                      |
| VAPID keys            | 365 days | Re-generate, stagger push subscription refresh |

## Monitoring Alerts

| Condition                                  | Action                                  |
| ------------------------------------------ | --------------------------------------- |
| Missing critical env on build              | Fail build & notify Slack               |
| Public bundle contains secret pattern      | Abort deploy                            |
| Repeated CORS failures (>50 in 5m)         | Investigate origin misuse               |
| Stripe signature verification errors spike | Validate webhook secret / replay attack |

## Do Not Store Publicly

-   Gmail app password
-   NextAuth secret
-   Wallet seed & encryption key
-   Webhook secrets (Stripe, Cryptomus, NOWPayments)
-   Admin keys or override tokens

---

Last updated: Rotate all leaked sample secrets immediately.
