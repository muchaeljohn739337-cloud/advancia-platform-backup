#!/usr/bin/env pwsh
# Quick deployment script for wallet system to production droplet

$DROPLET_IP = "157.245.8.131"
$DEPLOY_USER = "root"
$APP_DIR = "/var/www/advancia-pay"

Write-Host "`n🚀 Deploying Wallet System to Production`n" -ForegroundColor Cyan
Write-Host "Target: $DROPLET_IP" -ForegroundColor Yellow
Write-Host "Path: $APP_DIR`n" -ForegroundColor Yellow

# Step 1: Test SSH connection
Write-Host "1️⃣  Testing SSH connection..." -ForegroundColor Green
ssh -o ConnectTimeout=5 $DEPLOY_USER@$DROPLET_IP "echo '✅ SSH connection successful'"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ SSH connection failed!" -ForegroundColor Red
    Write-Host "Please ensure:" -ForegroundColor Yellow
    Write-Host "  - SSH key is configured: ssh-copy-id $DEPLOY_USER@$DROPLET_IP" -ForegroundColor White
    Write-Host "  - Droplet is accessible" -ForegroundColor White
    exit 1
}

# Step 2: Pull latest code
Write-Host "`n2️⃣  Pulling preview branch..." -ForegroundColor Green
ssh $DEPLOY_USER@$DROPLET_IP @"
cd $APP_DIR && \
git fetch origin && \
git checkout preview && \
git pull origin preview && \
echo '✅ Code updated to preview branch'
"@

# Step 3: Check environment variables
Write-Host "`n3️⃣  Checking environment variables..." -ForegroundColor Green
Write-Host "⚠️  MANUAL STEP REQUIRED!" -ForegroundColor Red
Write-Host "`nSSH to droplet and add these to backend/.env:" -ForegroundColor Yellow
Write-Host @"

# Custodial Wallet System
WALLET_MASTER_SEED=leaf room elephant talk away glad morning able doll amount village you fortune huge turn reflect artwork lady lesson deposit sunset ancient vital sauce
WALLET_ENCRYPTION_KEY=w0O3u0ZhjUJsIrZnK3vVA7Lhu0U0nGnYNK0bNE470vo=

# Admin Wallets (replace with your actual Coinbase/Binance addresses)
ADMIN_BTC_WALLET_ADDRESS=your-coinbase-btc-address
ADMIN_ETH_WALLET_ADDRESS=your-coinbase-eth-address
ADMIN_USDT_WALLET_ADDRESS=your-coinbase-usdt-address

"@ -ForegroundColor White

Write-Host "`nCommand:" -ForegroundColor Yellow
Write-Host "  ssh $DEPLOY_USER@$DROPLET_IP" -ForegroundColor White
Write-Host "  cd $APP_DIR/backend && nano .env" -ForegroundColor White
Write-Host "`nPress Enter when done..." -ForegroundColor Cyan
Read-Host

# Step 4: Install dependencies
Write-Host "`n4️⃣  Installing dependencies..." -ForegroundColor Green
ssh $DEPLOY_USER@$DROPLET_IP @"
cd $APP_DIR/backend && \
npm install && \
echo '✅ Dependencies installed'
"@

# Step 5: Run migrations
Write-Host "`n5️⃣  Running database migrations..." -ForegroundColor Green
ssh $DEPLOY_USER@$DROPLET_IP @"
cd $APP_DIR/backend && \
npx prisma migrate deploy && \
echo '✅ Migrations applied'
"@

# Step 6: Build backend
Write-Host "`n6️⃣  Building backend..." -ForegroundColor Green
ssh $DEPLOY_USER@$DROPLET_IP @"
cd $APP_DIR/backend && \
npm run build && \
echo '✅ Backend built'
"@

# Step 7: Restart PM2
Write-Host "`n7️⃣  Restarting backend with PM2..." -ForegroundColor Green
ssh $DEPLOY_USER@$DROPLET_IP @"
cd $APP_DIR/backend && \
pm2 restart advancia-backend && \
pm2 save && \
echo '✅ Backend restarted'
"@

# Step 8: Check logs
Write-Host "`n8️⃣  Checking PM2 logs..." -ForegroundColor Green
Write-Host "Last 20 lines of logs:" -ForegroundColor Yellow
ssh $DEPLOY_USER@$DROPLET_IP "pm2 logs advancia-backend --lines 20 --nostream"

# Step 9: Test wallet endpoint
Write-Host "`n9️⃣  Testing wallet endpoints..." -ForegroundColor Green
Write-Host "Manual test commands:" -ForegroundColor Yellow
Write-Host @"

# Register a test user
curl -X POST https://api.advancia.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","username":"testuser"}'

# Login
curl -X POST https://api.advancia.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# Get wallets (use token from login)
curl https://api.advancia.com/api/wallets \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

"@ -ForegroundColor White

# Summary
Write-Host "`n" + ("="*60) -ForegroundColor Gray
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Test wallet generation with curl commands above" -ForegroundColor White
Write-Host "2. Run integration tests: cd backend && npm run test:integration" -ForegroundColor White
Write-Host "3. Monitor logs: ssh $DEPLOY_USER@$DROPLET_IP 'pm2 logs advancia-backend'" -ForegroundColor White
Write-Host "4. Check status: ssh $DEPLOY_USER@$DROPLET_IP 'pm2 status'" -ForegroundColor White
Write-Host "`n🔒 Security Reminder:" -ForegroundColor Red
Write-Host "- Verify WALLET_MASTER_SEED is securely stored in vault" -ForegroundColor White
Write-Host "- Ensure .env file permissions: chmod 600 backend/.env" -ForegroundColor White
Write-Host "- Rotate secrets quarterly`n" -ForegroundColor White
