#!/bin/bash
# DigitalOcean Droplet Initial Setup Script
# Run this on a fresh DigitalOcean Ubuntu 24.04 droplet as root

set -e

echo "🚀 DigitalOcean Droplet Setup Script"
echo "===================================="

# Update system
echo "📦 Updating system packages..."
apt-get update
apt-get upgrade -y

# Install Docker & Docker Compose
echo "🐳 Installing Docker & Docker Compose..."
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common

# Add Docker repo
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Enable Docker daemon
systemctl enable docker
systemctl start docker

# Install Docker Compose standalone
echo "🔧 Installing Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Node.js (for scripts)
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install Git
echo "📦 Installing Git..."
apt-get install -y git

# Install UFW (firewall)
echo "🔥 Configuring firewall..."
apt-get install -y ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 5432/tcp
ufw allow 6379/tcp
echo "y" | ufw enable

# Create app directory structure
echo "📁 Creating application directories..."
mkdir -p /app/modular-saas-platform
mkdir -p /app/backups
mkdir -p /app/logs
mkdir -p /app/postgres_data
mkdir -p /app/redis_data

# Clone repository
echo "📥 Cloning repository..."
cd /app
git clone https://github.com/muchaeljohn739337-cloud/-modular-saas-platform.git modular-saas-platform
cd modular-saas-platform
git checkout main

# Create environment file placeholder
echo "📝 Creating .env.production template..."
cat > /app/.env.production << 'EOF'
# Database
DATABASE_URL=postgresql://advancia_user:CHANGE_ME@localhost:5432/advancia_prod

# Redis
REDIS_URL=redis://localhost:6379

# Backend
NODE_ENV=production
PORT=4000
JWT_SECRET=CHANGE_ME_WITH_SECURE_SECRET
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://advanciapayledger.com
BACKEND_URL=https://api.advanciapayledger.com

# Stripe (optional)
STRIPE_SECRET_KEY=sk_live_CHANGE_ME
STRIPE_WEBHOOK_SECRET=whsec_CHANGE_ME

# Crypto (optional)
CRYPTOMUS_API_KEY=CHANGE_ME
CRYPTOMUS_MERCHANT_ID=CHANGE_ME

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=CHANGE_ME@gmail.com
EMAIL_PASSWORD=CHANGE_ME_WITH_APP_PASSWORD

# Sentry (optional)
SENTRY_DSN=CHANGE_ME

# AWS (optional, for backups)
AWS_ACCESS_KEY_ID=CHANGE_ME
AWS_SECRET_ACCESS_KEY=CHANGE_ME
S3_BACKUPS_BUCKET=CHANGE_ME

# Frontend
NEXT_PUBLIC_API_URL=https://api.advanciapayledger.com
NEXT_PUBLIC_VAPID_KEY=CHANGE_ME
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_CHANGE_ME
EOF

chmod 600 /app/.env.production

echo ""
echo "✅ DigitalOcean Droplet Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Update /app/.env.production with your actual secrets"
echo "2. Configure PostgreSQL database (if not using managed DB)"
echo "3. Run: cd /app/modular-saas-platform && docker-compose -f docker-compose.prod.yml up -d"
echo "4. Verify: curl http://localhost:4000/api/health"
echo ""
echo "🔐 Remember to:"
echo "  - Set strong DATABASE_URL password"
echo "  - Set JWT_SECRET to a random string"
echo "  - Add all required API keys (Stripe, Crypto, Email)"
echo "  - Configure DNS to point to this droplet's IP"
echo ""
