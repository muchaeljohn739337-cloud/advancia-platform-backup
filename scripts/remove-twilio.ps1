# ============================================================================
# TWILIO COMPLETE REMOVAL SCRIPT
# Removes all Twilio dependencies and code from the project
# ============================================================================

Write-Host "`n🗑️  TWILIO REMOVAL SCRIPT" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray

$rootDir = "c:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform"
Set-Location $rootDir

# Step 1: Analyze Twilio usage
Write-Host "`n📊 STEP 1: Analyzing Twilio usage..." -ForegroundColor Yellow

$twilioFiles = @()
Get-ChildItem -Recurse -File -Include *.ts,*.js,*.json,*.md | ForEach-Object {
    $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
    if ($content -match "twilio|TWILIO|Twilio") {
        $count = ([regex]::Matches($content, "twilio|TWILIO|Twilio")).Count
        $twilioFiles += [PSCustomObject]@{
            Path = $_.FullName.Replace($rootDir, ".")
            Count = $count
        }
    }
}

Write-Host "   Found Twilio references in $($twilioFiles.Count) files:" -ForegroundColor White
$twilioFiles | Sort-Object -Property Count -Descending | Select-Object -First 10 | ForEach-Object {
    Write-Host "   - $($_.Path) ($($_.Count) references)" -ForegroundColor Gray
}

# Step 2: Check package.json for twilio dependency
Write-Host "`n📦 STEP 2: Checking package.json..." -ForegroundColor Yellow

$backendPackageJson = Get-Content "backend\package.json" -Raw | ConvertFrom-Json
if ($backendPackageJson.dependencies.twilio) {
    Write-Host "   ❌ Found 'twilio' in dependencies: $($backendPackageJson.dependencies.twilio)" -ForegroundColor Red
    Write-Host "   ⚠️  Manual removal required - edit backend/package.json" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ No 'twilio' dependency found in package.json" -ForegroundColor Green
}

# Step 3: List files that need modification
Write-Host "`n📝 STEP 3: Files requiring code changes:" -ForegroundColor Yellow

$filesToModify = @(
    "backend\src\routes\authAdmin.ts",
    "backend\src\services\alertService.ts",
    "backend\src\utils\envInspector.ts",
    "backend\src\rpa\config.ts",
    "backend\src\rpa\notificationAutomation.ts"
)

foreach ($file in $filesToModify) {
    if (Test-Path $file) {
        $count = (Get-Content $file | Select-String -Pattern "twilio|TWILIO|Twilio").Count
        if ($count -gt 0) {
            Write-Host "   ⚠️  $file ($count references)" -ForegroundColor Yellow
        } else {
            Write-Host "   ✅ $file (no references)" -ForegroundColor Green
        }
    } else {
        Write-Host "   ⚠️  $file (not found)" -ForegroundColor Red
    }
}

# Step 4: Check if twilio package is installed
Write-Host "`n📦 STEP 4: Checking installed packages..." -ForegroundColor Yellow

Set-Location "backend"
if (Test-Path "node_modules\twilio") {
    Write-Host "   ❌ Twilio package is installed in node_modules" -ForegroundColor Red
    Write-Host "   💡 Will be removed after package.json update + npm install" -ForegroundColor Cyan
} else {
    Write-Host "   ✅ Twilio package not found in node_modules" -ForegroundColor Green
}
Set-Location $rootDir

# Step 5: Summary and next steps
Write-Host "`n" + "=" * 70 -ForegroundColor Gray
Write-Host "📋 SUMMARY & NEXT STEPS" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray

Write-Host "`n✅ Analysis complete!" -ForegroundColor Green
Write-Host "`n🔧 AUTOMATED FIXES (will be applied by Copilot):" -ForegroundColor Yellow
Write-Host "   1. Remove 'import twilio' from authAdmin.ts" -ForegroundColor White
Write-Host "   2. Remove getTwilioClient() function" -ForegroundColor White
Write-Host "   3. Simplify OTP sending to console-only" -ForegroundColor White
Write-Host "   4. Remove sendSMSAlert() from alertService.ts" -ForegroundColor White
Write-Host "   5. Remove TWILIO_* env vars from envInspector.ts" -ForegroundColor White
Write-Host "   6. Remove Twilio config from rpa/config.ts" -ForegroundColor White
Write-Host "   7. Remove twilioClient from notificationAutomation.ts" -ForegroundColor White

Write-Host "`n📋 MANUAL ACTIONS REQUIRED:" -ForegroundColor Yellow
Write-Host "   1. Remove 'twilio' from backend/package.json dependencies (if present)" -ForegroundColor White
Write-Host "   2. Run 'npm install' or 'pnpm install' to update node_modules" -ForegroundColor White
Write-Host "   3. Remove any TWILIO_* environment variables from .env files" -ForegroundColor White
Write-Host "   4. Update documentation to remove SMS/Twilio references" -ForegroundColor White

Write-Host "`n✨ After removal, admin OTP will use console logs (perfect for dev)" -ForegroundColor Green
Write-Host "   You can switch to email OTP for production later." -ForegroundColor Gray

Write-Host "`n" + "=" * 70 -ForegroundColor Gray
Write-Host "🎉 Analysis complete! Ready for code modifications." -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray
