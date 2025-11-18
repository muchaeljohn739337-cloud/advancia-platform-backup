# ====================================================================
# Transfer .env Files to DigitalOcean Droplet
# Securely copies environment files excluded from git
# ====================================================================

param(
    [string]$DropletIP = "157.245.8.131",
    [string]$User = "root",
    [string]$RemotePath = "/root/advancia-pay",
    [string]$SSHKeyPath = "$env:USERPROFILE\.ssh\id_rsa"
)

Write-Host "`n🚀 Environment File Transfer to Droplet" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check SSH connectivity
Write-Host "1️⃣ Testing SSH connection to $DropletIP..." -ForegroundColor Yellow
$sshTest = ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no -i $SSHKeyPath ${User}@${DropletIP} "echo 'Connected'" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ SSH connection failed!" -ForegroundColor Red
    Write-Host "   Error: $sshTest" -ForegroundColor Red
    Write-Host "`n💡 Manual command:" -ForegroundColor Yellow
    Write-Host "   ssh -i $SSHKeyPath ${User}@${DropletIP}`n" -ForegroundColor Gray
    exit 1
}
Write-Host "   ✅ SSH connected successfully`n" -ForegroundColor Green

# Ensure remote directory exists
Write-Host "2️⃣ Creating remote directories..." -ForegroundColor Yellow
ssh -i $SSHKeyPath ${User}@${DropletIP} "mkdir -p ${RemotePath}/backend ${RemotePath}/frontend" 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Remote directories ready`n" -ForegroundColor Green
} else {
    Write-Host "   ❌ Failed to create directories`n" -ForegroundColor Red
    exit 1
}

# Transfer backend .env
Write-Host "3️⃣ Transferring backend/.env..." -ForegroundColor Yellow
if (Test-Path "backend\.env") {
    scp -i $SSHKeyPath backend\.env ${User}@${DropletIP}:${RemotePath}/backend/.env 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        $size = [math]::Round((Get-Item backend\.env).Length / 1KB, 2)
        Write-Host "   ✅ backend/.env transferred ($size KB)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ backend/.env transfer failed" -ForegroundColor Red
    }
} else {
    Write-Host "   ⚠️  backend/.env not found locally" -ForegroundColor Yellow
}

# Transfer frontend/.env.local
Write-Host "`n4️⃣ Transferring frontend/.env.local..." -ForegroundColor Yellow
if (Test-Path "frontend\.env.local") {
    scp -i $SSHKeyPath frontend\.env.local ${User}@${DropletIP}:${RemotePath}/frontend/.env.local 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        $size = [math]::Round((Get-Item frontend\.env.local).Length / 1KB, 2)
        Write-Host "   ✅ frontend/.env.local transferred ($size KB)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ frontend/.env.local transfer failed" -ForegroundColor Red
    }
} else {
    Write-Host "   ⚠️  frontend/.env.local not found locally" -ForegroundColor Yellow
}

# Transfer frontend/.env.production
Write-Host "`n5️⃣ Transferring frontend/.env.production..." -ForegroundColor Yellow
if (Test-Path "frontend\.env.production") {
    scp -i $SSHKeyPath frontend\.env.production ${User}@${DropletIP}:${RemotePath}/frontend/.env.production 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        $size = [math]::Round((Get-Item frontend\.env.production).Length / 1KB, 2)
        Write-Host "   ✅ frontend/.env.production transferred ($size KB)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ frontend/.env.production transfer failed" -ForegroundColor Red
    }
} else {
    Write-Host "   ⚠️  frontend/.env.production not found locally" -ForegroundColor Yellow
}

# Verify files on droplet
Write-Host "`n6️⃣ Verifying files on droplet..." -ForegroundColor Yellow
$remoteFiles = ssh -i $SSHKeyPath ${User}@${DropletIP} "ls -lh ${RemotePath}/backend/.env ${RemotePath}/frontend/.env.* 2>&1" 2>&1
Write-Host $remoteFiles -ForegroundColor Gray

Write-Host "`n✨ Transfer complete!`n" -ForegroundColor Green
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. SSH to droplet: ssh -i $SSHKeyPath ${User}@${DropletIP}" -ForegroundColor Gray
Write-Host "   2. Verify backend/.env: cat ${RemotePath}/backend/.env | head -20" -ForegroundColor Gray
Write-Host "   3. Update DATABASE_URL if needed: nano ${RemotePath}/backend/.env" -ForegroundColor Gray
Write-Host "   4. Deploy and restart services`n" -ForegroundColor Gray

Write-Host "🔒 Security reminder: Never commit .env files to git!`n" -ForegroundColor Yellow
