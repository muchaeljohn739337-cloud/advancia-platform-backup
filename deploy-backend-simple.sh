#!/bin/bash
# Quick backend deployment script for DigitalOcean
# Run this: ssh root@157.245.8.131 'bash -s' < deploy-backend-simple.sh

set -e

echo "🚀 Deploying Advancia Pay Backend to DigitalOcean"
echo "=================================================="

# Configuration
APP_PATH="/var/www/advancia-backend"
BRANCH="preview"
PORT=4000

# Navigate or clone
if [ -d "$APP_PATH" ]; then
    echo "📁 Navigating to $APP_PATH"
    cd "$APP_PATH"
    
    # Update code
    echo "📥 Pulling latest code from $BRANCH..."
    git fetch origin
    git checkout $BRANCH
    git pull origin $BRANCH
else
    echo "📦 Cloning repository..."
    mkdir -p /var/www
    cd /var/www
    git clone https://github.com/muchaeljohn739337-cloud/-modular-saas-platform.git advancia-backend
    cd advancia-backend
    git checkout $BRANCH
fi

# Install dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install --production

# Build
echo "🔨 Building TypeScript..."
npm run build

# Database migrations
if [ -f "prisma/schema.prisma" ]; then
    echo "🗄️ Running database migrations..."
    npx prisma migrate deploy || echo "⚠️ Migration failed (may be expected)"
    npx prisma generate
fi

# PM2 management
echo "🔄 Managing PM2 process..."
if pm2 describe advancia-backend > /dev/null 2>&1; then
    echo "   Reloading existing process..."
    pm2 reload advancia-backend
else
    echo "   Starting new process..."
    cd /var/www/advancia-backend/backend
    PORT=$PORT pm2 start npm --name advancia-backend -- start
fi

# Save PM2 config
pm2 save
pm2 startup systemd -u root --hp /root || true

# Health check
echo ""
echo "🏥 Running health check..."
sleep 3

if curl -f http://localhost:$PORT/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy!"
    curl -s http://localhost:$PORT/health | head -n 5
else
    echo "⚠️ Health check failed - checking logs..."
    pm2 logs advancia-backend --lines 20 --nostream
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 PM2 Status:"
pm2 list
echo ""
echo "🌐 Test: https://api.advanciapayledger.com/health"
