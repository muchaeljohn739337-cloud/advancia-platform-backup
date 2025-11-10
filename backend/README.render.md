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

## Runbook: configure GitHub and Render for CI/CD (practical steps)

This runbook contains the exact steps you can run to finish the account-level configuration after the repository contains the automation files (`render.yaml`, workflows, and scripts).

1) Find your Render backend service ID
  - Open your service in Render and copy the service id from the URL. It looks like a UUID in the dashboard URL or from the API.

2) Add required GitHub repository secrets
  - Required repo secrets:
    - `RENDER_API_KEY` — A Render API key (from Render dashboard: Account -> API Keys -> Create Service or API key)
    - `RENDER_SERVICE_ID` — (optional) your service id; you can also store this in the workflow as a secret or replace the placeholder directly in `.github/workflows/render-auto-deploy.yml`
    - `GH_ADMIN_PAT` — Personal Access Token for applying branch protection via the `Apply Branch Protection` workflow (only if you will use that workflow). The PAT needs `repo` scope.

  - Quick CLI method (recommended): use the GitHub CLI (`gh`) from your workstation:

```bash
# set secrets (interactive)
gh secret set RENDER_API_KEY --body "$(cat ~/secrets/render_api_key.txt)"
gh secret set GH_ADMIN_PAT --body "$(cat ~/secrets/gh_admin_pat.txt)"
# Optional: store service id
gh secret set RENDER_SERVICE_ID --body "your-render-service-id"
```

  - If you don't have `gh`, use the GitHub UI: Settings -> Secrets -> Actions -> New repository secret.

3) Configure Render environment
  - In Render dashboard, open your backend service -> Environment -> Add the environment variables listed in this README (DATABASE_URL, JWT_SECRET, STRIPE_SECRET_KEY, RESEND_API_KEY, etc.). You can use the `render.env.template` in the repo as a copy/paste starter.

4) Run pre-deploy checks locally (optional but recommended)

```bash
cd backend
npm ci
npm run build:ci   # build type-check warnings shown but not failing
npm run test       # runs unit & integration tests
```

5) Trigger auto-deploy (via workflow) or manually run the deploy script
  - The repository contains `.github/workflows/render-auto-deploy.yml`. That workflow will POST to Render's deploy API using `RENDER_API_KEY` and the `RENDER_SERVICE_ID` placeholder.
  - Alternatively, you can trigger deploys locally using the helper script:

```bash
export RENDER_API_KEY="<your-key>"
export RENDER_SERVICE_ID="<your-service-id>"
./scripts/trigger-render-deploy.sh
```

6) Apply branch protection to require the pre-deploy checks
  - Option A (recommended): run the `Apply Branch Protection` workflow from GitHub Actions UI (Repository -> Actions -> Apply Branch Protection -> Run workflow). You can pass comma-separated check names.
  - Option B (CLI): Use `gh workflow run` to trigger `apply-branch-protection.yml` if you prefer.

7) Verify
  - Confirm `main` branch protection includes the status checks you want (Settings -> Branches -> main protection rule).
  - Make a test PR and confirm the pre-deploy checks run. Merge only after the checks pass.

Notes and safety
 - The `GH_ADMIN_PAT` token must be stored securely and only used by repo admins. The `Apply Branch Protection` workflow is manual and requires that secret to be present.
 - The `render-auto-deploy.yml` workflow will fail if `RENDER_API_KEY` or the `RENDER_SERVICE_ID` placeholder are not set. Replace the placeholder or set the secret and update the workflow if you want to avoid manual edits.

## Backup & migration schedule, monitoring, and integration tests

- `backup-and-migrate.yml` now supports:
  - Manual dispatch, plus a scheduled nightly backup at 03:00 UTC (cron: '0 3 * * *').
  - Automatic upload of a DB backup artifact named `db-backup`.
  - Triggers the Render migration job and polls until completion.
  - Posts a Slack notification (if `SLACK_WEBHOOK_URL` repo secret is configured) on success or failure.
  - Exposes the Render `run_id` as a job output for debugging.

- Repository secrets to add for this workflow (if you want to enable schedule and notifications):
  - `DATABASE_URL` (used to create the pg_dump backup from the GH Action runner) — only valid if the runner has network access to the DB
  - `RENDER_API_KEY`
  - `RENDER_SERVICE_ID`
  - `RENDER_MIGRATION_JOB_ID`
  - `SLACK_WEBHOOK_URL` (optional, for Slack notifications)

- If your Postgres instance is private to Render and not reachable from a public GitHub runner, prefer using a Render 'backup' job instead and update `backup-and-migrate.yml` to trigger that job (I can add a variant).

- `integration-tests.yml` added: this runs database-backed integration tests on PRs (and manual runs). The workflow uses a local Postgres service and runs `npm run test:integration` in `backend`.

If you'd like, I can:
- Add a scheduled daily cron to run backups with a longer retention policy and push to S3.
- Add a Render-based backup option for private DBs.
- Wire Slack notifications to mention a channel or ping users on failures.

## Deploy approval / environment notes

- The `.github/workflows/render-auto-deploy.yml` workflow in this repo uses the GitHub Environment named `production`.
- Configure `production` (Settings -> Environments -> production) and require reviewers/approvals for deployments to production. This ensures a human approves a deploy after CI checks pass.
- Make sure the following repo secrets are set before triggering production deploys:
  - `RENDER_API_KEY` — Render API key
  - `RENDER_SERVICE_ID` — Render backend service id

Recommended flow:
1. Run CI (typecheck/build/test) on PRs and require these checks in branch protection.
2. After merge to `main`, the `render-auto-deploy.yml` workflow will be available to run and will pause for `production` environment approval (if configured).
3. After a reviewer approves, the workflow posts to Render's deploy API using the stored secrets.

This provides a safe, human-approved production deploy path while keeping CI as the automated gate.

## Backup & migration workflow

I added `.github/workflows/backup-and-migrate.yml` — a manual workflow to:

- Create a Postgres backup using `pg_dump` (uploads an artifact named `db-backup`).
- Trigger the Render migration job (requires `RENDER_MIGRATION_JOB_ID`), poll for completion.
- Run a quick health check after migrations.

Required repository secrets for this workflow:
- `DATABASE_URL` — (only used here to create a backup; if your DB is private to Render, ensure GitHub Actions can reach it or run backups from a runner with network access)
- `RENDER_API_KEY`
- `RENDER_SERVICE_ID`
- `RENDER_MIGRATION_JOB_ID` — the job id visible in Render for the `run-migrations` job (you can also use a job numeric id from the Render API)

Notes:
- The Render jobs API endpoint used may depend on your Render account; if the trigger step fails, check the exact jobs run endpoint in Render API docs and update `backup-and-migrate.yml` accordingly.
- Backup artifacts are stored in GitHub Actions and should be downloaded and archived/stored offsite as part of your runbook.


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

---

## Automated migrations with Render jobs

You can add a job to your `render.yaml` to run database migrations on each deploy (single-click):

```yaml
jobs:
  - name: run-migrations
    type: manual
    env: production
    plan: free
    region: oregon
    rootDir: backend
    startCommand: >
      npm ci && npx prisma generate && npx prisma migrate deploy
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: NODE_ENV
        value: production
```

- Trigger this job from the Render dashboard after each deploy, or set it to run automatically if desired.
- This ensures your database schema is always up to date.

---

## GitHub Actions: Auto-deploy to Render

You can enable automatic deployment to Render after CI passes by adding a workflow like `.github/workflows/render-auto-deploy.yml`:

```yaml
name: Render Auto-Deploy
on:
  push:
    branches:
      - main
  workflow_dispatch:
jobs:
  deploy:
    runs-on: ubuntu-latest
    if: ${{ success() }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      - name: Trigger Render Deploy
        env:
          RENDER_API_KEY: ${{ secrets.RENDER_API_KEY }}
        run: |
          curl -X POST \
            -H "Accept: application/json" \
            -H "Authorization: Bearer $RENDER_API_KEY" \
            -d '' \
            https://api.render.com/v1/services/{RENDER_SERVICE_ID}/deploys
```
- Set the `RENDER_API_KEY` secret in your GitHub repo (Settings > Secrets > Actions).
- Replace `{RENDER_SERVICE_ID}` with your actual Render backend service ID (find it in the Render dashboard URL for your service).

---

## Enforcing pre-deploy checks before merging PRs

1. Add a branch protection rule in GitHub:
   - Go to Settings > Branches > Add rule for `main`.
   - Require status checks to pass before merging.
   - Select your pre-deploy workflow (e.g., `Render Pre-Deploy`).
2. Optionally, use PR labels (e.g., `ready-to-merge`) and only allow merges when the label is present and checks pass.
3. See `.github/workflows/pr-status-check.yml` for a sample status check workflow.

---
