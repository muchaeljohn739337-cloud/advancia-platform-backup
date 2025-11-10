# Deploying backend on Render

This document lists the environment variables and deployment guidance when hosting the backend service on Render.

## Required environment variables
Add these keys to Render -> Service -> Environment:

- NODE_ENV=production
- PORT=5000 (optional — Render provides a port, but setting helps local parity)
- HOST=0.0.0.0

Authentication & secrets:
- DATABASE_URL — Postgres connection string
- JWT_SECRET — JWT secret for signing tokens (strong, >32 chars)
- REFRESH_TOKEN_SECRET — refresh-token secret if you use a different value
- NEXTAUTH_SECRET — if using NextAuth

Email & notifications:
- RESEND_API_KEY — required for Resend email provider (or configure Gmail SMTP)
- SMTP_HOST — smtp.gmail.com for Gmail
- SMTP_PORT — 587
- GMAIL_EMAIL — Gmail address used for sending
- GMAIL_APP_PASSWORD — Gmail app password for SMTP
- RESEND_WEBHOOK_SECRET — optional, if you use Resend webhooks

Payments:
- STRIPE_SECRET_KEY — Required to enable payments
- STRIPE_WEBHOOK_SECRET — Required for webhook verification

Web push + push notifications:
- VAPID_PUBLIC_KEY
- VAPID_PRIVATE_KEY
- VAPID_SUBJECT (e.g. mailto:support@advanciapayledger.com)

Other:
- ADMIN_KEY — optional admin secret
- SENTRY_DSN — optional for Sentry monitoring
- RESEND_API_KEY — required if sending emails with Resend

## Render build & start commands
- Build command: `npm install && npm run build`
- Start command: `npm run start:render`
  - This script runs `prisma generate && prisma migrate deploy && node dist/src/index.js`
  - If you do not want migrations applied automatically, replace with: `node dist/src/index.js` and run migrations manually via Render jobs.

## Health checks
Add a health check for your service on Render:
- Path: `/health` (or `/` if you prefer a root check)
- Healthy if HTTP status is 200

## Common deploy issues & troubleshooting
- Missing `RESEND_API_KEY` or `STRIPE_SECRET_KEY` will disable email and payment endpoints respectively. Add them in Render environment to enable.
- Add `ALLOWED_ORIGINS` to match your domain(s) (Vercel, admin domain)
- Ensure `DATABASE_URL` points to a production Postgres instance; Render will have managed DB credentials.
- For debugging, attach logs on Render to inspect runtime errors.

## Security notes
- Use strong random values for `JWT_SECRET` and `REFRESH_TOKEN_SECRET` and store them securely in Render environment.
- Rotate secrets periodically.

## Example
```
DATABASE_URL=postgres://user:pass@host:5432/db_adva
JWT_SECRET=<really_long_secret>
RESEND_API_KEY=re_abcdefg...
STRIPE_SECRET_KEY=sk_live_abcdefg...
```

If you want, I can add a one-click Render template next—ask me to scaffold `render.yaml` if you want a full infrastructure-as-code method.

## GitHub Actions / CI (recommended)

This project includes a GitHub Actions workflow that runs pre-deploy checks on pushes to `main` and PRs. Steps include:

- Setup Postgres service and apply migrations to a `TEST_DATABASE_URL` for fast integration checks
- Run TypeScript typecheck, backend build & tests
- Build frontend

Before CI can test integration paths, add these GitHub Secrets (Repository -> Settings -> Secrets -> Actions):

- TEST_DATABASE_URL (optional; workflow auto-sets a DB service but you can override)
- JWT_SECRET
- REFRESH_TOKEN_SECRET
- RESEND_API_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- GMAIL_EMAIL
- GMAIL_APP_PASSWORD
- VAPID_PUBLIC_KEY
- VAPID_PRIVATE_KEY

If those secrets are not set the CI job will still run lint/typecheck/build. Integration tests will require a working `TEST_DATABASE_URL` or the workflow's Postgres service.
