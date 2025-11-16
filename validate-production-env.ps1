<#
.SYNOPSIS
    Validate production environment configuration

.DESCRIPTION
    Checks if all required environment variables are set and valid
    for production deployment. Helps catch configuration issues before deployment.

.EXAMPLE
    .\validate-production-env.ps1

.NOTES
    Run this script before deploying to production
#>

$ErrorActionPreference = "Stop"

# Colors
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Error { Write-Host $args -ForegroundColor Red }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Info { Write-Host $args -ForegroundColor Cyan }

Write-Host @"

╔═══════════════════════════════════════════════════╗
║   PRODUCTION ENVIRONMENT VALIDATION              ║
╚═══════════════════════════════════════════════════╝

"@ -ForegroundColor Magenta

$validationErrors = @()
$validationWarnings = @()
$validationSuccess = 0

# Check if .env.production files exist
Write-Info "`n[1/3] Checking environment files..."

$backendEnvFile = "backend\.env.production"
$frontendEnvFile = "frontend\.env.production"

if (-not (Test-Path $backendEnvFile)) {
    $validationErrors += "Backend .env.production file not found"
    Write-Error "❌ Backend .env.production not found"
} else {
    Write-Success "✓ Backend .env.production found"
    $validationSuccess++
}

if (-not (Test-Path $frontendEnvFile)) {
    $validationErrors += "Frontend .env.production file not found"
    Write-Error "❌ Frontend .env.production not found"
} else {
    Write-Success "✓ Frontend .env.production found"
    $validationSuccess++
}

if ($validationErrors.Count -gt 0) {
    Write-Error "`nCannot proceed without environment files. Run setup first."
    exit 1
}

# Parse backend environment file
Write-Info "`n[2/3] Validating backend environment variables..."

$backendEnv = @{}
Get-Content $backendEnvFile | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$' -and -not $_.StartsWith('#')) {
        $backendEnv[$matches[1].Trim()] = $matches[2].Trim()
    }
}

# Required backend variables
$requiredBackend = @{
    'NODE_ENV' = 'production'
    'PORT' = '\d+'
    'DATABASE_URL' = 'postgresql://'
    'JWT_SECRET' = '.{32,}'
    'SESSION_SECRET' = '.{32,}'
    'FRONTEND_URL' = 'https?://'
}

# Check required variables
foreach ($var in $requiredBackend.Keys) {
    $pattern = $requiredBackend[$var]
    
    if (-not $backendEnv.ContainsKey($var)) {
        $validationErrors += "Missing required variable: $var"
        Write-Error "❌ Missing: $var"
    } elseif ($backendEnv[$var] -match $pattern) {
        # Check for placeholder values
        if ($backendEnv[$var] -match 'CHANGE_THIS|YOUR_|your-|example\.com') {
            $validationWarnings += "$var has placeholder value"
            Write-Warning "⚠️  $var has placeholder value"
        } else {
            Write-Success "✓ $var is configured"
            $validationSuccess++
        }
    } else {
        $validationErrors += "$var has invalid format"
        Write-Error "❌ Invalid format: $var"
    }
}

# Check important optional variables
$optionalBackend = @(
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'EMAIL_USER',
    'EMAIL_PASSWORD',
    'REDIS_URL',
    'SENTRY_DSN'
)

Write-Info "`nOptional but recommended variables:"
foreach ($var in $optionalBackend) {
    if ($backendEnv.ContainsKey($var) -and $backendEnv[$var] -and 
        $backendEnv[$var] -notmatch 'CHANGE_THIS|YOUR_|your-') {
        Write-Success "✓ $var is configured"
        $validationSuccess++
    } else {
        Write-Warning "⚠️  $var not configured"
        $validationWarnings += "$var not configured (optional but recommended)"
    }
}

# Validate frontend environment
Write-Info "`n[3/3] Validating frontend environment variables..."

$frontendEnv = @{}
Get-Content $frontendEnvFile | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$' -and -not $_.StartsWith('#')) {
        $frontendEnv[$matches[1].Trim()] = $matches[2].Trim()
    }
}

# Required frontend variables
$requiredFrontend = @{
    'NEXT_PUBLIC_API_URL' = 'https?://'
}

foreach ($var in $requiredFrontend.Keys) {
    $pattern = $requiredFrontend[$var]
    
    if (-not $frontendEnv.ContainsKey($var)) {
        $validationErrors += "Missing required frontend variable: $var"
        Write-Error "❌ Missing: $var"
    } elseif ($frontendEnv[$var] -match $pattern) {
        if ($frontendEnv[$var] -match 'localhost|127\.0\.0\.1') {
            $validationWarnings += "$var points to localhost (may be intentional for testing)"
            Write-Warning "⚠️  $var points to localhost"
        } else {
            Write-Success "✓ $var is configured"
            $validationSuccess++
        }
    } else {
        $validationErrors += "$var has invalid format"
        Write-Error "❌ Invalid format: $var"
    }
}

# Security checks
Write-Info "`n[Security Checks]"

# Check JWT and SESSION secrets are different
if ($backendEnv.ContainsKey('JWT_SECRET') -and $backendEnv.ContainsKey('SESSION_SECRET')) {
    if ($backendEnv['JWT_SECRET'] -eq $backendEnv['SESSION_SECRET']) {
        $validationWarnings += "JWT_SECRET and SESSION_SECRET should be different"
        Write-Warning "⚠️  JWT_SECRET and SESSION_SECRET are the same (should be different)"
    } else {
        Write-Success "✓ JWT_SECRET and SESSION_SECRET are different"
        $validationSuccess++
    }
}

# Check secret length
if ($backendEnv.ContainsKey('JWT_SECRET')) {
    if ($backendEnv['JWT_SECRET'].Length -lt 32) {
        $validationErrors += "JWT_SECRET is too short (minimum 32 characters)"
        Write-Error "❌ JWT_SECRET is too short (minimum 32 characters)"
    } else {
        Write-Success "✓ JWT_SECRET is sufficiently long"
        $validationSuccess++
    }
}

# Check for production-specific settings
if ($backendEnv.ContainsKey('NODE_ENV') -and $backendEnv['NODE_ENV'] -ne 'production') {
    $validationErrors += "NODE_ENV must be 'production'"
    Write-Error "❌ NODE_ENV is not set to 'production'"
}

# CORS check
if ($backendEnv.ContainsKey('FRONTEND_URL') -and $backendEnv['FRONTEND_URL'] -match '^http:') {
    $validationWarnings += "FRONTEND_URL uses HTTP (HTTPS recommended for production)"
    Write-Warning "⚠️  FRONTEND_URL uses HTTP (HTTPS recommended)"
}

# Summary
Write-Host @"

╔═══════════════════════════════════════════════════╗
║              VALIDATION SUMMARY                   ║
╚═══════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

Write-Success "✓ Successful checks: $validationSuccess"

if ($validationWarnings.Count -gt 0) {
    Write-Warning "`n⚠️  Warnings ($($validationWarnings.Count)):"
    foreach ($warning in $validationWarnings) {
        Write-Warning "   • $warning"
    }
}

if ($validationErrors.Count -gt 0) {
    Write-Error "`n❌ Errors ($($validationErrors.Count)):"
    foreach ($error in $validationErrors) {
        Write-Error "   • $error"
    }
    Write-Host "`n"
    Write-Error "⛔ Production environment validation FAILED"
    Write-Warning "   Please fix the errors above before deploying to production."
    Write-Info "   See PRODUCTION_READY.md for configuration help."
    exit 1
} else {
    Write-Host "`n"
    Write-Success "🎉 Production environment validation PASSED!"
    
    if ($validationWarnings.Count -gt 0) {
        Write-Warning "`n⚠️  There are warnings. Review them before deployment."
    }
    
    Write-Info @"

Next steps:
1. Review any warnings above
2. Deploy with: ./start-production.ps1 -Docker
3. Follow PRODUCTION_CHECKLIST.md for complete setup

"@
    exit 0
}
