#!/bin/bash
# Backend deployment script for DigitalOcean droplet
# Run this ON the droplet after SSH

set -e

APP_PATH="/var/www/advancia-backend"
BRANCH="${1:-main}"
PORT="${PORT:-4000}"

echo "🚀 Deploying Advancia Pay Backend"
echo "============================================================"
echo "Path:   $APP_PATH"
echo "Branch: $BRANCH"
echo "Port:   $PORT"
echo ""

# Navigate to app directory
cd $APP_PATH || {
    echo "❌ App directory not found at $APP_PATH"
    echo "   Clone first: git clone https://github.com/muchaeljohn739337-cloud/-modular-saas-platform.git $APP_PATH"
    exit 1
}

# Stash local changes
git stash

# Fetch and pull
echo "📥 Fetching latest changes..."
git fetch origin
git checkout $BRANCH
git pull origin $BRANCH

# Install dependencies
echo "📦 Installing dependencies..."
cd backend
npm install --production

# Build
echo "🔨 Building TypeScript..."
npm run build

# Database migrations
if [ -f "prisma/schema.prisma" ]; then
    echo "🗄️ Running database migrations..."
    npx prisma migrate deploy
    npx prisma generate
fi

# PM2 management
echo "🔄 Managing PM2 process..."

if pm2 describe advancia-backend > /dev/null 2>&1; then
    echo "   Reloading existing process..."
    pm2 reload advancia-backend
else
    echo "   Starting new process..."
    PORT=$PORT pm2 start npm --name advancia-backend -- start
fi

# Save PM2 config
pm2 save

# Ensure PM2 starts on boot
pm2 startup systemd -u root --hp /root

echo ""
echo "🏥 Running health check..."
sleep 3

if curl -f http://localhost:$PORT/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy!"
    curl -s http://localhost:$PORT/health | jq .
else
    echo "⚠️ Health check failed!"
    echo "📋 Recent logs:"
    pm2 logs advancia-backend --lines 20 --nostream
    exit 1
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 PM2 Status:"
pm2 list
echo ""
echo "📚 Useful commands:"
echo "   pm2 logs advancia-backend    # View logs"
echo "   pm2 monit                    # Monitor"
echo "   pm2 restart advancia-backend # Restart"
echo "   pm2 stop advancia-backend    # Stop"
echo ""
