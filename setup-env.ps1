# Advancia Pay - Environment Setup Script (PowerShell)
# Run: .\setup-env.ps1

Write-Host "`n🚀 Advancia Pay - Environment Setup`n" -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Gray
Write-Host ("=" * 59) -ForegroundColor Gray

# Check if .env files exist
$backendEnvExists = Test-Path "backend\.env"
$frontendEnvExists = Test-Path "frontend\.env.local"

# Backend setup
Write-Host "`n📦 Backend Environment Setup" -ForegroundColor Yellow

if ($backendEnvExists) {
    Write-Host "⚠️  backend\.env already exists!" -ForegroundColor Red
    $overwrite = Read-Host "Overwrite? (y/N)"
    if ($overwrite -ne "y") {
        Write-Host "Skipping backend setup..." -ForegroundColor Gray
    } else {
        Copy-Item "backend\.env.example" "backend\.env"
        Write-Host "✅ Created backend\.env from template" -ForegroundColor Green
    }
} else {
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "✅ Created backend\.env from template" -ForegroundColor Green
}

# Frontend setup
Write-Host "`n🎨 Frontend Environment Setup" -ForegroundColor Yellow

if ($frontendEnvExists) {
    Write-Host "⚠️  frontend\.env.local already exists!" -ForegroundColor Red
    $overwrite = Read-Host "Overwrite? (y/N)"
    if ($overwrite -ne "y") {
        Write-Host "Skipping frontend setup..." -ForegroundColor Gray
    } else {
        Copy-Item "frontend\.env.example" "frontend\.env.local"
        Write-Host "✅ Created frontend\.env.local from template" -ForegroundColor Green
    }
} else {
    Copy-Item "frontend\.env.example" "frontend\.env.local"
    Write-Host "✅ Created frontend\.env.local from template" -ForegroundColor Green
}

# Generate secrets
Write-Host "`n🔐 Generating Secrets..." -ForegroundColor Yellow
Write-Host "(This will display secrets - copy them to your .env files)`n" -ForegroundColor Gray

Set-Location backend
node generate-secrets.js
Set-Location ..

# Summary
Write-Host "`n" + ("=" * 60) -ForegroundColor Gray
Write-Host "`n📋 Summary" -ForegroundColor Cyan
Write-Host "✅ Environment files created" -ForegroundColor Green
Write-Host "✅ Secrets generated (see above)" -ForegroundColor Green

Write-Host "`n⚠️  Important Next Steps:" -ForegroundColor Yellow
Write-Host "1. Edit backend\.env with the generated secrets" -ForegroundColor White
Write-Host "2. Edit frontend\.env.local with API URL and Stripe key" -ForegroundColor White
Write-Host "3. Setup PostgreSQL database (docker-compose up -d postgres)" -ForegroundColor White
Write-Host "4. Run migrations (cd backend && npx prisma migrate dev)" -ForegroundColor White
Write-Host "5. Start backend (cd backend && pnpm run dev)" -ForegroundColor White
Write-Host "6. Start frontend (cd frontend && pnpm run dev)" -ForegroundColor White

Write-Host "`n🔒 Security Reminders:" -ForegroundColor Red
Write-Host "- Store WALLET_MASTER_SEED in a secure vault" -ForegroundColor White
Write-Host "- Never commit .env files to git" -ForegroundColor White
Write-Host "- Use different secrets for dev/staging/production" -ForegroundColor White
Write-Host "- Enable Gmail App Passwords for EMAIL_PASSWORD" -ForegroundColor White

Write-Host "`n📚 Documentation:" -ForegroundColor Cyan
Write-Host "- ENV_SETUP_GUIDE.md - Detailed environment setup" -ForegroundColor White
Write-Host "- WALLET_DEPLOYMENT_GUIDE.md - Wallet deployment checklist" -ForegroundColor White
Write-Host "- DEV_SETUP_GUIDE.md - Complete development setup`n" -ForegroundColor White
