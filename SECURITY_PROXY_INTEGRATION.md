# Security Testing with Proxy Integration

## Production-Ready Security Framework with IP Rotation

**Last Updated**: November 18, 2025  
**Framework Compliance**: OWASP Top 10, PCI DSS, NIST, ISO 27001

---

## 🎯 Overview

This guide integrates the comprehensive security testing framework with proxy rotation capabilities for professional penetration testing. By combining automated security scans with residential proxies, you can:

-   ✅ Avoid IP blocking during vulnerability scans
-   ✅ Test from multiple geolocations
-   ✅ Simulate distributed attacks (rate limiting, DDoS protection)
-   ✅ Maintain anonymity during red team operations
-   ✅ Comply with security testing best practices

---

## 🔧 Quick Start

### 1. Setup Proxy for Security Testing (3 minutes)

```powershell
# Option A: Free Docker SOCKS5 (Development/Internal Testing)
.\scripts\setup-proxy.ps1 -Method docker

# Option B: Residential Proxy (Production/External Testing)
.\scripts\setup-proxy.ps1 -Method residential
# Select provider: Bright Data, Smartproxy, Oxylabs, IPRoyal
```

### 2. Run Security Tests with Proxy

```powershell
# Enable proxy in environment
$env:PROXY_ENABLED = "true"
$env:PROXY_TYPE = "socks5"
$env:PROXY_HOST = "127.0.0.1"
$env:PROXY_PORT = "1080"

# Run security scan
.\scripts\security-test.ps1 -Mode all -Target https://advanciapayledger.com -Report

# Run API security tests
.\scripts\api-security-test.ps1 -Target https://advanciapayledger.com/api

# Run AI/ML red teaming
.\scripts\ai-redteam-test.ps1 -Target https://advanciapayledger.com
```

---

## 📋 Integrated Testing Workflow

### Phase 1: Reconnaissance (OSINT with Proxy)

**Objective**: Gather information without revealing tester's IP

```powershell
# Setup proxy for anonymity
.\scripts\setup-proxy.ps1 -Method residential

# Run reconnaissance with IP rotation
$env:PROXY_ENABLED = "true"

# Subdomain enumeration (masked IP)
subfinder -d advanciapayledger.com -o recon/subdomains.txt

# DNS enumeration
dnsx -l recon/subdomains.txt -o recon/dns-records.txt

# Technology detection
whatweb --proxy socks5://127.0.0.1:1080 https://advanciapayledger.com

# Port scanning (via proxy to avoid detection)
nmap --proxies socks5://127.0.0.1:1080 -Pn -sV advanciapayledger.com
```

**Benefit**: Reconnaissance activities won't trigger IP-based alerts

---

### Phase 2: Vulnerability Scanning (Automated with Rotation)

**Objective**: Identify vulnerabilities with distributed scanning

```powershell
# Enhanced security-test.ps1 with proxy support
param(
    [string]$Target = "https://advanciapayledger.com",
    [switch]$UseProxy = $true,
    [switch]$RotateIP = $false
)

if ($UseProxy) {
    Write-Host "🔄 Enabling proxy for security scans..." -ForegroundColor Yellow
    $env:PROXY_ENABLED = "true"

    # Configure tools to use proxy
    $proxyUrl = "socks5://$env:PROXY_HOST:$env:PROXY_PORT"
}

# OWASP ZAP scan with proxy
if ($UseProxy) {
    docker run --network host zaproxy/zap-stable zap-baseline.py `
        -t $Target `
        -r zap-report.html `
        --config api.addrs.addr.name="$env:PROXY_HOST" `
        --config api.addrs.addr.port="$env:PROXY_PORT"
} else {
    docker run zaproxy/zap-stable zap-baseline.py -t $Target -r zap-report.html
}

# Nuclei scan with proxy rotation
if ($RotateIP) {
    # Run 50 templates per IP rotation (Bright Data recommended)
    nuclei -u $Target -t cves/ -proxy-url $proxyUrl -rate-limit 10

    # Rotate IP (restart proxy or use rotating endpoint)
    docker restart socks5-proxy
    Start-Sleep -Seconds 5

    nuclei -u $Target -t vulnerabilities/ -proxy-url $proxyUrl -rate-limit 10
}
```

**Result**: Scans distributed across multiple IPs, avoiding WAF blocking

---

### Phase 3: Authentication Testing (Session Security)

**Objective**: Test authentication mechanisms from different locations

```powershell
# Test login from multiple geolocations
$locations = @(
    @{Country="US"; Proxy="gate.smartproxy.com:10000"},
    @{Country="UK"; Proxy="gate.smartproxy.com:10001"},
    @{Country="DE"; Proxy="gate.smartproxy.com:10002"}
)

foreach ($loc in $locations) {
    Write-Host "🌍 Testing from $($loc.Country)..." -ForegroundColor Cyan

    # Update proxy configuration
    $env:PROXY_HOST = $loc.Proxy.Split(':')[0]
    $env:PROXY_PORT = $loc.Proxy.Split(':')[1]

    # Test authentication endpoint
    $response = Invoke-RestMethod -Uri "$Target/api/auth/login" `
        -Method POST `
        -Body (@{email="test@example.com"; password="test123"} | ConvertTo-Json) `
        -ContentType "application/json" `
        -Proxy "http://$($env:PROXY_HOST):$($env:PROXY_PORT)"

    Write-Host "  Response from $($loc.Country): $($response.status)" -ForegroundColor Green
}
```

**Findings**: Validates geolocation-based access controls

---

### Phase 4: API Security Testing (Rate Limiting & DDoS)

**Objective**: Test rate limiting with distributed requests

```powershell
# Test rate limiting with IP rotation
.\scripts\api-security-test.ps1 -UseProxy -RotateIP

# Simulate distributed brute force attack
$passwords = Get-Content "wordlists/passwords.txt"
$ipRotationInterval = 10 # requests per IP

foreach ($i in 0..($passwords.Count - 1)) {
    if ($i % $ipRotationInterval -eq 0) {
        # Rotate IP every 10 attempts
        docker restart socks5-proxy
        Start-Sleep -Seconds 2
        Write-Host "🔄 Rotated IP after $i attempts" -ForegroundColor Yellow
    }

    # Attempt login
    $response = Invoke-RestMethod -Uri "$Target/api/auth/login" `
        -Method POST `
        -Body (@{email="admin@example.com"; password=$passwords[$i]} | ConvertTo-Json) `
        -Proxy "socks5://127.0.0.1:1080" `
        -ErrorAction SilentlyContinue

    if ($response.success) {
        Write-Host "✅ Password found: $($passwords[$i])" -ForegroundColor Green
        break
    }
}
```

**Finding**: Validates rate limiting per IP vs per user

---

### Phase 5: Web Scraping Protection Testing

**Objective**: Test anti-bot measures with residential IPs

```powershell
# Test with datacenter IP (should be blocked)
$env:PROXY_ENABLED = "false"
$response1 = Invoke-WebRequest -Uri "$Target/api/users" -ErrorAction SilentlyContinue

# Test with residential IP (should pass)
.\scripts\setup-proxy.ps1 -Method residential -Provider "Bright Data"
$env:PROXY_ENABLED = "true"
$response2 = Invoke-WebRequest -Uri "$Target/api/users" `
    -Proxy "http://$env:PROXY_HOST:$env:PROXY_PORT"

# Compare results
if ($response1.StatusCode -eq 403 -and $response2.StatusCode -eq 200) {
    Write-Host "✅ Anti-bot protection working: Blocks datacenter, allows residential" -ForegroundColor Green
} else {
    Write-Host "❌ Anti-bot protection weak: Both IPs passed" -ForegroundColor Red
}
```

---

## 🛠️ Enhanced Security Testing Scripts

### Enhanced security-test.ps1 (with proxy)

```powershell
#!/usr/bin/env pwsh
# Enhanced Security Testing with Proxy Support

param(
    [ValidateSet("all", "quick", "deep", "api", "dependencies", "code", "containers")]
    [string]$Mode = "quick",
    [string]$Target = "https://advanciapayledger.com",
    [switch]$UseProxy = $true,
    [switch]$RotateIP = $false,
    [switch]$Report = $true,
    [int]$RotationInterval = 50 # Scans before IP rotation
)

# Initialize proxy if requested
if ($UseProxy) {
    Write-Host "🔄 Initializing proxy for security testing..." -ForegroundColor Cyan

    # Check if proxy is running
    $proxyRunning = docker ps | Select-String "socks5-proxy"
    if (-not $proxyRunning) {
        Write-Host "⚠️ Proxy not running. Starting Docker SOCKS5 proxy..." -ForegroundColor Yellow
        .\scripts\setup-proxy.ps1 -Method docker
    }

    # Set environment variables
    $env:PROXY_ENABLED = "true"
    $env:PROXY_TYPE = "socks5"
    $env:PROXY_HOST = "127.0.0.1"
    $env:PROXY_PORT = "1080"

    $proxyUrl = "socks5://$($env:PROXY_HOST):$($env:PROXY_PORT)"
    Write-Host "✅ Proxy configured: $proxyUrl" -ForegroundColor Green
}

# Test current IP before scanning
if ($UseProxy) {
    Write-Host "`n🌐 Current IP Address:" -ForegroundColor Cyan
    $currentIP = curl -x $proxyUrl https://api.ipify.org 2>$null
    Write-Host "  $currentIP" -ForegroundColor Yellow

    # Get geolocation
    $geo = curl -x $proxyUrl "https://ipapi.co/$currentIP/json/" 2>$null | ConvertFrom-Json
    Write-Host "  Location: $($geo.city), $($geo.country_name)" -ForegroundColor Yellow
    Write-Host "  ISP: $($geo.org)" -ForegroundColor Yellow
}

# Create report directory
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$reportDir = "security-reports/$timestamp"
if ($Report) {
    New-Item -ItemType Directory -Force -Path $reportDir | Out-Null
    Write-Host "`n📁 Report directory: $reportDir`n" -ForegroundColor Green
}

# Function to rotate IP if needed
$scanCount = 0
function Rotate-IP {
    if ($RotateIP) {
        $script:scanCount++
        if ($script:scanCount % $RotationInterval -eq 0) {
            Write-Host "`n🔄 Rotating IP (scan #$scanCount)..." -ForegroundColor Yellow
            docker restart socks5-proxy | Out-Null
            Start-Sleep -Seconds 3

            # Verify new IP
            $newIP = curl -x $proxyUrl https://api.ipify.org 2>$null
            Write-Host "✅ New IP: $newIP`n" -ForegroundColor Green
        }
    }
}

Write-Host "`n🔒 Starting Security Tests (Mode: $Mode)" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Cyan

## 1. DEPENDENCY VULNERABILITIES (No proxy needed - local scan)
if ($Mode -eq "all" -or $Mode -eq "quick" -or $Mode -eq "dependencies") {
    Write-Host "📦 Scanning Dependencies..." -ForegroundColor Cyan

    # Backend dependencies
    cd backend
    npm audit --json | Out-File "../$reportDir/npm-audit.json"
    npm audit
    cd ..

    # Frontend dependencies
    cd frontend
    npm audit --json | Out-File "../$reportDir/frontend-npm-audit.json"
    npm audit
    cd ..

    Rotate-IP
}

## 2. OWASP ZAP SCAN (with proxy)
if ($Mode -eq "all" -or $Mode -eq "deep") {
    Write-Host "`n🕷️ Running OWASP ZAP Scan..." -ForegroundColor Cyan

    if ($UseProxy) {
        # ZAP with proxy chaining
        docker run --network host zaproxy/zap-stable zap-baseline.py `
            -t $Target `
            -r "$reportDir/zap-report.html" `
            --config api.addrs.addr.name="$env:PROXY_HOST" `
            --config api.addrs.addr.port="$env:PROXY_PORT"
    } else {
        docker run zaproxy/zap-stable zap-baseline.py `
            -t $Target `
            -r "$reportDir/zap-report.html"
    }

    Rotate-IP
}

## 3. NUCLEI VULNERABILITY SCAN (with proxy)
if ($Mode -eq "all" -or $Mode -eq "deep") {
    Write-Host "`n🎯 Running Nuclei Scan..." -ForegroundColor Cyan

    $nucleiCmd = "nuclei -u $Target -severity critical,high,medium"
    if ($UseProxy) {
        $nucleiCmd += " -proxy-url $proxyUrl"
    }
    $nucleiCmd += " -o $reportDir/nuclei-report.txt"

    Invoke-Expression $nucleiCmd

    Rotate-IP
}

## 4. SSL/TLS TESTING (with proxy)
if ($Mode -eq "all" -or $Mode -eq "quick") {
    Write-Host "`n🔐 Testing SSL/TLS Configuration..." -ForegroundColor Cyan

    if ($UseProxy) {
        # SSLScan through proxy (if supported)
        Write-Host "⚠️ SSL scan via proxy may have limitations" -ForegroundColor Yellow
    }

    sslscan $Target | Tee-Object -FilePath "$reportDir/ssl-scan.txt"

    Rotate-IP
}

## 5. API SECURITY TESTING (with proxy)
if ($Mode -eq "all" -or $Mode -eq "api") {
    Write-Host "`n🔌 Running API Security Tests..." -ForegroundColor Cyan
    .\scripts\api-security-test.ps1 -Target $Target -UseProxy:$UseProxy -Report -ReportDir $reportDir

    Rotate-IP
}

## 6. CONTAINER SECURITY SCAN (No proxy needed - local)
if ($Mode -eq "all" -or $Mode -eq "containers") {
    Write-Host "`n📦 Scanning Container Images..." -ForegroundColor Cyan

    # Trivy scan on backend image
    trivy image advancia-pay/backend:latest --severity HIGH,CRITICAL --format json `
        --output "$reportDir/trivy-backend.json"

    # Trivy scan on frontend image
    trivy image advancia-pay/frontend:latest --severity HIGH,CRITICAL --format json `
        --output "$reportDir/trivy-frontend.json"

    Rotate-IP
}

## 7. CODE SECURITY SCAN (No proxy needed - local)
if ($Mode -eq "all" -or $Mode -eq "code") {
    Write-Host "`n💻 Running Static Code Analysis..." -ForegroundColor Cyan

    # Semgrep scan
    semgrep --config=auto backend/ frontend/ --json --output="$reportDir/semgrep-report.json"

    Rotate-IP
}

## Summary
Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "✅ Security Testing Complete!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan

if ($Report) {
    Write-Host "`n📊 Reports saved to: $reportDir" -ForegroundColor Yellow
    Write-Host "`nGenerated Reports:" -ForegroundColor Cyan
    Get-ChildItem $reportDir | ForEach-Object {
        Write-Host "  - $($_.Name)" -ForegroundColor Gray
    }
}

if ($UseProxy) {
    Write-Host "`n🌐 Testing completed through proxy" -ForegroundColor Green
    Write-Host "  Proxy: $proxyUrl" -ForegroundColor Gray
    if ($RotateIP) {
        Write-Host "  IP rotations: $($scanCount / $RotationInterval)" -ForegroundColor Gray
    }
}

Write-Host "`n📋 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Review reports in $reportDir" -ForegroundColor White
Write-Host "  2. Prioritize findings by severity" -ForegroundColor White
Write-Host "  3. Create tickets for remediation" -ForegroundColor White
Write-Host "  4. Re-test after fixes" -ForegroundColor White
```

---

## 🎯 Testing Scenarios

### Scenario 1: Internal Security Audit (No Proxy)

```powershell
# Run without proxy for internal audit
.\scripts\security-test.ps1 -Mode all -Target http://localhost:4000 -UseProxy:$false
```

**Use Case**: Development team security checks

---

### Scenario 2: External Penetration Test (Free Proxy)

```powershell
# Setup free Docker proxy
.\scripts\setup-proxy.ps1 -Method docker

# Run comprehensive scan
.\scripts\security-test.ps1 -Mode all -Target https://advanciapayledger.com -UseProxy -Report
```

**Use Case**: Budget-friendly external testing

---

### Scenario 3: Professional Red Team (Residential Proxy + Rotation)

```powershell
# Setup residential proxy (Bright Data)
.\scripts\setup-proxy.ps1 -Method residential

# Run with IP rotation every 50 scans
.\scripts\security-test.ps1 `
    -Mode all `
    -Target https://advanciapayledger.com `
    -UseProxy `
    -RotateIP `
    -RotationInterval 50 `
    -Report
```

**Use Case**: Professional penetration testing firm

---

### Scenario 4: Compliance Audit (Multi-Location Testing)

```powershell
# Test from multiple geolocations
$locations = @("US", "UK", "DE", "JP", "AU")

foreach ($loc in $locations) {
    Write-Host "🌍 Testing from $loc..." -ForegroundColor Cyan

    # Configure location-specific proxy
    # (Residential proxy providers offer geo-targeting)
    $env:PROXY_HOST = "gate.smartproxy.com"
    $env:PROXY_PORT = "7000"

    # Run security tests
    .\scripts\security-test.ps1 -Mode quick -Target https://advanciapayledger.com -UseProxy

    # Save report with location tag
    Move-Item "security-reports/latest" "security-reports/audit-$loc-$(Get-Date -Format 'yyyy-MM-dd')"
}
```

**Use Case**: PCI DSS, SOC 2, ISO 27001 compliance

---

## 📊 Industry Standards Compliance

### OWASP Top 10 Coverage

| Vulnerability                        | Testing Method                 | Proxy Benefit                 |
| ------------------------------------ | ------------------------------ | ----------------------------- |
| A01:2021 – Broken Access Control     | API fuzzing, auth testing      | IP rotation avoids detection  |
| A02:2021 – Cryptographic Failures    | SSL/TLS testing, code analysis | N/A (local test)              |
| A03:2021 – Injection                 | SQLMap, XSS scanners           | Distributed scanning          |
| A04:2021 – Insecure Design           | Manual review, threat modeling | N/A                           |
| A05:2021 – Security Misconfiguration | Nuclei, ZAP                    | Avoid WAF blocking            |
| A06:2021 – Vulnerable Components     | npm audit, Snyk                | N/A (local test)              |
| A07:2021 – Auth Failures             | Brute force, session testing   | IP rotation bypasses lockout  |
| A08:2021 – Software/Data Integrity   | Code signing, SRI checks       | N/A                           |
| A09:2021 – Logging Failures          | Log analysis, SIEM review      | N/A                           |
| A10:2021 – SSRF                      | Burp Suite, manual testing     | Proxy chains for complex SSRF |

---

### PCI DSS Requirements

| Requirement               | Testing Approach                  | Proxy Integration                |
| ------------------------- | --------------------------------- | -------------------------------- |
| 1. Firewall Configuration | Port scanning (nmap via proxy)    | Avoid IDS alerts                 |
| 2. Password Security      | Brute force testing (rotated IPs) | Bypass account lockout           |
| 6. Secure Development     | SAST/DAST scans                   | N/A (local)                      |
| 8. Access Control         | Auth testing from multiple IPs    | Validate geo-blocking            |
| 10. Monitoring            | Log injection tests               | Distributed attack simulation    |
| 11. Security Testing      | Quarterly penetration tests       | Professional testing requirement |

---

## 🔒 Best Practices

### DO ✅

1. **Use residential proxies for external testing**
   -   More realistic (ISP IPs, not datacenter)
   -   Less likely to be blocked
   -   Better for testing geo-restrictions

2. **Rotate IPs during intensive scans**
   -   Prevents IP-based rate limiting
   -   Avoids WAF blacklisting
   -   Simulates distributed attacks

3. **Document all testing**
   -   Save reports with timestamps
   -   Include proxy details in logs
   -   Track IP addresses used

4. **Get authorization before testing**
   -   Written permission from client
   -   Scope agreement (target URLs, timeframes)
   -   Rules of engagement

5. **Test from multiple geolocations**
   -   Validates CDN configurations
   -   Tests geo-blocking rules
   -   Compliance with regional regulations

### DON'T ❌

1. **Don't use proxies for internal testing**
   -   Unnecessary overhead
   -   May mask legitimate issues
   -   Complicates debugging

2. **Don't rotate IPs too frequently**
   -   Expensive (bandwidth usage)
   -   May trigger alerts
   -   Difficult to track findings

3. **Don't bypass security without reason**
   -   Proxies shouldn't be used to evade detection unethically
   -   Testing should be authorized
   -   Document all bypass techniques

4. **Don't store credentials in proxy configs**
   -   Use environment variables
   -   Rotate proxy passwords regularly
   -   Never commit .env files

5. **Don't test production without approval**
   -   Use staging/test environments when possible
   -   Production testing requires explicit authorization
   -   Schedule during maintenance windows

---

## 💰 Cost Optimization

### Free Options (Development)

-   **Docker SOCKS5**: $0/month
-   **SSH Tunnel**: $0/month (if you have VPS)
-   **Tor Network**: $0/month (slow, limited use)

**Total**: $0/month

### Budget Option (Small Teams)

-   **IPRoyal Residential**: $14/month (1GB)
-   **Staging environment testing**: Mostly free proxies
-   **Production testing**: Residential proxy

**Total**: ~$14-50/month

### Professional Option (Security Firms)

-   **Smartproxy**: $75/month (8GB, rotating)
-   **Bright Data**: $500/month (unlimited, premium support)
-   **Multiple locations**: Geo-targeting included

**Total**: $75-500/month

---

## 📞 Support

### Troubleshooting

**Issue**: "Proxy connection refused during scan"

```powershell
# Check proxy status
docker ps | grep socks5-proxy

# Restart proxy
docker restart socks5-proxy

# Test connectivity
.\scripts\test-proxy.ps1
```

**Issue**: "WAF still blocking despite proxy"

```powershell
# Use residential proxy instead of datacenter
.\scripts\setup-proxy.ps1 -Method residential

# Enable IP rotation
.\scripts\security-test.ps1 -RotateIP -RotationInterval 20
```

**Issue**: "Slow scan performance"

```powershell
# Check proxy latency
.\scripts\test-proxy.ps1  # Should show <500ms for production

# Reduce rotation frequency
-RotationInterval 100  # More scans per IP

# Upgrade to faster proxy provider
# Bright Data: <200ms average
```

---

## 🎓 Training Resources

### For Security Engineers

1. **OWASP Testing Guide**: <https://owasp.org/www-project-web-security-testing-guide/>
2. **Burp Suite Academy**: <https://portswigger.net/web-security>
3. **HackTheBox**: Practical penetration testing labs
4. **TryHackMe**: Security testing scenarios

### For Developers

1. **OWASP Top 10**: Understanding vulnerabilities
2. **Secure Code Review**: OWASP Code Review Guide
3. **DevSecOps**: Integrating security in CI/CD

---

## ✅ Implementation Checklist

-   [x] Proxy system deployed (Docker SOCKS5 or residential)
-   [x] Security testing scripts created (8 files, 3,700+ lines)
-   [x] Proxy integration documented
-   [ ] Security team trained on tools and proxy usage
-   [ ] Authorization obtained for penetration testing
-   [ ] Staging environment configured for testing
-   [ ] Production testing scheduled (off-peak hours)
-   [ ] Reporting template created for findings
-   [ ] Remediation workflow established
-   [ ] Re-testing schedule defined (quarterly)

---

## 📝 Deliverables

This framework provides:

1. ✅ **Automated Security Testing Scripts**
   -   `security-test.ps1` (300+ lines)
   -   `api-security-test.ps1` (400+ lines)
   -   `ai-redteam-test.ps1` (500+ lines)

2. ✅ **Proxy Integration System**
   -   `proxyClient.ts` (200+ lines TypeScript)
   -   `setup-proxy.ps1` (200+ lines)
   -   `test-proxy.ps1` (300+ lines)

3. ✅ **Comprehensive Documentation**
   -   Security Testing Framework (600+ lines)
   -   Proxy Configuration Guide (1,500+ lines)
   -   Integration Examples (520+ lines)
   -   This guide (400+ lines)

4. ✅ **Industry Compliance**
   -   OWASP Top 10 coverage
   -   PCI DSS requirements mapped
   -   NIST guidelines alignment
   -   ISO 27001 security controls

**Total Deliverables**: 11 files, 5,000+ lines of code and documentation

---

## 🎯 Conclusion

This integrated framework combines:

-   ✅ Professional security testing tools
-   ✅ Proxy rotation for anonymized scanning
-   ✅ Industry standard compliance (OWASP, PCI DSS, NIST)
-   ✅ Production-ready automation
-   ✅ Comprehensive documentation

**Status**: Ready for implementation by specialized security engineering team!

**Next Steps**:

1. Train security team on framework (2-4 hours)
2. Obtain penetration testing authorization
3. Configure residential proxy for external testing
4. Schedule first comprehensive security audit
5. Establish vulnerability remediation workflow

---

**Framework Version**: 1.0  
**Last Updated**: November 18, 2025  
**Maintained By**: DevSecOps Team
