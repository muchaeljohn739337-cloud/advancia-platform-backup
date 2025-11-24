# ✅ Backup Restore Test Record

This file documents verified PostgreSQL backup → restore tests for Advancia Pay Ledger.

## Purpose

Demonstrate that database backups are **restorable**, **complete**, and **consistent** before production launch and on an ongoing schedule (weekly or after schema changes).

## How To Run (Manual)

```powershell
# From project root (Windows PowerShell)
./scripts/test-backup-restore.ps1 -DatabaseName advancia_pay -PgContainer advancia-db
```

If your Postgres container name differs, adjust `-PgContainer` accordingly (check via `docker ps`).

## How To Run (CI Example)

Add a scheduled GitHub Action (weekly):

```yaml
name: backup-restore-verify
on:
  schedule:
    - cron: "0 3 * * 1" # Mondays 03:00 UTC
jobs:
  verify-restore:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        ports: [5432:5432]
        options: >-
          --health-cmd "pg_isready -U postgres" --health-interval 10s --health-timeout 5s --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - name: Restore & Verify
        run: |
          pwsh ./scripts/test-backup-restore.ps1 -DatabaseName advancia_pay -PgContainer postgres
```

(Replace with your actual persistent volume or add a step to download latest backup artifact.)

## Pass Criteria

-   All critical tables present (users, transactions, token_wallets, token_transactions, crypto_wallets, admin_wallets, audit_logs)
-   Row counts match source database for each table
-   Exit code 0 from script
-   JSON report stored under `backup-restore-results/restore-report-*.json`
-   Markdown history updated: `backup-restore-results/RESTORE_HISTORY.md`

## Fail Criteria

-   Missing table(s)
-   Row count mismatch
-   Script exit code 2
-   Corrupted SQL dump (empty or parse errors)

## Troubleshooting

| Issue                              | Cause                                          | Fix                                       |
| ---------------------------------- | ---------------------------------------------- | ----------------------------------------- |
| `pg_dump produced no output`       | Wrong container name                           | Run `docker ps` and update `-PgContainer` |
| Row mismatch                       | New table rows after dump before count compare | Re-run during low-activity window         |
| Table error                        | Table renamed or dropped                       | Confirm schema migration history          |
| Restore fails with encoding errors | Locale mismatch                                | Add `--encoding UTF8` to pg_dump call     |

## Recommended Schedule

-   Pre-launch: Run immediately before go-live (store report in repo)
-   Post-launch: Weekly (Monday 03:00 UTC) + after any major migration
-   After Incident: Run immediately following crash/recovery

## Latest Runs (Append Only)

(Generated automatically by `RESTORE_HISTORY.md` – do NOT edit manually.)

Include the generated history file in release artifacts: `backup-restore-results/RESTORE_HISTORY.md`.

## Manual Verification Checklist

-   [ ] Ran script successfully
-   [ ] Checked `allTablesMatch=true` in JSON
-   [ ] Opened `RESTORE_HISTORY.md` and confirmed PASS entry
-   [ ] Committed JSON + history files (optional for audit)
-   [ ] Stored off-site (S3/R2) copy of latest SQL dump

## Optional: Store Artifacts Off-Site

```powershell
# Upload latest backup & report to S3 (example)
aws s3 cp .\backup-restore-results\db-backup-YYYY-MM-DD_HH-mm-ss.sql s3://advancia-db-backups/
aws s3 cp .\backup-restore-results\restore-report-YYYY-MM-DD_HH-mm-ss.json s3://advancia-db-backups/
```

## Next Improvement Targets

-   Automate artifact retention (keep last 14 successful restores)
-   Add checksum validation: `sha256sum db-backup-*.sql`
-   Add differential size alert if backup size changes >25%
-   Integrate Slack notification on FAIL

---

**Maintainer:** Platform Engineering  
**Created:** $(Get-Date -Format 'yyyy-MM-dd')  
**Review Cycle:** Monthly
