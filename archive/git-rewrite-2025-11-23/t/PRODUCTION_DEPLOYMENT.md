# 🚀 Production Deployment Guide

Complete guide for deploying Advancia PayLedger to a self-hosted VPS.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Setup](#server-setup)
3. [Domain Configuration](#domain-configuration)
4. [SSL Certificates](#ssl-certificates)
5. [Application Deployment](#application-deployment)
6. [Database Initialization](#database-initialization)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Services

-   **VPS Server**:
    -   Minimum: 2 CPU cores, 4GB RAM, 50GB SSD
    -   Recommended: 4 CPU cores, 8GB RAM, 100GB SSD
    -   OS: Ubuntu 22.04 LTS or Debian 11+

-   **Domain Name**:
    -   Purchased from registrar (e.g., Namecheap, GoDaddy)
    -   DNS access for A/AAAA record configuration

-   **Third-Party Services**:
    -   [Resend](https://resend.com) - Email delivery (free tier: 3,000 emails/month)
    -   [Stripe](https://stripe.com) - Payment processing
    -   [Optional] Sentry - Error tracking

### Required Software on Local Machine

```bash
# Git
git --version

# SSH client
ssh -V

# (Optional) Docker for local testing
docker --version
docker-compose --version
```

---

## Server Setup

### 1. Initial Server Access

```bash
# SSH into your server
ssh root@YOUR_SERVER_IP

# Update system packages
apt update && apt upgrade -y

# Install essential tools
apt install -y curl wget git ufw fail2ban
```

### 2. Create Non-Root User

```bash
# Create deployment user
adduser deploy
usermod -aG sudo deploy

# Switch to deploy user
su - deploy
```

### 3. Install Docker & Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version

# Log out and back in for group changes to take effect
exit
su - deploy
```

### 4. Configure Firewall

```bash
# Enable UFW
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Verify status
sudo ufw status
```

### 5. Configure Fail2Ban (Brute Force Protection)

```bash
# Enable Fail2Ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Check status
sudo fail2ban-client status
```

---

## Domain Configuration

### 1. DNS Records

Log into your domain registrar's DNS management panel and add:

```
Type    Name    Value               TTL
A       @       YOUR_SERVER_IP      300
A       www     YOUR_SERVER_IP      300
AAAA    @       YOUR_IPv6 (if available)  300
```

### 2. Verify DNS Propagation

```bash
# Check from local machine
dig advanciapayledger.com +short
dig www.advanciapayledger.com +short

# Or use online tool: https://dnschecker.org
```

**Wait 5-60 minutes for DNS to propagate globally.**

---

## SSL Certificates

### Option A: Automated Setup (Recommended)

The deployment includes Certbot for automatic SSL certificate generation.

```bash
# Certificates will be auto-generated on first run
# Update domain in .env.production:
DOMAIN=advanciapayledger.com
LETSENCRYPT_EMAIL=admin@advanciapayledger.com
```

### Option B: Manual Certbot Setup

If auto-generation fails, run manually:

```bash
# Install Certbot
sudo apt install -y certbot

# Generate certificates (replace domain)
sudo certbot certonly --standalone -d advanciapayledger.com -d www.advanciapayledger.com

# Certificates saved to: /etc/letsencrypt/live/advanciapayledger.com/
```

---

## Application Deployment

### 1. Clone Repository

```bash
# Navigate to home directory
cd ~

# Clone repository
git clone https://github.com/pdtribe181-prog/-modular-saas-platform.git advancia-pay-ledger
cd advancia-pay-ledger
```

### 2. Configure Environment

```bash
# Copy production environment template
cp .env.production.example .env.production

# Edit with your values
nano .env.production
```

**Required changes in `.env.production`:**

```bash
# Generate JWT secret (run this command)
openssl rand -base64 64

# Generate API key
openssl rand -hex 32

# Generate VAPID keys
cd backend
node generate-vapid.js
cd ..

# Update these in .env.production:
JWT_SECRET=<output_from_openssl>
API_KEY=<output_from_openssl>
VAPID_PUBLIC_KEY=<from_generate-vapid.js>
VAPID_PRIVATE_KEY=<from_generate-vapid.js>

# Database passwords
POSTGRES_PASSWORD=<strong_random_password>
REDIS_PASSWORD=<strong_random_password>

# Stripe keys (from dashboard.stripe.com)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend API key (from resend.com)
RESEND_API_KEY=re_...

# Domain
DOMAIN=advanciapayledger.com
LETSENCRYPT_EMAIL=admin@advanciapayledger.com
```

### 3. Update Nginx Configuration

```bash
# Edit nginx config with your domain
nano nginx/conf.d/default.conf

# Replace all instances of:
# advanciapayledger.com → YOUR_DOMAIN.com
```

### 4. Build and Deploy

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 5. Verify Services

```bash
# Check health endpoints
curl http://localhost/health
curl http://localhost/api/health

# Check from external (replace domain)
curl https://advanciapayledger.com/health
curl https://advanciapayledger.com/api/health
```

---

## Database Initialization

### 1. Run Migrations

```bash
# Migrations run automatically on backend container start
# To run manually:
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### 2. Create Admin User

```bash
# Method 1: Using Node.js script
docker-compose -f docker-compose.prod.yml exec backend node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

(async () => {
  const passwordHash = await bcrypt.hash('CHANGE_THIS_PASSWORD', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@advanciapayledger.com',
      username: 'admin',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      approved: true,
      emailVerified: true,
      active: true
    }
  });
  console.log('Admin created:', admin.email);
  await prisma.\$disconnect();
})();
"

# Method 2: Using psql
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d advancia_payledger
```

### 3. Verify Database

```bash
# Access PostgreSQL
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d advancia_payledger

# List tables
\dt

# Count users
SELECT COUNT(*) FROM "User";

# List admin users
SELECT email, role FROM "User" WHERE role = 'ADMIN';

# Exit
\q
```

---

## Monitoring & Maintenance

### Logs

```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f nginx

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100 backend
```

### Backups

```bash
# Automatic backups run daily (configured in docker-compose.prod.yml)
# Manual backup:
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres advancia_payledger > backup_$(date +%Y%m%d).sql

# List backups
docker-compose -f docker-compose.prod.yml exec postgres ls -lh /backups/

# Restore from backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d advancia_payledger < backup_20251110.sql
```

### Updates & Deployments

```bash
# Pull latest code
cd ~/advancia-pay-ledger
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Run database migrations (if any)
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Verify services
docker-compose -f docker-compose.prod.yml ps
```

### SSL Certificate Renewal

```bash
# Automatic renewal runs daily via Certbot container
# Manual renewal:
docker-compose -f docker-compose.prod.yml exec certbot certbot renew

# Reload nginx after renewal
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

### Resource Monitoring

```bash
# Container resource usage
docker stats

# Disk usage
docker system df
df -h

# View processes
docker-compose -f docker-compose.prod.yml top
```

---

## Troubleshooting

### Service Won't Start

```bash
# Check logs for errors
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend

# Check service health
docker-compose -f docker-compose.prod.yml ps

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend
```

### Database Connection Errors

```bash
# Verify PostgreSQL is running
docker-compose -f docker-compose.prod.yml ps postgres

# Test connection
docker-compose -f docker-compose.prod.yml exec backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => console.log('Connected'))
  .catch(e => console.error('Error:', e));
"

# Check DATABASE_URL in .env.production
cat .env.production | grep DATABASE_URL
```

### SSL Certificate Issues

```bash
# Check certificate files
sudo ls -la /etc/letsencrypt/live/advanciapayledger.com/

# Test SSL configuration
docker-compose -f docker-compose.prod.yml exec nginx nginx -t

# Regenerate certificates
docker-compose -f docker-compose.prod.yml exec certbot certbot delete
docker-compose -f docker-compose.prod.yml exec certbot certbot certonly --webroot -w /var/www/certbot -d advanciapayledger.com
```

### Performance Issues

```bash
# Check resource usage
docker stats

# Check slow queries (PostgreSQL)
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d advancia_payledger -c "SELECT * FROM pg_stat_activity;"

# Clear Redis cache
docker-compose -f docker-compose.prod.yml exec redis redis-cli -a YOUR_REDIS_PASSWORD FLUSHALL
```

### Complete Reset (Development Only!)

```bash
# ⚠️ WARNING: This deletes ALL data!
docker-compose -f docker-compose.prod.yml down -v
docker system prune -a --volumes
rm -rf postgres_data redis_data
```

---

## Production Checklist

Before going live:

-   [ ] DNS records configured and propagated
-   [ ] SSL certificates generated and auto-renewal configured
-   [ ] All `.env.production` values filled with production credentials
-   [ ] Strong passwords for database, Redis, JWT secret
-   [ ] Admin user created and tested
-   [ ] Stripe webhook endpoint configured
-   [ ] Resend email sender verified
-   [ ] Firewall (UFW) enabled with only ports 22, 80, 443 open
-   [ ] Fail2Ban configured for SSH protection
-   [ ] Daily database backups configured
-   [ ] Monitoring and alerting configured
-   [ ] Domain HTTPS verified: `https://YOUR_DOMAIN.com`
-   [ ] API endpoints verified: `https://YOUR_DOMAIN.com/api/health`
-   [ ] Frontend accessible: `https://YOUR_DOMAIN.com`
-   [ ] Admin login tested: `https://YOUR_DOMAIN.com/admin`

---

## Support & Resources

-   **Documentation**: `/docs` folder in repository
-   **Issues**: <https://github.com/pdtribe181-prog/-modular-saas-platform/issues>
-   **Stripe Docs**: <https://stripe.com/docs>
-   **Resend Docs**: <https://resend.com/docs>
-   **Let's Encrypt**: <https://letsencrypt.org/docs>

---

**🎉 Deployment Complete!**

Your Advancia PayLedger platform is now running in production.

**Next Steps:**

1. Test all core functionality
2. Configure monitoring and alerts
3. Set up automated backups to off-site storage
4. Document your infrastructure for team members
5. Plan for scaling as user base grows
