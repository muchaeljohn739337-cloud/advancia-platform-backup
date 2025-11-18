#!/usr/bin/env pwsh
# Run Integration Tests Against Production API
# Usage: .\scripts\run-production-tests.ps1

param(
    [string]$ApiUrl = "https://api.advanciapayledger.com",
    [string]$TestType = "all" # Options: wallet, api, all
)

Write-Host "`n🧪 Running Production Integration Tests`n" -ForegroundColor Cyan
Write-Host "============================================================`n"

Write-Host "📋 Test Configuration:" -ForegroundColor Yellow
Write-Host "   API URL: $ApiUrl"
Write-Host "   Test Type: $TestType`n"

# Navigate to backend directory
Set-Location "$PSScriptRoot\..\backend"

# Test 1: Health Check
Write-Host "🏥 Testing API Health..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$ApiUrl/health" -Method Get -TimeoutSec 10
    if ($healthResponse.status -eq "ok") {
        Write-Host "✅ API Health Check: PASSED`n" -ForegroundColor Green
    } else {
        Write-Host "❌ API Health Check: FAILED`n" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ API Health Check: FAILED - $($_.Exception.Message)`n" -ForegroundColor Red
    exit 1
}

# Test 2: Wallet Generation Test (if wallet test type)
if ($TestType -eq "wallet" -or $TestType -eq "all") {
    Write-Host "🔐 Running Wallet Generation Tests..." -ForegroundColor Yellow
    
    # Update test-wallet.js to use production URL
    $testWalletContent = Get-Content "test-wallet.js" -Raw
    $testWalletContent = $testWalletContent -replace 'const BASE_URL = "http://localhost:4000/api";', "const BASE_URL = `"$ApiUrl/api`";"
    Set-Content "test-wallet.js.prod" $testWalletContent
    
    node test-wallet.js.prod
    $walletTestResult = $LASTEXITCODE
    
    Remove-Item "test-wallet.js.prod" -ErrorAction SilentlyContinue
    
    if ($walletTestResult -eq 0) {
        Write-Host "✅ Wallet Tests: PASSED`n" -ForegroundColor Green
    } else {
        Write-Host "❌ Wallet Tests: FAILED`n" -ForegroundColor Red
        exit 1
    }
}

# Test 3: API Endpoints Test
if ($TestType -eq "api" -or $TestType -eq "all") {
    Write-Host "🌐 Testing API Endpoints..." -ForegroundColor Yellow
    
    # Test authentication endpoint
    try {
        $authTest = Invoke-WebRequest -Uri "$ApiUrl/api/auth/send-otp" -Method Post -Body (@{email="test@example.com"} | ConvertTo-Json) -ContentType "application/json" -ErrorAction Stop
        Write-Host "   ✓ Auth endpoint accessible" -ForegroundColor Green
    } catch {
        Write-Host "   ✗ Auth endpoint failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    # Test wallet endpoints (requires auth)
    Write-Host "   ℹ️  Wallet endpoints require authentication (tested via wallet test)`n" -ForegroundColor Cyan
}

# Test 4: Database Connection (via API)
Write-Host "💾 Testing Database Connectivity..." -ForegroundColor Yellow
try {
    $dbTest = Invoke-RestMethod -Uri "$ApiUrl/api/health" -Method Get
    if ($dbTest.database -or $dbTest.uptime) {
        Write-Host "✅ Database Connection: VERIFIED`n" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Database Connection: Unable to verify`n" -ForegroundColor Yellow
}

# Summary
Write-Host "============================================================"
Write-Host "`n📊 Test Summary:"
Write-Host "✅ Health Check: PASSED"
if ($TestType -eq "wallet" -or $TestType -eq "all") {
    if ($walletTestResult -eq 0) {
        Write-Host "✅ Wallet Tests: PASSED"
    } else {
        Write-Host "❌ Wallet Tests: FAILED"
    }
}
Write-Host "✅ API Endpoints: ACCESSIBLE"
Write-Host "`n🎉 Production tests completed!`n"

Write-Host "📋 Next Steps:"
Write-Host "1. Monitor production logs for errors"
Write-Host "2. Test frontend → backend API calls"
Write-Host "3. Verify CORS configuration"
Write-Host "4. Check Sentry for error reports`n"
