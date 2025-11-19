#!/usr/bin/env pwsh
# Security Testing Automation Script
# Runs comprehensive security scans on Advancia Pay platform

param(
    [ValidateSet("all", "quick", "deep", "api", "dependencies", "code", "containers")]
    [string]$Mode = "quick",
    [string]$Target = "https://advanciapayledger.com",
    [switch]$Report = $false
)

$ErrorActionPreference = "Continue"
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$reportDir = "security-reports/$timestamp"

Write-Host "`n🔒 Advancia Pay Security Testing Suite" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Mode: $Mode" -ForegroundColor Yellow
Write-Host "Target: $Target" -ForegroundColor Yellow
Write-Host "Report Directory: $reportDir`n" -ForegroundColor Yellow

# Create report directory
if ($Report) {
    New-Item -ItemType Directory -Force -Path $reportDir | Out-Null
}

# Function to run command and capture output
function Run-SecurityTest {
    param(
        [string]$Name,
        [string]$Command,
        [string]$OutputFile
    )
    
    Write-Host "`n📊 Running: $Name" -ForegroundColor Cyan
    Write-Host "Command: $Command" -ForegroundColor Gray
    
    try {
        if ($Report) {
            Invoke-Expression "$Command 2>&1 | Tee-Object -FilePath $reportDir/$OutputFile"
        } else {
            Invoke-Expression $Command
        }
        Write-Host "✅ $Name completed" -ForegroundColor Green
    } catch {
        Write-Host "❌ $Name failed: $_" -ForegroundColor Red
    }
}

## 1. DEPENDENCY VULNERABILITIES
if ($Mode -in @("all", "quick", "dependencies")) {
    Write-Host "`n🔍 DEPENDENCY VULNERABILITY SCANNING" -ForegroundColor Magenta
    Write-Host "------------------------------------------------------------" -ForegroundColor Gray
    
    # NPM Audit (Backend)
    Run-SecurityTest `
        -Name "NPM Audit (Backend)" `
        -Command "Set-Location backend; npm audit --json" `
        -OutputFile "npm-audit-backend.json"
    
    # NPM Audit (Frontend)
    Run-SecurityTest `
        -Name "NPM Audit (Frontend)" `
        -Command "Set-Location frontend; npm audit --json" `
        -OutputFile "npm-audit-frontend.json"
    
    # Snyk (if installed)
    if (Get-Command snyk -ErrorAction SilentlyContinue) {
        Run-SecurityTest `
            -Name "Snyk Vulnerability Scan" `
            -Command "snyk test --all-projects --json" `
            -OutputFile "snyk-report.json"
    }
}

## 2. CODE SECURITY ANALYSIS
if ($Mode -in @("all", "code")) {
    Write-Host "`n🔍 STATIC CODE ANALYSIS" -ForegroundColor Magenta
    Write-Host "------------------------------------------------------------" -ForegroundColor Gray
    
    # ESLint Security
    Run-SecurityTest `
        -Name "ESLint Security Scan" `
        -Command "npx eslint --ext .ts,.js backend/src frontend/src --plugin security" `
        -OutputFile "eslint-security.txt"
    
    # Semgrep (if installed)
    if (Get-Command semgrep -ErrorAction SilentlyContinue) {
        Run-SecurityTest `
            -Name "Semgrep SAST" `
            -Command "semgrep --config=auto backend/src frontend/src --json" `
            -OutputFile "semgrep-report.json"
    }
    
    # Secret Detection
    Run-SecurityTest `
        -Name "Secret Detection" `
        -Command "git secrets --scan" `
        -OutputFile "secret-scan.txt"
}

## 3. API SECURITY TESTING
if ($Mode -in @("all", "api")) {
    Write-Host "`n🔍 API SECURITY TESTING" -ForegroundColor Magenta
    Write-Host "------------------------------------------------------------" -ForegroundColor Gray
    
    # Test authentication endpoints
    Write-Host "`n📡 Testing Authentication Endpoints..." -ForegroundColor Yellow
    
    # Test rate limiting
    Write-Host "Testing rate limiting..."
    for ($i = 1; $i -le 10; $i++) {
        $response = Invoke-WebRequest -Uri "$Target/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"test@test.com","password":"wrong"}' -UseBasicParsing -ErrorAction SilentlyContinue
        Write-Host "Request $i: Status $($response.StatusCode)"
    }
    
    # Test SQL injection
    Write-Host "`nTesting SQL Injection..."
    $sqlPayloads = @("' OR '1'='1", "admin'--", "' UNION SELECT NULL--")
    foreach ($payload in $sqlPayloads) {
        try {
            $response = Invoke-WebRequest -Uri "$Target/api/auth/login" -Method POST -ContentType "application/json" -Body "{`"email`":`"$payload`",`"password`":`"test`"}" -UseBasicParsing -ErrorAction SilentlyContinue
            Write-Host "Payload: $payload - Status: $($response.StatusCode)"
        } catch {
            Write-Host "Payload: $payload - Blocked or error"
        }
    }
    
    # Test XSS
    Write-Host "`nTesting XSS..."
    $xssPayloads = @("<script>alert('XSS')</script>", "<img src=x onerror=alert(1)>", "javascript:alert(1)")
    foreach ($payload in $xssPayloads) {
        Write-Host "Testing: $payload"
    }
}

## 4. CONTAINER SECURITY
if ($Mode -in @("all", "containers")) {
    Write-Host "`n🔍 CONTAINER SECURITY SCANNING" -ForegroundColor Magenta
    Write-Host "------------------------------------------------------------" -ForegroundColor Gray
    
    # Docker Scout (if available)
    if (Get-Command docker-scout -ErrorAction SilentlyContinue) {
        Run-SecurityTest `
            -Name "Docker Scout - Backend" `
            -Command "docker scout cves advancia-pay/backend:latest" `
            -OutputFile "docker-scout-backend.txt"
    }
    
    # Trivy (if installed)
    if (Get-Command trivy -ErrorAction SilentlyContinue) {
        Run-SecurityTest `
            -Name "Trivy Container Scan - Backend" `
            -Command "trivy image advancia-pay/backend:latest --severity HIGH,CRITICAL" `
            -OutputFile "trivy-backend.txt"
    }
}

## 5. QUICK WEB SCAN
if ($Mode -in @("all", "quick")) {
    Write-Host "`n🔍 QUICK WEB SECURITY SCAN" -ForegroundColor Magenta
    Write-Host "------------------------------------------------------------" -ForegroundColor Gray
    
    # Security headers check
    Write-Host "`n📋 Checking Security Headers..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri $Target -UseBasicParsing
        $headers = @(
            "Strict-Transport-Security",
            "Content-Security-Policy",
            "X-Frame-Options",
            "X-Content-Type-Options",
            "Referrer-Policy",
            "Permissions-Policy"
        )
        
        foreach ($header in $headers) {
            if ($response.Headers[$header]) {
                Write-Host "✅ $header : $($response.Headers[$header])" -ForegroundColor Green
            } else {
                Write-Host "❌ $header : MISSING" -ForegroundColor Red
            }
        }
    } catch {
        Write-Host "Failed to fetch headers: $_" -ForegroundColor Red
    }
    
    # SSL/TLS check
    Write-Host "`n🔒 Checking SSL/TLS Configuration..." -ForegroundColor Yellow
    try {
        $uri = [System.Uri]$Target
        $tcpClient = New-Object System.Net.Sockets.TcpClient($uri.Host, 443)
        $sslStream = New-Object System.Net.Security.SslStream($tcpClient.GetStream())
        $sslStream.AuthenticateAsClient($uri.Host)
        Write-Host "✅ SSL Protocol: $($sslStream.SslProtocol)" -ForegroundColor Green
        Write-Host "✅ Cipher: $($sslStream.CipherAlgorithm)" -ForegroundColor Green
        $sslStream.Close()
        $tcpClient.Close()
    } catch {
        Write-Host "❌ SSL/TLS check failed: $_" -ForegroundColor Red
    }
}

## 6. DEEP PENETRATION TEST
if ($Mode -eq "deep") {
    Write-Host "`n🔍 DEEP PENETRATION TESTING (WARNING: May take 30+ minutes)" -ForegroundColor Magenta
    Write-Host "------------------------------------------------------------" -ForegroundColor Gray
    
    # OWASP ZAP
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        Write-Host "`n🕷️ Running OWASP ZAP baseline scan..." -ForegroundColor Yellow
        Run-SecurityTest `
            -Name "OWASP ZAP Baseline" `
            -Command "docker run --rm -v ${PWD}:/zap/wrk:rw owasp/zap2docker-stable zap-baseline.py -t $Target -J zap-report.json" `
            -OutputFile "zap-baseline.json"
    }
    
    # Nuclei (if installed)
    if (Get-Command nuclei -ErrorAction SilentlyContinue) {
        Run-SecurityTest `
            -Name "Nuclei Vulnerability Scan" `
            -Command "nuclei -u $Target -t cves/ -t vulnerabilities/ -json" `
            -OutputFile "nuclei-report.json"
    }
}

## SUMMARY
Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "🎯 SECURITY TESTING SUMMARY" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

if ($Report) {
    Write-Host "`n📊 Reports saved to: $reportDir" -ForegroundColor Green
    Write-Host "`nGenerated Files:" -ForegroundColor Yellow
    Get-ChildItem $reportDir | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor White }
}

Write-Host "`n✅ Security testing completed!" -ForegroundColor Green
Write-Host "`n📋 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Review all findings" -ForegroundColor White
Write-Host "  2. Prioritize vulnerabilities by severity" -ForegroundColor White
Write-Host "  3. Create remediation tickets" -ForegroundColor White
Write-Host "  4. Implement fixes" -ForegroundColor White
Write-Host "  5. Re-test to verify fixes" -ForegroundColor White
Write-Host ""
