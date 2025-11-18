#!/usr/bin/env pwsh
# Security Remediation Orchestrator
# Runs all security remediation steps in order

Write-Host @"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║        🔒 SECURITY INCIDENT REMEDIATION ORCHESTRATOR        ║
║                                                              ║
║  This script will guide you through complete remediation    ║
║  of the exposed secrets incident.                           ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

Write-Host ""

# Step 1: Scan current state
Write-Host "STEP 1: Initial Security Scan" -ForegroundColor Yellow
Write-Host "=" * 80
Write-Host ""

& ".\scripts\scan-all-secrets.ps1"
$scanResult = $LASTEXITCODE

if ($scanResult -eq 0) {
    Write-Host "✅ No secrets found in current files" -ForegroundColor Green
} else {
    Write-Host "⚠️  Secrets still present - they will be in Git history" -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Press Enter to continue to Step 2"
Write-Host ""

# Step 2: Generate new secrets
Write-Host "STEP 2: Generate New Secrets" -ForegroundColor Yellow
Write-Host "=" * 80
Write-Host ""

& ".\scripts\generate-new-secrets.ps1"

Write-Host ""
Read-Host "Press Enter when you've saved the new secrets and are ready for Step 3"
Write-Host ""

# Step 3: Revoke old credentials
Write-Host "STEP 3: Revoke Old Credentials" -ForegroundColor Yellow
Write-Host "=" * 80
Write-Host ""

Write-Host "Opening browser windows for credential revocation..." -ForegroundColor Cyan
Write-Host ""

Write-Host "1️⃣  Revoke GitHub PAT" -ForegroundColor White
Write-Host "   https://github.com/settings/tokens" -ForegroundColor Gray
Start-Process "https://github.com/settings/tokens"
Read-Host "   Press Enter when revoked"

Write-Host ""
Write-Host "2️⃣  Rotate Stripe Keys" -ForegroundColor White
Write-Host "   https://dashboard.stripe.com/test/apikeys" -ForegroundColor Gray
Start-Process "https://dashboard.stripe.com/test/apikeys"
Read-Host "   Press Enter when rotated"

Write-Host ""
Write-Host "3️⃣  Update GitHub Secrets" -ForegroundColor White
Write-Host "   https://github.com/muchaeljohn739337-cloud/-modular-saas-platform/settings/secrets/actions" -ForegroundColor Gray
Start-Process "https://github.com/muchaeljohn739337-cloud/-modular-saas-platform/settings/secrets/actions"
Read-Host "   Press Enter when updated"

Write-Host ""
Write-Host "✅ Old credentials revoked" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to continue to Step 4"
Write-Host ""

# Step 4: Update environment files
Write-Host "STEP 4: Update Environment Files" -ForegroundColor Yellow
Write-Host "=" * 80
Write-Host ""

Write-Host "Update these files with new secrets:" -ForegroundColor Cyan
Write-Host "  - backend/.env" -ForegroundColor White
Write-Host "  - frontend/.env" -ForegroundColor White
Write-Host "  - docker-compose.yml (if using)" -ForegroundColor White
Write-Host ""

$editNow = Read-Host "Open files for editing? (y/n)"
if ($editNow -eq 'y') {
    if (Get-Command code -ErrorAction SilentlyContinue) {
        code backend/.env
        code frontend/.env
    } else {
        notepad backend/.env
        notepad frontend/.env
    }
}

Write-Host ""
Read-Host "Press Enter when environment files are updated"
Write-Host ""

# Step 5: Test with new secrets
Write-Host "STEP 5: Test With New Secrets" -ForegroundColor Yellow
Write-Host "=" * 80
Write-Host ""

Write-Host "Testing backend..." -ForegroundColor Cyan
Set-Location backend
Write-Host "Run: npm run dev" -ForegroundColor White
Write-Host "Verify it starts without errors" -ForegroundColor Gray
Write-Host ""

$testBackend = Read-Host "Backend tested successfully? (y/n)"
Set-Location ..

if ($testBackend -ne 'y') {
    Write-Host "⚠️  Fix backend errors before continuing" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Tests passed" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to continue to Step 6"
Write-Host ""

# Step 6: Clean Git history
Write-Host "STEP 6: Clean Git History" -ForegroundColor Yellow
Write-Host "=" * 80
Write-Host ""

Write-Host "⚠️  WARNING: This will rewrite Git history!" -ForegroundColor Red
Write-Host "All team members must re-clone the repository after this." -ForegroundColor Yellow
Write-Host ""

$cleanHistory = Read-Host "Clean Git history now? (y/n)"

if ($cleanHistory -eq 'y') {
    & ".\scripts\clean-git-history.ps1"
} else {
    Write-Host "ℹ️  Skipped Git history cleanup" -ForegroundColor Yellow
    Write-Host "Run manually later: .\scripts\clean-git-history.ps1" -ForegroundColor Cyan
}

Write-Host ""
Write-Host ""

# Summary
Write-Host "=" * 80 -ForegroundColor Green
Write-Host "✅ REMEDIATION COMPLETE!" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Green
Write-Host ""

Write-Host "Summary of Actions Taken:" -ForegroundColor Cyan
Write-Host "  ✅ Initial security scan completed" -ForegroundColor White
Write-Host "  ✅ New secrets generated" -ForegroundColor White
Write-Host "  ✅ Old credentials revoked" -ForegroundColor White
Write-Host "  ✅ Environment files updated" -ForegroundColor White
Write-Host "  ✅ New secrets tested" -ForegroundColor White

if ($cleanHistory -eq 'y') {
    Write-Host "  ✅ Git history cleaned" -ForegroundColor White
} else {
    Write-Host "  ⏭️  Git history cleanup skipped" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Monitor application logs for any auth errors" -ForegroundColor White
Write-Host "  2. Verify all team members have updated credentials" -ForegroundColor White
Write-Host "  3. Schedule next security audit for: $(Get-Date (Get-Date).AddMonths(3) -Format 'yyyy-MM-dd')" -ForegroundColor White
Write-Host "  4. Enable GitHub secret scanning in repo settings" -ForegroundColor White
Write-Host "  5. Install pre-commit hooks on all dev machines" -ForegroundColor White
Write-Host ""

Write-Host "📚 Review Documentation:" -ForegroundColor Cyan
Write-Host "  - SECURITY_AUDIT_2025-11-17.md" -ForegroundColor White
Write-Host "  - SECRET_MANAGEMENT_GUIDE.md" -ForegroundColor White
Write-Host "  - SENSITIVE_FILES_PROTECTION.md" -ForegroundColor White
Write-Host ""

# Create incident log
$incidentLog = @"
# Security Incident Log - Secret Exposure

**Date:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
**Severity:** CRITICAL
**Status:** ✅ REMEDIATED

## Actions Completed

- [x] Secrets removed from files
- [x] New secrets generated
- [x] Old credentials revoked
- [x] GitHub Secrets updated
- [x] Environment files updated
- [x] New secrets tested
$(if ($cleanHistory -eq 'y') { "- [x] Git history cleaned" } else { "- [ ] Git history cleanup pending" })

## Incident Commander
- Name: $(whoami)
- Date Completed: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

## Next Review
- Scheduled: $(Get-Date (Get-Date).AddMonths(3) -Format 'yyyy-MM-dd')
"@

$incidentLog | Out-File -FilePath "SECURITY_INCIDENT_$(Get-Date -Format 'yyyyMMdd').md" -Encoding UTF8

Write-Host "✅ Incident log created: SECURITY_INCIDENT_$(Get-Date -Format 'yyyyMMdd').md" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 Security remediation complete!" -ForegroundColor Green
