# Advancia Pay – Production Deployment Checklist

Use this single checklist to go live without duplication. Frontend on Vercel, backend on Render, DNS via Cloudflare.

<!-- Replace OWNER/REPO with your GitHub repo path -->

[![Backup: R2](https://github.com/OWNER/REPO/actions/workflows/backup-and-migrate.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/backup-and-migrate.yml)

## Secrets & Keys

-   Generate secrets: `cd backend && npx ts-node scripts/generate-secrets.ts`

-   Replace placeholders in `backend/.env.production.template` and `frontend/.env.production.template`:
    -   Backend: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SESSION_SECRET`, `OTP_SECRET`, `WALLET_ENCRYPTION_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`
    -   Frontend: `NEXTAUTH_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

-   Provide real values:
    -   Stripe: `STRIPE_SECRET_KEY` (sk_live), `STRIPE_WEBHOOK_SECRET` (from webhook), `STRIPE_PUBLISHABLE_KEY` (pk_live)
    -   Sentry: `SENTRY_DSN`
    -   Email (Gmail App Password): `EMAIL_USER`, `EMAIL_PASSWORD`, `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`
    -   Database: `DATABASE_URL` (Render Postgres external URL with `sslmode=require`)
    -   Optional: `NOWPAYMENTS_API_KEY`, `REDIS_URL`, `RABBITMQ_URL`
    -   Backups: Cloudflare R2 via GitHub Actions (no backend envs needed)
    -   Admin wallets: `ADMIN_BTC_WALLET_ADDRESS`, `ADMIN_ETH_WALLET_ADDRESS`, `ADMIN_USDT_WALLET_ADDRESS`

## Render (Backend)

-   Create a Render Web Service (Node.js) from the backend directory.
-   Build command: `npm ci && npm run build`
-   Start command: `npm run start`
-   Env vars: paste from `backend/.env.production.template` (real values only).
-   Health check: `/api/health`
-   Post-deploy: Run DB migrations once: `npx prisma migrate deploy` (or use `backend/scripts/migrate-deploy.sh`)
-   Confirm Socket.IO and CORS: `FRONTEND_URL` points to your production domain.

## Vercel (Frontend)

-   Import the repo, select `frontend/` as project root if needed.

-   Env vars:
    -   `NEXT_PUBLIC_API_URL=https://api.your-domain.com`
    -   `NEXT_PUBLIC_WS_URL=wss://api.your-domain.com`
    -   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...`
    -   `NEXTAUTH_URL=https://your-domain.com`
    -   `NEXTAUTH_SECRET=<from generator>`

## Cloudflare (DNS)

-   Frontend: point apex/root and `www` CNAME to Vercel (as per Vercel DNS instructions).
-   Backend API: create `api.your-domain.com` CNAME to your Render custom domain.
-   SSL/TLS: Full (strict), enable HSTS; basic WAF; cache static; rate-limit sensitive routes if needed.

## Stripe Webhook

-   Endpoint: `https://api.your-domain.com/api/payments/webhook`
-   Events: include payment intent/success/failure as needed by your flows.
-   After creation, copy `STRIPE_WEBHOOK_SECRET` (whsec\_...) into Render env vars.
-   Verify backend has raw body before `express.json()` (already implemented).

## Sentry

-   Create a project, copy DSN into `SENTRY_DSN` for backend (and frontend if used).
-   Deploy and confirm events appear on test errors.

## Backups (Cloudflare R2)

-   Create an R2 bucket (e.g., `advancia-backups`) in Cloudflare.
-   Generate R2 Access Key and Secret; note your Account ID.
-   Set GitHub Secrets for the workflow:
    -   `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, and either `R2_ACCOUNT_ID` or `R2_ENDPOINT`.
-   The workflow `.github/workflows/backup-and-migrate.yml` will upload nightly via the R2 S3-compatible endpoint.

## Final Verification

-   API: `GET https://api.your-domain.com/api/health` returns 200.
-   DB: `npx prisma migrate status` on Render shows up-to-date.
-   Security: `npm audit --production` shows 0 high/critical locally; confirm deployed image uses updated deps.
-   Stripe: Trigger a test live event; confirm webhook logs and DB writes.
-   Realtime: Confirm Socket.IO connects from frontend to backend (`NEXT_PUBLIC_WS_URL`).

## Ongoing

-   Monitor Sentry, logs, and DB metrics.
-   Rotate secrets periodically; never commit real values.

## Optional: Render Blueprint & Frontend Rewrites

-   Render blueprint: `render.yaml` in repo root defines the backend service (Node runtime, build/start, health check). Import in Render as a Blueprint to provision consistently without duplicating manual steps.
-   Frontend rewrites: `frontend/next.config.mjs` proxies `/api/*` to `NEXT_PUBLIC_API_URL` at build time, simplifying Vercel setup. Ensure `NEXT_PUBLIC_API_URL` is set in Vercel env vars before deploying.
