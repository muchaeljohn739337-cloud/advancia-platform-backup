# DigitalOcean Deployment Guide

Quick reference for deploying and managing the application on DigitalOcean.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Deployment Process](#deployment-process)
3. [Manual Deployment](#manual-deployment)
4. [Scaling & Performance](#scaling--performance)
5. [Monitoring & Logs](#monitoring--logs)
6. [Backup & Recovery](#backup--recovery)
7. [Troubleshooting](#troubleshooting)

## Architecture Overview

### Infrastructure

```
┌─────────────────────────────────────────────────────┐
│               DigitalOcean Droplet                   │
│            (Ubuntu 24.04 LTS + Docker)               │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │            Nginx Reverse Proxy                │   │
│  │  (ports 80/443, SSL termination)             │   │
│  └──────┬──────────────────────┬────────────────┘   │
│         │                      │                     │
│    ┌────▼──────────────┐  ┌────▼──────────────┐    │
│    │  Backend (4000)   │  │  Frontend (3000)  │    │
│    │  Node.js Express  │  │  Next.js App      │    │
│    │  (2 containers)   │  │  (1 container)    │    │
│    └────┬──────────────┘  └───────────────────┘    │
│         │                                           │
│    ┌────▼────────────────────────────────────┐     │
│    │     PostgreSQL + Redis (separate)       │     │
│    │  OR                                      │     │
│    │     DigitalOcean Managed Services       │     │
│    └─────────────────────────────────────────┘     │
│                                                     │
└─────────────────────────────────────────────────────┘

CloudFlare DNS → Droplet IP → Nginx → Backend/Frontend
```

### Services Configuration

**Backend**:

- Port: 4000
- Process: Node.js + Express
- Health Check: `/api/health`
- Auto-restart: Yes (via docker-compose)

**Frontend**:

- Port: 3000
- Process: Next.js (standalone)
- Health Check: `/` returns 200

**Reverse Proxy**:

- Nginx on ports 80/443
- SSL via Let's Encrypt or CloudFlare
- Rate limiting on API endpoints
- Security headers applied

## Deployment Process

### Automated Deployment (Recommended)

Triggered automatically when pushing to `main` branch:

```bash
# 1. Push code to GitHub
git add .
git commit -m "feat: new feature"
git push origin main

# 2. GitHub Actions automatically:
#    - Checks out code
#    - Runs linting/tests
#    - Connects to DO droplet via SSH
#    - Pulls latest code
#    - Builds Docker images
#    - Runs database migrations
#    - Starts services
#    - Runs health checks

# 3. Monitor deployment:
# Go to GitHub Actions tab → "Deploy to DigitalOcean"
```

### Check Deployment Status

```bash
# Via GitHub Actions (easiest)
# GitHub Repo → Actions → "Deploy to DigitalOcean" → Latest run

# Or SSH into droplet
ssh -i ~/.ssh/do_github_key root@YOUR_DROPLET_IP

# Check services
docker-compose -f /app/modular-saas-platform/docker-compose.prod.yml ps

# Check recent logs
docker-compose -f /app/modular-saas-platform/docker-compose.prod.yml logs -f --tail=100
```

## Manual Deployment

### Prerequisites

```bash
# Have SSH access to droplet
ssh -i ~/.ssh/do_github_key root@YOUR_DROPLET_IP

# Verify Docker is running
docker --version
docker-compose --version
```

### Deploy Manually

```bash
# 1. Navigate to app directory
cd /app/modular-saas-platform

# 2. Pull latest code
git fetch origin main
git reset --hard origin/main

# 3. Load environment (if needed)
export $(cat /app/.env.production | xargs)

# 4. Build images (optional, if .Dockerfile changed)
docker-compose -f docker-compose.prod.yml build

# 5. Run database migrations
docker-compose -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy

# 6. Start services
docker-compose -f docker-compose.prod.yml up -d

# 7. Verify deployment
docker-compose -f docker-compose.prod.yml ps

# 8. Check health
curl http://localhost:4000/api/health
curl http://localhost:3000
```

### Rollback Deployment

```bash
# Get previous commit
git log --oneline | head -5

# Checkout previous version
git checkout COMMIT_HASH

# Rebuild and restart
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

## Scaling & Performance

### Monitor Resource Usage

```bash
# SSH into droplet
ssh -i ~/.ssh/do_github_key root@YOUR_DROPLET_IP

# Real-time system monitoring
htop

# Docker container stats
docker stats

# Disk usage
df -h
du -sh /app/*

# Memory usage
free -h

# Network connections
netstat -tulpn | grep LISTEN
```

### Increase Droplet Size

If running out of resources:

1. **Via DigitalOcean Dashboard**:
   - Select droplet
   - Click "Resize" → "Increase RAM/CPU"
   - Select new plan
   - Power off → Resize → Power on

2. **On droplet after resize**:

   ```bash
   # Verify new resources
   lscpu
   free -h

   # Restart services with more resources
   docker-compose -f /app/modular-saas-platform/docker-compose.prod.yml restart
   ```

### Optimize Docker Compose

Edit `/app/modular-saas-platform/docker-compose.prod.yml`:

```yaml
services:
  backend:
    # Increase CPU/memory limits
    deploy:
      resources:
        limits:
          cpus: "2"
          memory: 2G
        reservations:
          cpus: "0.5"
          memory: 512M
```

## Monitoring & Logs

### View Container Logs

```bash
# Backend logs
docker-compose -f /app/modular-saas-platform/docker-compose.prod.yml logs backend

# Frontend logs
docker-compose -f /app/modular-saas-platform/docker-compose.prod.yml logs frontend

# Nginx logs
docker-compose -f /app/modular-saas-platform/docker-compose.prod.yml logs nginx

# Real-time logs
docker-compose -f /app/modular-saas-platform/docker-compose.prod.yml logs -f

# Last 100 lines
docker-compose -f /app/modular-saas-platform/docker-compose.prod.yml logs --tail=100
```

### Check Service Status

```bash
# All services
docker-compose -f /app/modular-saas-platform/docker-compose.prod.yml ps

# Health check endpoint
curl https://api.advanciapayledger.com/api/health

# System status
curl https://api.advanciapayledger.com/api/system/status | jq
```

### Access Prometheus Metrics

If Prometheus is running:

```bash
# Metrics endpoint
curl http://localhost:9090/metrics

# Prometheus UI
# Accessible at: http://droplet-ip:9090
```

## Backup & Recovery

### Automated Backups

Backups run automatically via GitHub Actions:

- **Schedule**: Every day at 3 AM UTC
- **Location**: `/app/backups/` on droplet
- **Retention**: 30 days local
- **Upload**: AWS S3 (if configured)

### Manual Backup

```bash
ssh -i ~/.ssh/do_github_key root@YOUR_DROPLET_IP

# Run backup script
bash /app/modular-saas-platform/scripts/backup-do-db.sh

# Verify backup
ls -lh /app/backups/
```

### Restore from Backup

```bash
ssh -i ~/.ssh/do_github_key root@YOUR_DROPLET_IP

# 1. Locate backup file
ls -lh /app/backups/

# 2. Extract database credentials
source /app/.env.production

# 3. Restore database
BACKUP_FILE="/app/backups/backup_20250114_030000.sql.gz"
PGPASSWORD=$DB_PASSWORD zcat "$BACKUP_FILE" | \
  psql -h localhost -U advancia_user -d advancia_prod

# 4. Verify restoration
psql "postgresql://advancia_user:PASSWORD@localhost:5432/advancia_prod" \
  -c "SELECT COUNT(*) FROM users;"
```

## Troubleshooting

### Services Won't Start

```bash
# Check Docker daemon
systemctl status docker

# Check logs
docker-compose -f /app/modular-saas-platform/docker-compose.prod.yml logs

# Restart Docker
systemctl restart docker

# Rebuild images
docker-compose -f /app/modular-saas-platform/docker-compose.prod.yml build --no-cache

# Start fresh
docker-compose -f /app/modular-saas-platform/docker-compose.prod.yml down -v
docker-compose -f /app/modular-saas-platform/docker-compose.prod.yml up -d
```

### High Memory Usage

```bash
# Check which containers use most memory
docker stats

# Reduce memory limits in docker-compose.prod.yml
# Or increase droplet size

# Clear Docker cache
docker system prune -a

# Restart services
docker-compose -f /app/modular-saas-platform/docker-compose.prod.yml restart
```

### Database Connection Issues

```bash
# Test connection
PGPASSWORD=PASSWORD psql -h localhost -U advancia_user -d advancia_prod -c "SELECT 1"

# Check PostgreSQL status
docker-compose -f /app/modular-saas-platform/docker-compose.prod.yml ps postgresql

# Check PostgreSQL logs
docker-compose -f /app/modular-saas-platform/docker-compose.prod.yml logs postgresql

# Verify DATABASE_URL in environment
grep DATABASE_URL /app/.env.production
```

### SSL Certificate Expired

```bash
# Check certificate
openssl x509 -in /etc/letsencrypt/live/advanciapayledger.com/fullchain.pem -noout -dates

# Renew (Let's Encrypt)
certbot renew --force-renewal

# Restart Nginx
docker-compose -f /app/modular-saas-platform/docker-compose.prod.yml restart nginx
```

### Slow Requests / High Latency

```bash
# Check network
curl -w "Total time: %{time_total}s\n" https://api.advanciapayledger.com/api/health

# Monitor in real-time
docker stats

# Check database query performance
# Run slow query logs (requires Postgres config)

# Analyze Nginx access logs
docker-compose -f /app/modular-saas-platform/docker-compose.prod.yml logs nginx | tail -50
```

### GitHub Actions Deployment Fails

```bash
# Check GitHub Actions logs
# Repo → Actions → Failed workflow → View logs

# Verify SSH credentials
ssh -i ~/.ssh/do_github_key -T git@github.com

# Test SSH to droplet
ssh -i ~/.ssh/do_github_key root@YOUR_DROPLET_IP

# Check if script has execute permissions
chmod +x /app/modular-saas-platform/scripts/*.sh
```

## Emergency Procedures

### Stop All Services

```bash
ssh -i ~/.ssh/do_github_key root@YOUR_DROPLET_IP

docker-compose -f /app/modular-saas-platform/docker-compose.prod.yml down
```

### Restart All Services

```bash
docker-compose -f /app/modular-saas-platform/docker-compose.prod.yml up -d
```

### Emergency Database Backup

```bash
bash /app/modular-saas-platform/scripts/backup-do-db.sh
```

### Disable Deployments (Temporarily)

```bash
# Pause GitHub Actions
# Repo → Actions → Disable workflows

# Or manually run workflow with pause option:
# Repo → Actions → Pause Deployments workflow
```

---

**For initial setup**: See [DIGITALOCEAN_MIGRATION_GUIDE.md](./DIGITALOCEAN_MIGRATION_GUIDE.md)

**For architecture details**: See [DEPLOYMENT_ARCHITECTURE.md](./DEPLOYMENT_ARCHITECTURE.md)
