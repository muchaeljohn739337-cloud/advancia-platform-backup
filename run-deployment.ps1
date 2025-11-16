# Advancia Pay - Automated Deployment via SSH
# This script uploads and executes the deployment on the server

$ErrorActionPreference = "Stop"

Write-Host "=========================================="
Write-Host "Advancia Pay - Automated Deployment"
Write-Host "=========================================="
Write-Host ""

# Configuration
$serverIP = "157.245.8.131"
$sshKey = "$HOME\.ssh\advancia_droplet"
$localScript = "C:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform\-modular-saas-platform\deploy-simple.sh"
$remoteScript = "/root/deploy-simple.sh"

# Check if SSH key exists
if (-not (Test-Path $sshKey)) {
    Write-Host "❌ SSH key not found at: $sshKey" -ForegroundColor Red
    exit 1
}

# Check if deployment script exists
if (-not (Test-Path $localScript)) {
    Write-Host "❌ Deployment script not found at: $localScript" -ForegroundColor Red
    exit 1
}

Write-Host "✓ SSH key found" -ForegroundColor Green
Write-Host "✓ Deployment script found" -ForegroundColor Green
Write-Host ""

# Step 1: Upload deployment script
Write-Host "Step 1: Uploading deployment script..." -ForegroundColor Cyan
try {
    scp -i $sshKey $localScript root@${serverIP}:${remoteScript}
    Write-Host "✓ Script uploaded successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to upload script: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Make script executable and run it
Write-Host "Step 2: Running deployment on server..." -ForegroundColor Cyan
Write-Host "This may take several minutes..." -ForegroundColor Yellow
Write-Host ""

$deployCommand = "chmod +x $remoteScript && bash $remoteScript"

try {
    ssh -i $sshKey root@$serverIP $deployCommand
    Write-Host ""
    Write-Host "=========================================="
    Write-Host "✓ Deployment completed successfully!" -ForegroundColor Green
    Write-Host "=========================================="
    Write-Host ""
    Write-Host "Your application is now running at:" -ForegroundColor Cyan
    Write-Host "  → Frontend: http://$serverIP" -ForegroundColor White
    Write-Host "  → Backend API: http://${serverIP}:4000/health" -ForegroundColor White
    Write-Host ""
    Write-Host "To view logs, run:" -ForegroundColor Yellow
    Write-Host "  ssh -i $sshKey root@$serverIP 'pm2 logs'" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host ""
    Write-Host "❌ Deployment encountered an error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "To troubleshoot, connect to the server:" -ForegroundColor Yellow
    Write-Host "  ssh -i $sshKey root@$serverIP" -ForegroundColor White
    Write-Host "Then run: pm2 logs --lines 50" -ForegroundColor White
    exit 1
}
