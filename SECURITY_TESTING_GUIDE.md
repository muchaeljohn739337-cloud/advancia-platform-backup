# Security Testing Execution Guide

## Quick Start

This guide provides step-by-step instructions for executing comprehensive security tests on the Advancia Pay Ledger platform using the automated testing scripts.

---

## Prerequisites

### Required Tools

```powershell
# Check if tools are installed
winget install -e --id Postman.Postman
winget install -e --id Docker.DockerDesktop
choco install nmap
choco install nuclei
choco install trivy
npm install -g snyk
npm install -g @eslint/eslintrc eslint-plugin-security
```

### Optional Tools (Professional Pentest)

- **Burp Suite Professional**: $449/year - https://portswigger.net/burp/pro
- **OWASP ZAP Pro**: Free - https://www.zaproxy.org/
- **Nessus Professional**: $4,990/year - https://www.tenable.com/products/nessus
- **Metasploit Pro**: $15,000/year - https://www.metasploit.com/

---

## Testing Scripts Overview

| Script                  | Purpose                     | Duration  | Skill Level  |
| ----------------------- | --------------------------- | --------- | ------------ |
| `security-test.ps1`     | Comprehensive security scan | 5-45 min  | Intermediate |
| `api-security-test.ps1` | API vulnerability testing   | 10-15 min | Beginner     |
| `ai-redteam-test.ps1`   | AI/ML security testing      | 15-20 min | Advanced     |

---

## 1. Quick Security Scan (5 minutes)

**Best for:** Daily checks, CI/CD integration

```powershell
# Navigate to project root
cd c:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform

# Run quick scan
.\scripts\security-test.ps1 -Mode quick -Target https://advanciapayledger.com

# Or for local testing
.\scripts\security-test.ps1 -Mode quick -Target http://localhost:4000
```

**What it checks:**

- ✅ Security headers (HSTS, CSP, X-Frame-Options)
- ✅ SSL/TLS configuration
- ✅ CORS policy
- ✅ Basic vulnerability scan

**Expected output:**

```
🔒 Advancia Pay Security Testing Suite
============================================================

📋 Checking Security Headers...
✅ Strict-Transport-Security : max-age=31536000
✅ X-Content-Type-Options : nosniff
✅ X-Frame-Options : DENY
❌ Content-Security-Policy : MISSING

✅ Security testing completed!
```

---

## 2. API Security Testing (15 minutes)

**Best for:** After API changes, weekly testing

```powershell
# Test production API
.\scripts\api-security-test.ps1 -BaseUrl https://advanciapayledger.com/api

# Test local development
.\scripts\api-security-test.ps1 -BaseUrl http://localhost:4000/api -Verbose

# Test with authentication
$token = "your-jwt-token-here"
.\scripts\api-security-test.ps1 -BaseUrl http://localhost:4000/api -AuthToken $token
```

**Test categories:**

1. 🔑 Authentication & Authorization (10 tests)
2. 💉 SQL/NoSQL Injection (5 tests)
3. 🎭 Cross-Site Scripting (XSS) (5 tests)
4. ⏱️ Rate Limiting (20 rapid requests)
5. 📋 Security Headers (5 headers)
6. 🌐 CORS Configuration (3 origins)
7. 🎫 JWT Token Security (4 invalid tokens)
8. 📁 File Upload Security (manual)
9. 🔢 API Enumeration (6 tests)
10. 💼 Business Logic (2 tests)

**Expected output:**

```
📊 TEST SUMMARY
============================================================

✅ Passed : 42
❌ Failed : 3
⚠️ Warnings: 1
📈 Pass Rate: 90.91%

🎯 Security Posture: EXCELLENT
```

**What to do with failures:**

```powershell
# If rate limiting fails
# Add to backend/src/index.ts:
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, # 15 minutes
  max: 100 # limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

# If security headers missing
# Add to backend/src/middleware/security.ts:
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

---

## 3. AI/ML Red Teaming (20 minutes)

**Best for:** Before AI feature releases, monthly testing

```powershell
# Test AI endpoints
.\scripts\ai-redteam-test.ps1 -ApiUrl http://localhost:4000/api/ai

# Test with authentication
.\scripts\ai-redteam-test.ps1 -ApiUrl http://localhost:4000/api/ai -AuthToken $token -Verbose
```

**Test categories:**

1. 💉 Prompt Injection (6 tests)
2. 🔓 Jailbreak Attempts (5 tests)
3. 🔒 Data Leakage (5 tests)
4. ☠️ Model Poisoning (3 tests)
5. 🎯 Adversarial Inputs (5 tests)
6. 💼 Business Logic Bypass (4 tests)
7. 🎭 Social Engineering (4 tests)

**Expected output:**

```
📊 TEST SUMMARY
============================================================

✅ Passed : 28 / 32
❌ Failed : 4 / 32
⚠️ Errors : 0 / 32

📈 Pass Rate: 87.5%

📋 Failed Tests by Category:
   Prompt Injection: 2 failures
   Jailbreak: 1 failure
   Data Leakage: 1 failure

🎯 Security Recommendations:
   1. Implement prompt filtering and sanitization
   2. Add context-aware content filtering
   ...

💾 Detailed report saved to: ai-redteam-report-20240115-143022.json
```

**Implementing AI safety guardrails:**

```typescript
// backend/src/middleware/aiSafety.ts
import { Configuration, OpenAIApi } from "openai";

const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  })
);

export async function moderateContent(prompt: string): Promise<boolean> {
  const moderation = await openai.createModeration({
    input: prompt,
  });

  const flagged = moderation.data.results[0].flagged;
  if (flagged) {
    console.warn(
      "Prompt flagged by OpenAI Moderation:",
      moderation.data.results[0].categories
    );
  }

  return !flagged;
}

// Prompt injection detection
const dangerousPatterns = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /system\s*prompt/i,
  /you\s+are\s+now/i,
  /developer\s+mode/i,
  /###\s*system\s*###/i,
];

export function detectPromptInjection(prompt: string): boolean {
  return dangerousPatterns.some((pattern) => pattern.test(prompt));
}
```

---

## 4. Comprehensive Deep Scan (45 minutes)

**Best for:** Before production deployment, monthly security audit

```powershell
# Full security assessment with reports
.\scripts\security-test.ps1 -Mode deep -Target https://advanciapayledger.com -Report

# This will run:
# - OWASP ZAP baseline scan (15 min)
# - Nuclei vulnerability scan (10 min)
# - Dependency audits (5 min)
# - Container security scan (10 min)
# - Code analysis (5 min)
```

**Output structure:**

```
security-reports/
└── 2024-01-15_14-30-22/
    ├── npm-audit-backend.json
    ├── npm-audit-frontend.json
    ├── snyk-report.json
    ├── eslint-security.txt
    ├── semgrep-report.json
    ├── docker-scout-backend.txt
    ├── trivy-backend.txt
    └── zap-baseline.json
```

---

## 5. Manual Penetration Testing Checklist

### Authentication & Session Management

- [ ] Test password strength requirements
- [ ] Test account lockout mechanism
- [ ] Test password reset flow
- [ ] Test session timeout
- [ ] Test concurrent sessions
- [ ] Test "Remember Me" functionality
- [ ] Test logout functionality
- [ ] Test JWT token expiration
- [ ] Test refresh token rotation

**Commands:**

```powershell
# Test weak passwords
Invoke-WebRequest -Uri http://localhost:4000/api/auth/register -Method POST -Body '{"email":"test@test.com","password":"123","name":"Test"}' -ContentType "application/json"

# Test session timeout
$token = "your-token"
Start-Sleep -Seconds 3600  # Wait 1 hour
Invoke-WebRequest -Uri http://localhost:4000/api/users/profile -Headers @{"Authorization"="Bearer $token"}
```

### Authorization & Access Control

- [ ] Test horizontal privilege escalation (user A accessing user B's data)
- [ ] Test vertical privilege escalation (user accessing admin endpoints)
- [ ] Test direct object references (guessing IDs)
- [ ] Test missing function level access control
- [ ] Test API key permissions

**Commands:**

```powershell
# Test horizontal escalation
$userAToken = "user-a-token"
Invoke-WebRequest -Uri http://localhost:4000/api/users/456/transactions -Headers @{"Authorization"="Bearer $userAToken"}

# Test vertical escalation
$userToken = "regular-user-token"
Invoke-WebRequest -Uri http://localhost:4000/api/admin/users -Headers @{"Authorization"="Bearer $userToken"}
```

### Input Validation

- [ ] Test SQL injection (all input fields)
- [ ] Test NoSQL injection
- [ ] Test XSS (reflected, stored, DOM-based)
- [ ] Test command injection
- [ ] Test XML/XXE injection
- [ ] Test LDAP injection
- [ ] Test template injection

**SQL Injection Payloads:**

```sql
' OR '1'='1
admin'--
' UNION SELECT NULL,NULL,NULL--
1' AND '1'='1
'; DROP TABLE users;--
```

**XSS Payloads:**

```html
<script>
  alert("XSS");
</script>
<img src="x" onerror="alert(1)" />
<svg onload="alert(1)">
  javascript:alert(1)
  <iframe src="javascript:alert(1)"></iframe>
</svg>
```

### Business Logic Testing

- [ ] Test negative transaction amounts
- [ ] Test decimal/rounding errors
- [ ] Test race conditions (concurrent requests)
- [ ] Test workflow bypass
- [ ] Test rate limiting
- [ ] Test transaction limits

**Race condition test:**

```powershell
# Send 10 concurrent withdrawal requests
1..10 | ForEach-Object -Parallel {
    Invoke-WebRequest -Uri http://localhost:4000/api/transactions/withdraw -Method POST -Headers @{"Authorization"="Bearer $using:token"} -Body '{"amount":1000}' -ContentType "application/json"
}
```

---

## 6. Continuous Security Testing (CI/CD Integration)

### GitHub Actions Workflow

Create `.github/workflows/security-scan.yml`:

```yaml
name: Security Scan

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]
  schedule:
    - cron: "0 2 * * *" # Daily at 2 AM

jobs:
  security-scan:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Run Snyk Security Scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

      - name: Run npm audit
        run: |
          cd backend && npm audit --production
          cd ../frontend && npm audit --production

      - name: Run Semgrep SAST
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/owasp-top-ten

      - name: Run Trivy Container Scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: advancia-pay/backend:latest
          severity: "HIGH,CRITICAL"

      - name: Run API Security Tests
        run: |
          npm install -g newman
          newman run tests/security/api-security-tests.json
```

---

## 7. Security Testing Schedule

### Daily (Automated)

- ✅ Dependency vulnerability scans (npm audit, Snyk)
- ✅ Code quality checks (ESLint Security)
- ✅ Container image scanning (Trivy)

### Weekly (Automated + Manual)

- ✅ API security testing (full suite)
- ✅ SAST scanning (Semgrep, SonarQube)
- ✅ Security header validation
- 👤 Manual authentication testing

### Monthly (Manual)

- 👤 AI/ML red teaming
- 👤 Business logic testing
- 👤 Mobile app security testing
- 👤 Infrastructure penetration testing

### Quarterly (Professional)

- 💼 External penetration test ($15K-$30K)
- 💼 Code review by security experts
- 💼 Red team exercise
- 💼 Compliance audit (PCI DSS, SOC 2)

### Annual (Comprehensive)

- 💼 Third-party security audit ($25K-$50K)
- 💼 Disaster recovery test
- 💼 Security awareness training update
- 💼 Incident response drill

---

## 8. Interpreting Results

### Critical (Fix Immediately)

- ❌ SQL injection vulnerabilities
- ❌ Authentication bypass
- ❌ Arbitrary file upload
- ❌ Remote code execution
- ❌ Sensitive data exposure

### High (Fix within 7 days)

- ⚠️ XSS vulnerabilities
- ⚠️ CSRF vulnerabilities
- ⚠️ Broken access control
- ⚠️ Security misconfiguration
- ⚠️ Weak cryptography

### Medium (Fix within 30 days)

- 🟡 Missing security headers
- 🟡 Information disclosure
- 🟡 Insufficient logging
- 🟡 Vulnerable dependencies (moderate severity)

### Low (Fix within 90 days)

- 🔵 Missing best practices
- 🔵 Low-severity vulnerabilities
- 🔵 Code quality issues

---

## 9. Remediation Tracking

Use GitHub Issues with labels:

```bash
# Create security issue template
cat > .github/ISSUE_TEMPLATE/security-vulnerability.md << 'EOF'
---
name: Security Vulnerability
about: Report a security vulnerability found during testing
labels: security, bug
assignees: security-team

---

## Vulnerability Details

**Severity:** [Critical/High/Medium/Low]
**Type:** [SQL Injection/XSS/Authentication/etc.]
**Affected Component:** [API endpoint/Frontend page/etc.]

## Description

[Detailed description of the vulnerability]

## Steps to Reproduce

1. [Step 1]
2. [Step 2]
3. [Step 3]

## Impact

[What could an attacker do with this vulnerability?]

## Remediation

[Recommended fix or mitigation]

## References

- [Link to OWASP page]
- [Link to CWE]
- [Link to test report]
EOF
```

---

## 10. Emergency Response

If a **CRITICAL** vulnerability is found:

1. **Immediate Actions (within 1 hour):**

   ```powershell
   # Take affected service offline
   kubectl scale deployment/backend --replicas=0 -n advancia-pay

   # Enable maintenance mode
   curl -X POST https://advanciapayledger.com/api/admin/maintenance -H "Authorization: Bearer $ADMIN_TOKEN" -d '{"enabled":true}'
   ```

2. **Incident Response (within 4 hours):**

   - Notify security team
   - Document vulnerability details
   - Develop and test patch
   - Review logs for exploitation attempts
   - Prepare disclosure statement

3. **Deployment (within 24 hours):**

   ```powershell
   # Deploy hotfix
   git checkout -b hotfix/critical-security-fix
   # Make fixes
   git commit -m "fix: Critical security vulnerability [SECURITY]"
   git push origin hotfix/critical-security-fix

   # Emergency deployment
   kubectl set image deployment/backend backend=registry.digitalocean.com/advancia-pay/backend:hotfix-v1.0.1 -n advancia-pay
   ```

4. **Post-Incident (within 1 week):**
   - Conduct post-mortem
   - Update security documentation
   - Improve detection capabilities
   - User communication (if required)

---

## 11. Resources

### Internal Documentation

- [SECURITY_TESTING_FRAMEWORK.md](./SECURITY_TESTING_FRAMEWORK.md) - Complete framework
- [API_TESTING_GUIDE.md](./API_TESTING_GUIDE.md) - API test procedures
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Secure deployment practices

### External Resources

- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **OWASP API Security**: https://owasp.org/API-Security/
- **CWE Top 25**: https://cwe.mitre.org/top25/
- **NIST Cybersecurity Framework**: https://www.nist.gov/cyberframework
- **PCI DSS Requirements**: https://www.pcisecuritystandards.org/

### Training

- **PortSwigger Web Security Academy**: https://portswigger.net/web-security (Free)
- **OWASP WebGoat**: https://owasp.org/www-project-webgoat/ (Free)
- **HackTheBox**: https://www.hackthebox.com/ ($20/month)
- **TryHackMe**: https://tryhackme.com/ ($11/month)

---

## Support

For security questions or to report vulnerabilities:

- **Email**: security@advanciapayledger.com
- **Bug Bounty**: https://hackerone.com/advancia-pay
- **Emergency**: Use PagerDuty incident escalation

**Note:** Never discuss security vulnerabilities in public channels (GitHub issues, Slack, etc.)
