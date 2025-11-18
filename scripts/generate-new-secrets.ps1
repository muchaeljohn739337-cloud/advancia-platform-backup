#!/usr/bin/env pwsh
# Generate New Secrets for Security Remediation
# Run this to generate all required secrets after exposure incident

Write-Host "🔐 Generating New Secrets for Security Remediation" -ForegroundColor Cyan
Write-Host "=" * 80
Write-Host ""

# Generate secrets
Write-Host "Generating secrets..." -ForegroundColor Yellow

$secrets = @{}

# JWT Secret (64 bytes, base64)
$secrets['JWT_SECRET'] = node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"

# JWT Refresh Secret (64 bytes, base64)
$secrets['JWT_REFRESH_SECRET'] = node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"

# Session Secret (64 bytes, base64)
$secrets['SESSION_SECRET'] = node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"

# NextAuth Secret (32 bytes, hex)
$secrets['NEXTAUTH_SECRET'] = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# API Key (32 bytes, hex)
$secrets['API_KEY'] = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Encryption Key (32 bytes, hex)
$secrets['ENCRYPTION_KEY'] = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Display results
Write-Host ""
Write-Host "=" * 80 -ForegroundColor Green
Write-Host "✅ NEW SECRETS GENERATED" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Green
Write-Host ""

foreach ($key in $secrets.Keys) {
    Write-Host "$key`:" -ForegroundColor Cyan
    Write-Host $secrets[$key] -ForegroundColor White
    Write-Host ""
}

# Save to temporary file (for copy-paste)
$outputFile = "NEW_SECRETS_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"
$output = @"
# NEW SECRETS GENERATED - $(Get-Date)
# ⚠️  DELETE THIS FILE AFTER UPDATING YOUR .env FILES!

$(foreach ($key in $secrets.Keys) { "$key=$($secrets[$key])`n" })

# INSTRUCTIONS:
# 1. Copy these secrets to backend/.env
# 2. Copy these secrets to frontend/.env (if needed)
# 3. Update GitHub Secrets at:
#    https://github.com/muchaeljohn739337-cloud/-modular-saas-platform/settings/secrets/actions
# 4. Delete this file: rm $outputFile
"@

$output | Out-File -FilePath $outputFile -Encoding UTF8

Write-Host "=" * 80 -ForegroundColor Yellow
Write-Host "📝 Secrets saved to: $outputFile" -ForegroundColor Yellow
Write-Host "=" * 80 -ForegroundColor Yellow
Write-Host ""

Write-Host "⚠️  IMPORTANT NEXT STEPS:" -ForegroundColor Red
Write-Host ""
Write-Host "1. Update backend/.env with new secrets" -ForegroundColor White
Write-Host "2. Update frontend/.env with new secrets" -ForegroundColor White
Write-Host "3. Update GitHub Secrets (open browser? y/n)" -ForegroundColor White

$openBrowser = Read-Host
if ($openBrowser -eq 'y') {
    Start-Process "https://github.com/muchaeljohn739337-cloud/-modular-saas-platform/settings/secrets/actions"
}

Write-Host ""
Write-Host "4. Revoke old GitHub PAT at:" -ForegroundColor White
Write-Host "   https://github.com/settings/tokens" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Rotate Stripe keys at:" -ForegroundColor White
Write-Host "   https://dashboard.stripe.com/test/apikeys" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  REMEMBER TO DELETE $outputFile AFTER USE!" -ForegroundColor Red
