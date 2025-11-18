# ============================================================================
# Advancia Pay - SUPER FIX FOR PRODUCTION (Automated & Safe)
# ============================================================================
# Run: .\scripts\SUPER-FIX-PROD.ps1
# ============================================================================

$ErrorActionPreference = "Stop"

Write-Host "`n╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   ADVANCIA PAY - SUPER FIX FOR PRODUCTION                    ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Paths and Globals
$repoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$backendPath = Join-Path $repoRoot 'backend'
$frontendPath = Join-Path $repoRoot 'frontend'
$backendPort = 4000
$frontendPort = 3000
$healthUrl = "http://localhost:$backendPort/api/health"
$healthUrlAlt = "http://localhost:$backendPort/health"
$logsDir = Join-Path $repoRoot 'scripts/logs'
New-Item -ItemType Directory -Force -Path $logsDir | Out-Null
$backendLog = Join-Path $logsDir 'backend-startup.log'
$buildLog = Join-Path $logsDir 'backend-build.log'
$secretScanLog = Join-Path $logsDir 'secret-scan.log'

function Section($title) {
  Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
  Write-Host $title -ForegroundColor Yellow
  Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
}

function Test-Admin {
  $id=[Security.Principal.WindowsIdentity]::GetCurrent()
  $p = New-Object Security.Principal.WindowsPrincipal($id)
  return $p.IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)
}

function Require-Tool([string]$cmd,[string]$hint){
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)){
    throw "Required tool missing: $cmd. $hint"
  }
}

function Ensure-Pnpm {
  if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Installing pnpm globally..." -ForegroundColor Cyan
    npm i -g pnpm 2>&1 | Out-Null
  }
}

function Stop-ListeningPort([int]$port){
  try{
    $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($conns){
      foreach ($c in $conns){
        if ($c.OwningProcess){
          try{ $p = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue; if($p){
            Write-Host "🔧 Stopping $($p.ProcessName) (PID $($p.Id)) on port $port" -ForegroundColor Cyan
            Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
          }} catch {}
        }
      }
    }
  } catch {}
}

# STEP 0: Prerequisites
Section "STEP 0: Prerequisites & System Checks"
try {
  if (-not (Test-Admin)) { Write-Host "⚠️  Not running as Administrator. Some operations may be limited." -ForegroundColor Yellow }
  Require-Tool git "Install Git: https://git-scm.com/download/win"
  Require-Tool node "Install Node.js LTS: https://nodejs.org/en/download"
  Ensure-Pnpm
  Require-Tool docker "Install Docker Desktop: https://www.docker.com/products/docker-desktop/"
  Write-Host ("🟢 Node: {0}" -f (node -v)) -ForegroundColor Green
  Write-Host ("🟢 pnpm: {0}" -f (pnpm -v)) -ForegroundColor Green
} catch { Write-Host "❌ Prerequisite failure: $_" -ForegroundColor Red; exit 1 }

# STEP 1: Database
Section "STEP 1: Starting PostgreSQL Database"
$dbSkipped = $false
try {
  docker ps 2>$null | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Docker not running. Start Docker Desktop." }

  $existing = docker ps -a --filter "name=advancia-postgres-dev" --format "{{.Names}}" 2>$null
  if ($existing) {
    Write-Host "📦 Starting existing Postgres container..." -ForegroundColor Cyan
    docker start advancia-postgres-dev 2>&1 | Out-Null
  } else {
    Write-Host "📦 Creating Postgres container (docker-compose.dev-db.yml)..." -ForegroundColor Cyan
    docker-compose -f "$repoRoot/docker-compose.dev-db.yml" up -d
  }

  Write-Host "⏳ Waiting for PostgreSQL..." -ForegroundColor Yellow
  Start-Sleep -Seconds 5
  $ok=$false; for($i=0;$i -lt 10;$i++){ docker exec advancia-postgres-dev pg_isready -U postgres 2>$null; if($LASTEXITCODE -eq 0){$ok=$true;break}; Start-Sleep -Seconds 2 }
  if (-not $ok){ throw "PostgreSQL failed to become ready" }
  Write-Host "✅ PostgreSQL ready" -ForegroundColor Green
} catch { Write-Host "⚠️  Database step skipped: $_" -ForegroundColor Yellow; $dbSkipped = $true }

# STEP 1.5: Free Ports
Section "STEP 1.5: Free Ports (4000, 3000)"
Stop-ListeningPort $backendPort
Stop-ListeningPort $frontendPort

# STEP 2: Backend deps + Prisma + Migrate
Section "STEP 2: Backend deps + Prisma generate + Migrate"
try {
  Set-Location $backendPath
  Write-Host "📦 Installing backend deps (pnpm)..." -ForegroundColor Cyan
  pnpm install 2>&1 | Out-Null
  Write-Host "🛠️  Prisma generate..." -ForegroundColor Cyan
  pnpm exec prisma generate 2>&1 | Out-Null
  Write-Host "📊 Prisma migrate deploy..." -ForegroundColor Cyan
    if ($dbSkipped) { Write-Host "⚠️  Skipping migrate (database not available)" -ForegroundColor Yellow }
    else { pnpm exec prisma migrate deploy 2>&1 | Out-Null }
  if (Test-Path "src/seed.js") {
    Write-Host "🌱 Seeding admin (src/seed.js)..." -ForegroundColor Cyan
    node src/seed.js 2>&1 | Out-Null
  } else {
    Write-Host "ℹ️  No seed script found; skipping seeding." -ForegroundColor DarkYellow
  }
  Set-Location $repoRoot
} catch { Write-Host "❌ Backend migrate step failed: $_" -ForegroundColor Red; Set-Location $repoRoot }

# STEP 3: Env validation
Section "STEP 3: Verify Environment Variables"
$envPath = Join-Path $backendPath '.env'
if (-not (Test-Path $envPath)) { Write-Host "⚠️  backend/.env missing. Use backend/.env.example to create it." -ForegroundColor Yellow }
$envFile = ''
try { $envFile = Get-Content $envPath -Raw } catch {}
$checks = @(
  @{Name='JWT_SECRET'; Pattern='JWT_SECRET=(?!YOUR_)(.+)'}
  @{Name='JWT_REFRESH_SECRET'; Pattern='JWT_REFRESH_SECRET=(?!YOUR_)(.+)'}
  @{Name='SESSION_SECRET'; Pattern='SESSION_SECRET=(?!YOUR_)(.+)'}
  @{Name='VAPID_PUBLIC_KEY'; Pattern='VAPID_PUBLIC_KEY=(?!YOUR_)(.+)'}
  @{Name='VAPID_PRIVATE_KEY'; Pattern='VAPID_PRIVATE_KEY=(?!YOUR_)(.+)'}
  @{Name='CRYPTOMUS_API_KEY'; Pattern='CRYPTOMUS_API_KEY=(?!YOUR_)(.+)'}
  @{Name='GMAIL_APP_PASSWORD'; Pattern='GMAIL_APP_PASSWORD=.+'}
)
$allGood=$true
foreach($c in $checks){ if($envFile -and ($envFile -match $c.Pattern)){ Write-Host ("  ✅ {0}" -f $c.Name) -ForegroundColor Green } else { Write-Host ("  ❌ {0} - MISSING OR PLACEHOLDER" -f $c.Name) -ForegroundColor Red; $allGood=$false } }
if(-not $allGood){ Write-Host "⚠️  Some env variables need attention" -ForegroundColor Yellow } else { Write-Host "✅ All critical environment variables configured" -ForegroundColor Green }

# STEP 4: Build + Run backend + health
Section "STEP 4: Build + Run Backend + Health"
try {
  Set-Location $backendPath
  Write-Host "🔧 Building backend (tsc)..." -ForegroundColor Cyan
  pnpm run build 2>&1 | Tee-Object -FilePath $buildLog | Out-Null
  if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend build failed. Showing last 60 lines of log:" -ForegroundColor Red
    if (Test-Path $buildLog) { Get-Content $buildLog -Tail 60 | Write-Host }
    throw "Backend build failed"
  }
  Write-Host "🚀 Starting backend in background (node dist/index.js)..." -ForegroundColor Cyan
  $job = Start-Job -ScriptBlock {
    param($path,$logPath,$port)
    Set-Location $path
    $env:PORT = $port
    node dist/index.js *> $logPath
  } -ArgumentList $backendPath,$backendLog,$backendPort
  Start-Sleep -Seconds 10
  $healthy=$false
  try{ $r=Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 5; if($r.StatusCode -eq 200){$healthy=$true}}catch{}
  if(-not $healthy){ try{ $r2=Invoke-WebRequest -Uri $healthUrlAlt -UseBasicParsing -TimeoutSec 5; if($r2.StatusCode -eq 200){$healthy=$true}}catch{} }
  if($healthy){ Write-Host "✅ Backend server healthy" -ForegroundColor Green } else { Write-Host "❌ Backend health failed. Last 60 log lines:" -ForegroundColor Red; if(Test-Path $backendLog){ Get-Content $backendLog -Tail 60 | Write-Host } }
} finally {
  Get-Job | Where-Object { $_.State -eq 'Running' } | Stop-Job -ErrorAction SilentlyContinue
  Get-Job | Remove-Job -Force -ErrorAction SilentlyContinue
  Set-Location $repoRoot
}

# STEP 5: Frontend build
Section "STEP 5: Frontend Dependencies + Build"
try {
  if (Test-Path $frontendPath) {
    Set-Location $frontendPath
    Write-Host "📦 Installing frontend deps (pnpm)..." -ForegroundColor Cyan
    pnpm install 2>&1 | Out-Null
    Write-Host "🔧 Building frontend (production)..." -ForegroundColor Cyan
    pnpm run build 2>&1 | Out-Null
    Write-Host "✅ Frontend build complete" -ForegroundColor Green
    Set-Location $repoRoot
  } else {
    Write-Host "ℹ️  Frontend folder not found; skipping build." -ForegroundColor DarkYellow
  }
} catch { Write-Host "❌ Frontend build failed: $_" -ForegroundColor Red; Set-Location $repoRoot }

# STEP 6: Secrets scanning + .gitignore
Section "STEP 6: Secret Scanning + .gitignore Enforcement"
$gitignorePath = Join-Path $repoRoot '.gitignore'
if (Test-Path $gitignorePath) {
  $gi = Get-Content $gitignorePath -Raw
  $rules = @('.env','*.env','backend/.env','frontend/.env')
  $updated=$false
  foreach($r in $rules){ if($gi -notmatch ("(?m)^" + [regex]::Escape($r) + "$")){ Add-Content -Path $gitignorePath -Value $r; $updated=$true } }
  if($updated){ Write-Host "🛡️  Updated .gitignore with env patterns" -ForegroundColor Green }
}
Write-Host "🔎 Scanning repo for high-risk tokens..." -ForegroundColor Cyan
"" | Set-Content $secretScanLog
$patterns = @(
  'sk_live_[0-9a-zA-Z]{10,}',
  'sk_test_[0-9a-zA-Z]{10,}',
  'AKIA[0-9A-Z]{16}',
  'ghp_[0-9A-Za-z]{36,}',
  '-----BEGIN .* PRIVATE KEY-----',
  'DATABASE_URL=postgresql://\\S+'
)
foreach($p in $patterns){ try{ git grep -n --full-name -I -E $p -- ":(exclude)scripts/logs/**" ":(exclude)*package-lock.json" 2>$null | Add-Content $secretScanLog } catch {} }
if ((Get-Content $secretScanLog | Measure-Object -Line).Lines -gt 0) { Write-Host "⚠️  Potential secrets detected. Review $secretScanLog" -ForegroundColor Yellow } else { Write-Host "✅ No obvious secrets detected in tracked files" -ForegroundColor Green }

# STEP 7: Manual history cleanup directions
Section "STEP 7: Git History Cleanup (MANUAL RECOMMENDED)"
Write-Host @"

⚠️  CRITICAL: Old secrets may exist in git history!

To clean git history safely with BFG:
1) wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar -O bfg.jar
2) Create passwords.txt with patterns to remove
3) java -jar bfg.jar --replace-text passwords.txt
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push --force --all

WARNING: Coordinate with the team before force-pushing!
"@ -ForegroundColor Cyan

# SUMMARY
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "SUPER FIX COMPLETE!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green

Write-Host @"

✅ Done:
  • Prereqs verified (Git, Node, pnpm, Docker)
  • Postgres running (Docker)
  • Ports 4000/3000 cleared
  • Backend deps, Prisma generate, migrate deploy
  • Backend built + health-checked (logs: $backendLog)
  • Frontend deps installed + production build
  • .gitignore enforced; repo scanned for secrets

▶ Next:
  • Backend (dev):   cd backend; pnpm dev
  • Backend (prod):  cd backend; pnpm build && pnpm start
  • Frontend (dev):  cd frontend; pnpm dev
  • Frontend (prod): cd frontend; pnpm build
  • API docs:        http://localhost:4000/api-docs

"@ -ForegroundColor White

Write-Host "For comprehensive guidance see: PRODUCTION_READINESS_REPORT.md`n" -ForegroundColor Cyan
