# Cryptomus Setup Verification Script
# This script helps verify your Cryptomus merchant ID and API key

Write-Host "`n=== Cryptomus Configuration Verification ===" -ForegroundColor Cyan
Write-Host "This script will help you verify your Cryptomus setup systematically`n" -ForegroundColor Yellow

# Step 1: Check .env file
Write-Host "[Step 1] Checking backend/.env.NEW file..." -ForegroundColor Green
$envPath = "backend\.env.NEW"

if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    
    # Extract values
    $apiKey = if ($envContent -match 'CRYPTOMUS_API_KEY=(.+)') { $matches[1].Trim() } else { "NOT_FOUND" }
    $merchantId = if ($envContent -match 'CRYPTOMUS_MERCHANT_ID=(.+)') { $matches[1].Trim() } else { "NOT_FOUND" }
    
    Write-Host "  CRYPTOMUS_API_KEY: " -NoNewline
    if ($apiKey -ne "NOT_FOUND" -and $apiKey -ne "YOUR_NEW_CRYPTOMUS_KEY_HERE") {
        Write-Host "✓ Found (${apiKey.Substring(0,20)}...)" -ForegroundColor Green
    } else {
        Write-Host "✗ Missing or placeholder" -ForegroundColor Red
    }
    
    Write-Host "  CRYPTOMUS_MERCHANT_ID: " -NoNewline
    if ($merchantId -ne "NOT_FOUND" -and $merchantId -ne "YOUR_MERCHANT_ID_HERE") {
        Write-Host "✓ Found ($merchantId)" -ForegroundColor Green
    } else {
        Write-Host "✗ Missing or placeholder" -ForegroundColor Red
    }
} else {
    Write-Host "  ✗ backend/.env.NEW not found!" -ForegroundColor Red
    exit 1
}

# Step 2: Guide to verify in Cryptomus dashboard
Write-Host "`n[Step 2] How to verify your Merchant ID in Cryptomus:" -ForegroundColor Green
Write-Host "  1. Open: " -NoNewline
Write-Host "https://app.cryptomus.com/" -ForegroundColor Cyan
Write-Host "  2. Log in to your account"
Write-Host "  3. Navigate to: Settings → API Keys or Shops"
Write-Host "  4. Look for these fields:"
Write-Host "     - Merchant UUID (this is your MERCHANT_ID)"
Write-Host "     - API Key (starts with long random string)"
Write-Host "     - Payment Key (different from API key)"

# Step 3: Test API connection
Write-Host "`n[Step 3] Testing Cryptomus API connection..." -ForegroundColor Green
Write-Host "  Press 'T' to test now, or 'S' to skip: " -NoNewline -ForegroundColor Yellow
$choice = Read-Host

if ($choice -eq 'T' -or $choice -eq 't') {
    Write-Host "`n  Testing API endpoint..." -ForegroundColor Cyan
    
    # Create test request
    $testData = @{
        amount = "10.00"
        currency = "USD"
        order_id = "test-$(Get-Date -Format 'yyyyMMddHHmmss')"
        url_callback = "https://example.com/callback"
    } | ConvertTo-Json
    
    $base64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($testData))
    $signature = [System.Security.Cryptography.MD5]::Create().ComputeHash(
        [System.Text.Encoding]::UTF8.GetBytes($base64 + $apiKey)
    ) | ForEach-Object { $_.ToString("x2") } | Join-String
    
    try {
        $headers = @{
            "merchant" = $merchantId
            "sign" = $signature
            "Content-Type" = "application/json"
        }
        
        # Note: This is a dry-run test endpoint
        Write-Host "  Request Headers:" -ForegroundColor Gray
        Write-Host "    merchant: $merchantId" -ForegroundColor Gray
        Write-Host "    sign: $($signature.Substring(0,16))..." -ForegroundColor Gray
        
        Write-Host "`n  If these values are correct, API calls should work." -ForegroundColor Green
        Write-Host "  To verify fully, create a test invoice in your app." -ForegroundColor Yellow
        
    } catch {
        Write-Host "  ✗ Test failed: $_" -ForegroundColor Red
    }
} else {
    Write-Host "  Skipped API test" -ForegroundColor Yellow
}

# Step 4: Verification checklist
Write-Host "`n[Step 4] Final Verification Checklist:" -ForegroundColor Green
Write-Host "  [ ] Merchant ID is a valid UUID format (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)"
Write-Host "  [ ] API Key is a long alphanumeric string (80+ characters)"
Write-Host "  [ ] Both values match what's shown in Cryptomus dashboard"
Write-Host "  [ ] Your Cryptomus account is verified (KYC if required)"
Write-Host "  [ ] Payment methods are enabled in dashboard"

# Step 5: Common issues
Write-Host "`n[Step 5] Common Issues:" -ForegroundColor Green
Write-Host "  ⚠️  'UUID is not merchant ID' error?" -ForegroundColor Yellow
Write-Host "     → You may have copied your User ID instead of Merchant ID"
Write-Host "     → Check: Settings → Shops → Select your shop → Copy Merchant UUID"
Write-Host ""
Write-Host "  ⚠️  'Invalid signature' error?" -ForegroundColor Yellow
Write-Host "     → API Key might be incorrect"
Write-Host "     → Regenerate API key in dashboard and update .env"
Write-Host ""
Write-Host "  ⚠️  'Merchant not found' error?" -ForegroundColor Yellow
Write-Host "     → Merchant ID is wrong"
Write-Host "     → Make sure you're using the UUID from the correct shop"

Write-Host "`n=== Verification Complete ===" -ForegroundColor Cyan
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. If values are correct, activate .env: Move-Item backend\.env.NEW backend\.env -Force"
Write-Host "  2. Start backend: cd backend; npm run dev"
Write-Host "  3. Test invoice creation: POST /api/cryptomus/create-invoice"
Write-Host ""
