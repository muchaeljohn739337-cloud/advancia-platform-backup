#!/usr/bin/env pwsh
# API Security Testing Script
# Tests REST API endpoints for common vulnerabilities

param(
    [string]$BaseUrl = "http://localhost:4000/api",
    [string]$AuthToken = "",
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Continue"
$script:passCount = 0
$script:failCount = 0
$script:warnCount = 0

Write-Host "`n🔐 API Security Testing Suite" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Target: $BaseUrl" -ForegroundColor Yellow
Write-Host "Time: $(Get-Date)" -ForegroundColor Yellow
Write-Host ""

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [string]$Body = "",
        [ValidateSet("Pass", "Fail", "Warn")]
        [string]$Expected = "Pass",
        [string]$Description = ""
    )
    
    Write-Host "`n📡 Testing: $Name" -ForegroundColor Cyan
    if ($Description) {
        Write-Host "   $Description" -ForegroundColor Gray
    }
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            UseBasicParsing = $true
            ErrorAction = "SilentlyContinue"
        }
        
        if ($Body -and $Method -ne "GET") {
            $params.Body = $Body
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        
        if ($Verbose) {
            Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Gray
            Write-Host "   Headers: $($response.Headers.Keys -join ', ')" -ForegroundColor Gray
        }
        
        if ($Expected -eq "Pass") {
            Write-Host "   ✅ PASS" -ForegroundColor Green
            $script:passCount++
        } elseif ($Expected -eq "Fail") {
            Write-Host "   ❌ FAIL - Expected failure but request succeeded" -ForegroundColor Red
            $script:failCount++
        }
        
        return $response
    } catch {
        if ($Expected -eq "Fail") {
            Write-Host "   ✅ PASS - Request blocked as expected" -ForegroundColor Green
            $script:passCount++
        } else {
            Write-Host "   ❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
            $script:failCount++
        }
        return $null
    }
}

## 1. AUTHENTICATION TESTS
Write-Host "`n" + ("=" * 60) -ForegroundColor Magenta
Write-Host "🔑 AUTHENTICATION & AUTHORIZATION TESTS" -ForegroundColor Magenta
Write-Host ("=" * 60) -ForegroundColor Magenta

# Test 1.1: Login with invalid credentials
Test-Endpoint `
    -Name "Invalid Login" `
    -Url "$BaseUrl/auth/login" `
    -Method "POST" `
    -Body '{"email":"attacker@test.com","password":"wrongpass"}' `
    -Expected "Fail" `
    -Description "Should block invalid credentials"

# Test 1.2: Login without email
Test-Endpoint `
    -Name "Login Missing Email" `
    -Url "$BaseUrl/auth/login" `
    -Method "POST" `
    -Body '{"password":"test123"}' `
    -Expected "Fail" `
    -Description "Should require email field"

# Test 1.3: Access protected endpoint without token
Test-Endpoint `
    -Name "Unauthorized Access" `
    -Url "$BaseUrl/users/profile" `
    -Method "GET" `
    -Expected "Fail" `
    -Description "Should block access without authentication token"

# Test 1.4: Access admin endpoint with user token
if ($AuthToken) {
    Test-Endpoint `
        -Name "Privilege Escalation Test" `
        -Url "$BaseUrl/admin/users" `
        -Method "GET" `
        -Headers @{"Authorization" = "Bearer $AuthToken"} `
        -Expected "Fail" `
        -Description "User token should not access admin endpoints"
}

## 2. INJECTION TESTS
Write-Host "`n" + ("=" * 60) -ForegroundColor Magenta
Write-Host "💉 SQL & NoSQL INJECTION TESTS" -ForegroundColor Magenta
Write-Host ("=" * 60) -ForegroundColor Magenta

$sqlPayloads = @(
    "' OR '1'='1",
    "admin'--",
    "' UNION SELECT NULL, NULL, NULL--",
    "1' AND '1'='1",
    "'; DROP TABLE users;--"
)

foreach ($payload in $sqlPayloads) {
    Test-Endpoint `
        -Name "SQL Injection: $payload" `
        -Url "$BaseUrl/auth/login" `
        -Method "POST" `
        -Body "{`"email`":`"$payload`",`"password`":`"test`"}" `
        -Expected "Fail" `
        -Description "Should sanitize SQL injection attempts"
}

## 3. XSS TESTS
Write-Host "`n" + ("=" * 60) -ForegroundColor Magenta
Write-Host "🎭 CROSS-SITE SCRIPTING (XSS) TESTS" -ForegroundColor Magenta
Write-Host ("=" * 60) -ForegroundColor Magenta

$xssPayloads = @(
    "<script>alert('XSS')</script>",
    "<img src=x onerror=alert(1)>",
    "javascript:alert(1)",
    "<svg onload=alert(1)>",
    "'><script>alert(String.fromCharCode(88,83,83))</script>"
)

foreach ($payload in $xssPayloads) {
    Test-Endpoint `
        -Name "XSS Test: $payload" `
        -Url "$BaseUrl/auth/register" `
        -Method "POST" `
        -Body "{`"email`":`"test@test.com`",`"password`":`"test123`",`"name`":`"$payload`"}" `
        -Expected "Fail" `
        -Description "Should sanitize XSS payloads"
}

## 4. RATE LIMITING TESTS
Write-Host "`n" + ("=" * 60) -ForegroundColor Magenta
Write-Host "⏱️ RATE LIMITING TESTS" -ForegroundColor Magenta
Write-Host ("=" * 60) -ForegroundColor Magenta

Write-Host "`nSending 20 rapid requests to test rate limiting..." -ForegroundColor Yellow
$rateLimitHit = $false
for ($i = 1; $i -le 20; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "$BaseUrl/auth/login" -Method "POST" -Body '{"email":"test@test.com","password":"wrong"}' -ContentType "application/json" -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 429) {
            $rateLimitHit = $true
            Write-Host "   Request $i : ✅ Rate limit triggered (429)" -ForegroundColor Green
            break
        } else {
            Write-Host "   Request $i : Status $($response.StatusCode)" -ForegroundColor Gray
        }
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 429) {
            $rateLimitHit = $true
            Write-Host "   Request $i : ✅ Rate limit triggered (429)" -ForegroundColor Green
            break
        }
    }
    Start-Sleep -Milliseconds 100
}

if ($rateLimitHit) {
    Write-Host "`n✅ PASS - Rate limiting is working" -ForegroundColor Green
    $script:passCount++
} else {
    Write-Host "`n⚠️ WARN - Rate limiting may not be configured" -ForegroundColor Yellow
    $script:warnCount++
}

## 5. HEADER SECURITY TESTS
Write-Host "`n" + ("=" * 60) -ForegroundColor Magenta
Write-Host "📋 SECURITY HEADERS TESTS" -ForegroundColor Magenta
Write-Host ("=" * 60) -ForegroundColor Magenta

try {
    $response = Invoke-WebRequest -Uri $BaseUrl.Replace("/api", "") -UseBasicParsing -ErrorAction SilentlyContinue
    
    $requiredHeaders = @{
        "Strict-Transport-Security" = "Should enforce HTTPS"
        "X-Content-Type-Options" = "Should prevent MIME sniffing"
        "X-Frame-Options" = "Should prevent clickjacking"
        "Content-Security-Policy" = "Should prevent XSS"
        "Referrer-Policy" = "Should control referrer information"
    }
    
    foreach ($header in $requiredHeaders.Keys) {
        if ($response.Headers[$header]) {
            Write-Host "   ✅ $header : Present" -ForegroundColor Green
            $script:passCount++
        } else {
            Write-Host "   ❌ $header : MISSING - $($requiredHeaders[$header])" -ForegroundColor Red
            $script:failCount++
        }
    }
} catch {
    Write-Host "   ❌ Failed to check headers: $_" -ForegroundColor Red
    $script:failCount++
}

## 6. CORS TESTS
Write-Host "`n" + ("=" * 60) -ForegroundColor Magenta
Write-Host "🌐 CORS CONFIGURATION TESTS" -ForegroundColor Magenta
Write-Host ("=" * 60) -ForegroundColor Magenta

$maliciousOrigins = @(
    "https://evil.com",
    "https://attacker.com",
    "null"
)

foreach ($origin in $maliciousOrigins) {
    try {
        $response = Invoke-WebRequest -Uri "$BaseUrl/health" -Headers @{"Origin" = $origin} -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.Headers["Access-Control-Allow-Origin"] -eq $origin) {
            Write-Host "   ❌ FAIL - Accepting origin: $origin" -ForegroundColor Red
            $script:failCount++
        } else {
            Write-Host "   ✅ PASS - Blocked origin: $origin" -ForegroundColor Green
            $script:passCount++
        }
    } catch {
        Write-Host "   ✅ PASS - Blocked origin: $origin" -ForegroundColor Green
        $script:passCount++
    }
}

## 7. JWT TOKEN TESTS
Write-Host "`n" + ("=" * 60) -ForegroundColor Magenta
Write-Host "🎫 JWT TOKEN SECURITY TESTS" -ForegroundColor Magenta
Write-Host ("=" * 60) -ForegroundColor Magenta

$invalidTokens = @(
    "invalid.token.here",
    "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VySWQiOjF9.",  # None algorithm
    "Bearer ",
    ""
)

foreach ($token in $invalidTokens) {
    Test-Endpoint `
        -Name "Invalid JWT: $(if($token.Length -gt 20) { $token.Substring(0,20) + '...' } else { $token })" `
        -Url "$BaseUrl/users/profile" `
        -Method "GET" `
        -Headers @{"Authorization" = "Bearer $token"} `
        -Expected "Fail" `
        -Description "Should reject invalid JWT tokens"
}

## 8. FILE UPLOAD TESTS (if applicable)
Write-Host "`n" + ("=" * 60) -ForegroundColor Magenta
Write-Host "📁 FILE UPLOAD SECURITY TESTS" -ForegroundColor Magenta
Write-Host ("=" * 60) -ForegroundColor Magenta

# Test malicious file types
$maliciousFiles = @(
    "test.php",
    "shell.exe",
    "malware.sh",
    "test.svg"  # Can contain scripts
)

foreach ($file in $maliciousFiles) {
    Write-Host "   ⚠️ Manual test required: Upload $file to file endpoints" -ForegroundColor Yellow
}

## 9. API ENUMERATION TESTS
Write-Host "`n" + ("=" * 60) -ForegroundColor Magenta
Write-Host "🔢 API ENUMERATION TESTS" -ForegroundColor Magenta
Write-Host ("=" * 60) -ForegroundColor Magenta

# Test for user enumeration
Test-Endpoint `
    -Name "User Enumeration via Email" `
    -Url "$BaseUrl/auth/forgot-password" `
    -Method "POST" `
    -Body '{"email":"nonexistent@test.com"}' `
    -Description "Should not reveal if email exists"

# Test for sequential ID exposure
for ($id = 1; $id -le 5; $id++) {
    Test-Endpoint `
        -Name "User ID Enumeration: $id" `
        -Url "$BaseUrl/users/$id" `
        -Method "GET" `
        -Expected "Fail" `
        -Description "Should not allow sequential ID guessing"
}

## 10. BUSINESS LOGIC TESTS
Write-Host "`n" + ("=" * 60) -ForegroundColor Magenta
Write-Host "💼 BUSINESS LOGIC TESTS" -ForegroundColor Magenta
Write-Host ("=" * 60) -ForegroundColor Magenta

# Test negative amounts
Test-Endpoint `
    -Name "Negative Transaction Amount" `
    -Url "$BaseUrl/transactions" `
    -Method "POST" `
    -Body '{"amount":-1000,"recipient":"user@test.com"}' `
    -Expected "Fail" `
    -Description "Should reject negative transaction amounts"

# Test excessive amounts
Test-Endpoint `
    -Name "Excessive Transaction Amount" `
    -Url "$BaseUrl/transactions" `
    -Method "POST" `
    -Body '{"amount":999999999,"recipient":"user@test.com"}' `
    -Expected "Fail" `
    -Description "Should validate reasonable transaction limits"

## SUMMARY
Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "📊 TEST SUMMARY" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan

$total = $script:passCount + $script:failCount + $script:warnCount
$passRate = if ($total -gt 0) { [math]::Round(($script:passCount / $total) * 100, 2) } else { 0 }

Write-Host "`n✅ Passed : $($script:passCount)" -ForegroundColor Green
Write-Host "❌ Failed : $($script:failCount)" -ForegroundColor Red
Write-Host "⚠️ Warnings: $($script:warnCount)" -ForegroundColor Yellow
Write-Host "📈 Pass Rate: $passRate%" -ForegroundColor $(if($passRate -ge 80) { "Green" } elseif($passRate -ge 60) { "Yellow" } else { "Red" })

Write-Host "`n🎯 Security Posture: $(
    if($passRate -ge 90) { 'EXCELLENT' }
    elseif($passRate -ge 75) { 'GOOD' }
    elseif($passRate -ge 60) { 'FAIR' }
    else { 'NEEDS IMPROVEMENT' }
)" -ForegroundColor $(
    if($passRate -ge 90) { "Green" }
    elseif($passRate -ge 75) { "Cyan" }
    elseif($passRate -ge 60) { "Yellow" }
    else { "Red" }
)

if ($script:failCount -gt 0) {
    Write-Host "`n⚠️ CRITICAL: $($script:failCount) security issues detected!" -ForegroundColor Red
    Write-Host "   Review failed tests and implement fixes immediately." -ForegroundColor Red
}

Write-Host ""
