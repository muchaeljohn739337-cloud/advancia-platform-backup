# DigitalOcean Migration Guide

Complete step-by-step guide to migrate from Render + Vercel to DigitalOcean Droplets.

## Phase 1: Preparation (Before Droplet Setup)

### 1.1 Collect Current Configuration

```bash
# Backup current environment variables
# From Render backend dashboard: Settings → Environment
# From Vercel frontend dashboard: Settings → Environment Variables
# Store in a secure location (encrypted password manager)
```

### 1.2 Generate SSH Key for GitHub Actions

On your local machine:

```bash
# Generate SSH key (no passphrase for GitHub Actions)
ssh-keygen -t ed25519 -f do_github_key -N ""

# This creates:
# - do_github_key (private key - keep secret)
# - do_github_key.pub (public key - add to droplet)
```

### 1.3 Set Up DigitalOcean Account

1. **Create DigitalOcean Account** at https://digitalocean.com
2. **Generate API Token**:
   - Account → API → Personal Access Tokens → Generate New Token
   - Scopes: "read" + "write"
   - Save token (you'll use it in droplet creation)

## Phase 2: Create DigitalOcean Droplet

### 2.1 Create Droplet via DigitalOcean Dashboard

1. **Click "Create" → "Droplet"**
2. **Choose Image**: Ubuntu 24.04 LTS
3. **Choose Plan**:
   - **Minimum**: $6/month (1 vCPU, 1GB RAM) - for testing
   - **Recommended**: $12/month (2 vCPU, 2GB RAM) - for production
4. **Authentication**: Select SSH Key
   - If no key exists: Click "New SSH Key"
   - Paste your **public key** (`do_github_key.pub` content)
   - Name it: `github-actions`
5. **Region**: Choose closest to your users (e.g., New York, San Francisco)
6. **Hostname**: `advancia-saas-prod`
7. **Click "Create Droplet"**

### 2.2 Note Droplet Information

After creation, save:

- **Droplet IP**: (shown on dashboard)
- **Region**: (e.g., New York 1)
- **Password**: (if using password auth - optional if SSH key added)

## Phase 3: Initial Droplet Setup

### 3.1 SSH into Droplet

```bash
ssh -i do_github_key root@<YOUR_DROPLET_IP>
```

### 3.2 Run Setup Script

```bash
# Download and run the setup script
curl -fsSL https://raw.githubusercontent.com/muchaeljohn739337-cloud/-modular-saas-platform/main/scripts/setup-do-droplet.sh | bash

# This will:
# ✅ Update system packages
# ✅ Install Docker & Docker Compose
# ✅ Install Node.js, Git, UFW firewall
# ✅ Create app directories
# ✅ Clone the repository
# ✅ Create .env.production template
```

### 3.3 Configure Environment Variables

Edit the environment file:

```bash
nano /app/.env.production
```

Update all `CHANGE_ME` values with your actual secrets:

```env
# Database - Keep existing PostgreSQL on different droplet or DigitalOcean Managed DB
DATABASE_URL=postgresql://advancia_user:YOUR_STRONG_PASSWORD@your-postgres-host:5432/advancia_prod

# JWT & Security
JWT_SECRET=$(openssl rand -base64 32)  # Generate random secret

# Frontend/Backend URLs (update after DNS setup)
FRONTEND_URL=https://advanciapayledger.com
BACKEND_URL=https://api.advanciapayledger.com

# All API keys (Stripe, Cryptomus, Email, AWS, Sentry, etc.)
# Copy from your current Render environment
```

### 3.4 Test Docker Compose Locally

```bash
cd /app/modular-saas-platform

# Build images
docker-compose -f docker-compose.prod.yml build

# Run migrations
docker-compose -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Verify
curl http://localhost:4000/api/health
curl http://localhost:3000
```

## Phase 4: Configure SSL & DNS

### 4.1 Set Up SSL Certificate

**Option A: Let's Encrypt (Recommended - Free)**

```bash
# Install Certbot
apt-get install -y certbot python3-certbot-nginx

# Generate certificate
certbot certonly --standalone \
  -d advanciapayledger.com \
  -d www.advanciapayledger.com \
  -d api.advanciapayledger.com \
  --non-interactive \
  --agree-tos \
  -m your-email@example.com

# Copy certificates to /app/certs
mkdir -p /app/certs
cp /etc/letsencrypt/live/advanciapayledger.com/fullchain.pem /app/certs/
cp /etc/letsencrypt/live/advanciapayledger.com/privkey.pem /app/certs/
```

**Option B: Keep CloudFlare Origin Certificates**

```bash
# Use your existing CloudFlare certificates
# No additional setup needed - CloudFlare handles SSL
```

### 4.2 Update CloudFlare DNS

1. **Go to CloudFlare Dashboard**
2. **Select your domain**: `advanciapayledger.com`
3. **Go to DNS Records**
4. **Update DNS Records**:

```
A Record:
  Name: advanciapayledger.com
  IPv4: YOUR_DROPLET_IP
  Proxied: Yes (orange cloud)

A Record:
  Name: www.advanciapayledger.com
  IPv4: YOUR_DROPLET_IP
  Proxied: Yes

CNAME Record:
  Name: api.advanciapayledger.com
  Target: advanciapayledger.com
  Proxied: Yes
```

5. **Wait for DNS Propagation** (can take up to 24 hours)

## Phase 5: GitHub Actions Setup

### 5.1 Add GitHub Secrets

In your GitHub repository: **Settings → Secrets and Variables → Actions**

Add these secrets:

```
DO_DROPLET_IP         = your-droplet-ip-address
DO_SSH_KEY            = (content of do_github_key private key)
DO_APP_TOKEN          = (optional - DigitalOcean API token)
DATABASE_URL          = postgresql://user:pass@host:5432/db
```

### 5.2 Verify Workflows

Check that these workflows exist and are enabled:

- `.github/workflows/do-auto-deploy.yml` - Auto-deploy on push to main
- `.github/workflows/do-backup-and-migrate.yml` - Scheduled backups & migrations

### 5.3 Test Deployment

1. **Make a small change** to your code:

```bash
git commit --allow-empty -m "test: trigger DO deployment"
git push origin main
```

2. **Monitor GitHub Actions**:
   - Go to repository → Actions
   - Watch the "Deploy to DigitalOcean" workflow
   - Check logs for any errors

3. **Verify on Droplet**:

```bash
ssh -i do_github_key root@YOUR_DROPLET_IP

# Check services
docker-compose -f /app/modular-saas-platform/docker-compose.prod.yml ps

# Check logs
docker-compose -f /app/modular-saas-platform/docker-compose.prod.yml logs -f backend
```

## Phase 6: Testing & Validation

### 6.1 Health Checks

```bash
# Backend health
curl https://api.advanciapayledger.com/api/health

# Frontend accessibility
curl https://advanciapayledger.com

# System status
curl https://api.advanciapayledger.com/api/system/status
```

### 6.2 Database Verification

```bash
ssh -i do_github_key root@YOUR_DROPLET_IP

# Connect to database
psql "postgresql://advancia_user:PASSWORD@localhost:5432/advancia_prod"

# Check tables
SELECT table_name FROM information_schema.tables WHERE table_schema='public';

# Exit
\q
```

### 6.3 Test User Scenarios

- [ ] User registration
- [ ] Email verification
- [ ] Login with 2FA
- [ ] Transaction creation
- [ ] Payment processing
- [ ] Admin dashboard access
- [ ] File uploads
- [ ] API key authentication

## Phase 7: Decommission Old Services

### 7.1 Verify Everything Works

Wait 24-48 hours and run comprehensive tests:

- Monitor error logs in Sentry (if configured)
- Check performance metrics
- Verify backups are being created
- Test disaster recovery scenario

### 7.2 Scale Down Old Services

Once confident, in order:

1. **Keep Render backend for 1 week** (fallback)
2. **Keep Vercel frontend for 1 week** (fallback)
3. **Disable auto-deploy** on Render/Vercel
4. **Monitor DigitalOcean metrics** for issues
5. **Delete Render services** after 2 weeks
6. **Delete Vercel project** after 2 weeks

### 7.3 Update Documentation

- [ ] Update README with DO architecture
- [ ] Update deployment guide
- [ ] Document backup procedures
- [ ] Update incident response playbook

## Troubleshooting

### Docker Compose Won't Start

```bash
# Check logs
docker-compose -f /app/modular-saas-platform/docker-compose.prod.yml logs

# Rebuild images
docker-compose -f /app/modular-saas-platform/docker-compose.prod.yml build --no-cache

# Remove volumes and restart
docker-compose -f /app/modular-saas-platform/docker-compose.prod.yml down -v
docker-compose -f /app/modular-saas-platform/docker-compose.prod.yml up -d
```

### Database Connection Fails

```bash
# Test connection directly
PGPASSWORD=YOUR_PASSWORD psql -h localhost -U advancia_user -d advancia_prod -c "SELECT 1"

# Check PostgreSQL is running
docker-compose -f /app/modular-saas-platform/docker-compose.prod.yml ps postgresql
```

### SSL Certificate Issues

```bash
# Check certificate expiration
openssl x509 -in /etc/letsencrypt/live/advanciapayledger.com/fullchain.pem -noout -dates

# Renew certificate
certbot renew --force-renewal

# Restart Nginx
docker-compose -f /app/modular-saas-platform/docker-compose.prod.yml restart nginx
```

### GitHub Actions SSH Fails

```bash
# Verify SSH key is correct
ssh-keygen -y -f do_github_key
# Should output the public key - compare with /root/.ssh/authorized_keys on droplet

# Test SSH locally
ssh -i do_github_key root@YOUR_DROPLET_IP "echo Test successful"
```

## Performance Tuning

### Monitor Droplet Resources

```bash
ssh -i do_github_key root@YOUR_DROPLET_IP

# Real-time monitoring
htop

# Docker stats
docker stats

# Disk usage
df -h
du -sh /app/*
```

### Scale Droplet if Needed

If CPU/RAM is consistently high:

1. Resize droplet in DigitalOcean dashboard
2. Choose larger plan ($18/month 4vCPU/4GB or higher)
3. Power off droplet
4. Resize
5. Power on and verify services

## Backup & Disaster Recovery

### Test Restore Process

Monthly, test that backups can be restored:

```bash
ssh -i do_github_key root@YOUR_DROPLET_IP

# List backups
ls -lh /app/backups/

# Test restore to new database
# 1. Create new test database
# 2. Restore from backup
# 3. Verify data integrity
# 4. Delete test database
```

### Automated Backups

Backups run daily via GitHub Actions workflow:

- **Time**: 3 AM UTC
- **Location**: `/app/backups/` on droplet
- **Retention**: 30 days local, longer in S3
- **Upload**: Automatically to AWS S3 (if configured)

## Monthly Maintenance

- [ ] Check for system updates: `apt list --upgradable`
- [ ] Review Docker image versions: `docker images`
- [ ] Test backup restore procedure
- [ ] Monitor Sentry for new errors
- [ ] Review CloudFlare analytics
- [ ] Check SSL certificate expiration
- [ ] Verify GitHub Actions workflows successful

---

**Questions?** Review the architecture guide at `DEPLOYMENT_ARCHITECTURE.md`
