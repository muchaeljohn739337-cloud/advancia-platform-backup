# Quick Deployment Commands - Digital Ocean

## Your SSH Public Key (Already Generated)

```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQC7inSMlci8FZsZ88LsRaG1U1FqpiTUGd8UjCVAYNkE/D3c8a+dnz+/CjAs2VoChmJ/Yl6ES5rQeOAr94FPRjtoK9tr6mMBBte3K8pI34i9E+vELcl7l12WNDKmAp/6klT1eioB79w8G/0dlCWzsqCrqRb4HKIFlDDJzco9mgUGVnexegDMbo5Q6kofN6scWsDvMdK59ohBq+w5Q/lyvTiL0M9dfXdbYLpXMWb0OBASdYnsyd/XR7NTzrBDdJfeoE5rorlhuxj95qmAUwktIy/YeJz11BkoQHkPAUwVLp2KD9qWgGKZ3xdd+X3H9aihXtM9UXRwYl3grHubvvgmt2Dg5IWfW6Uex6wF2tkR7y7ZwLNXaCqfnWYfw7kF9/ZZYi0ATbPXfnTUUkY/5Iv2gthKX1Niaf4+JRVWRlN3+PM+UtjkCSqfg8vyWqDzWiRTSRe8k2aWEKVzG/MmYfde0frpAcYMBD4h4Uild8ZRffz9IeSlvBlUEiXVjBLO2DqxW+parmnnZBcCCRzTsODN7he+w8wKzjMXTFhuI3qAAvFLq//2cLBANtPL4zQiqpSL8xkn5z3MDnV0L4qKOyEwI6R50Fcuk46lRZ4F//3VcC07LoV87WEBxu7KRBS97kawaQPKRT4Bzd573DJj4mJESxUyZI490Ot7foMoqqvDcI8uNw== advancia-deploy
```

## Step-by-Step Checklist

### ✅ Phase 1: Digital Ocean Account Setup (5 minutes)

**1.1 Add SSH Key to Digital Ocean:**

- [ ] Go to: https://cloud.digitalocean.com/account/security
- [ ] Click "Add SSH Key"
- [ ] Paste the SSH key above
- [ ] Name: "Advancia Deploy"
- [ ] Click "Add SSH Key"

**1.2 Create Droplet:**

- [ ] Go to: https://cloud.digitalocean.com/droplets/new
- [ ] Choose Image: **Ubuntu 22.04 LTS**
- [ ] Choose Plan: **$6/month** (1GB RAM, 1 vCPU) or **$18/month** (2GB RAM, 2 vCPUs)
- [ ] Choose Region: **New York 3** (or closest to users)
- [ ] Authentication: Select **"Advancia Deploy"** SSH key
- [ ] Hostname: **advancia-backend**
- [ ] Tags: production, backend, nodejs
- [ ] Click **"Create Droplet"**
- [ ] **Copy the IPv4 address** (e.g., 164.90.123.45)

---

### ✅ Phase 2: Database Setup (5 minutes)

**Option A: Render PostgreSQL (Recommended)**

- [ ] Go to: https://dashboard.render.com/new/database
- [ ] Name: **advancia-db**
- [ ] Database: **advancia_db**
- [ ] Region: **Oregon (US West)** (free) or same as droplet
- [ ] Plan: **Free** (90 days) or **Starter** ($7/month)
- [ ] Click "Create Database"
- [ ] Wait 2-3 minutes
- [ ] Copy **"Internal Database URL"**
- [ ] Format: `postgresql://user:pass@host.render.com/advancia_db`

---

### ✅ Phase 3: Configure Environment (5 minutes)

**3.1 Update .env.production file:**

```powershell
cd C:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform\backend

# Edit .env.production
notepad .env.production
```

**Replace these values:**

```bash
# CRITICAL: Update these values
DATABASE_URL=postgresql://YOUR_RENDER_DATABASE_URL_HERE
JWT_SECRET=YOUR_SECRET_HERE  # Generate: openssl rand -base64 32
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Update after Vercel deployment
FRONTEND_URL=https://your-app.vercel.app
ALLOWED_ORIGINS=https://your-app.vercel.app

# Optional: Add Stripe keys
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
```

---

### ✅ Phase 4: Deploy Backend (20 minutes)

**4.1 Test SSH Connection:**

```powershell
# Replace with YOUR droplet IP
$DROPLET_IP = "YOUR_DROPLET_IP_HERE"

# Test connection
ssh root@$DROPLET_IP "echo 'Connected successfully!'"
```

**4.2 Run Deployment Script:**

```powershell
cd C:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform\backend

# Copy .env.production to .env for deployment
Copy-Item .env.production .env

# Deploy
.\deploy-digitalocean.ps1 -DropletIP $DROPLET_IP
```

**Expected output:**

```
✅ Prerequisites checked
✅ SSH connection successful
✅ Droplet setup complete
✅ Application built
✅ Files deployed
✅ Environment configured
✅ Application running with PM2
✅ nginx configured
✅ Firewall configured
✅ Health check passed

🎉 Deployment successful!
Your backend is now running at: http://YOUR_DROPLET_IP
```

**4.3 Verify Deployment:**

```powershell
# Test health endpoint
curl http://$DROPLET_IP/api/health

# Expected: {"status":"healthy","service":"advancia-backend"}
```

---

### ✅ Phase 5: Deploy Frontend (10 minutes)

**5.1 Update Frontend API URL:**

```powershell
cd C:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform\frontend

# Edit .env.production
@"
NEXT_PUBLIC_API_URL=http://YOUR_DROPLET_IP
NEXT_PUBLIC_WS_URL=ws://YOUR_DROPLET_IP
"@ | Out-File -FilePath .env.production -Encoding utf8
```

**5.2 Deploy to Vercel:**

```powershell
# Login (if not already)
vercel login

# Deploy production
vercel --prod

# Follow prompts, copy deployment URL
```

**5.3 Update Backend CORS:**

```powershell
# SSH to droplet
ssh root@$DROPLET_IP

# Edit .env
cd /var/www/advancia-backend
nano .env

# Update:
# FRONTEND_URL=https://your-app.vercel.app
# ALLOWED_ORIGINS=https://your-app.vercel.app

# Restart
pm2 restart advancia-backend
exit
```

---

### ✅ Phase 6: Setup Domain & SSL (Optional, 10 minutes)

**6.1 Point Domain to Droplet:**

In your DNS provider (Cloudflare, Namecheap):

```
Type: A
Name: api
Value: YOUR_DROPLET_IP
TTL: Auto
```

**6.2 Install SSL Certificate:**

```bash
ssh root@$DROPLET_IP

# Update nginx config
nano /etc/nginx/sites-available/advancia-backend
# Change: server_name _; → server_name api.yourdomain.com;

# Install certbot
apt install -y certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d api.yourdomain.com

# Follow prompts, choose redirect HTTP to HTTPS
```

---

## Quick Reference Commands

### Monitor Backend

```powershell
# View logs
ssh root@$DROPLET_IP 'pm2 logs advancia-backend'

# View status
ssh root@$DROPLET_IP 'pm2 status'

# Restart backend
ssh root@$DROPLET_IP 'pm2 restart advancia-backend'
```

### Update Backend

```powershell
cd C:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform\backend
.\deploy-digitalocean.ps1 -DropletIP $DROPLET_IP
```

### Database Operations

```powershell
# SSH to droplet
ssh root@$DROPLET_IP

# Run migrations
cd /var/www/advancia-backend
npx prisma migrate deploy

# Open Prisma Studio
npx prisma studio
```

---

## Troubleshooting

### Backend Won't Start

```bash
ssh root@$DROPLET_IP
pm2 logs advancia-backend --lines 100
```

### Database Connection Failed

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Port Not Accessible

```bash
# Check firewall
ufw status

# Check if app is running
pm2 status

# Check nginx
systemctl status nginx
```

---

## Your Deployment URLs (Fill in after deployment)

- **Droplet IP**: `_________________`
- **Backend API**: `http://___________________/api`
- **Frontend**: `https://___________________.vercel.app`
- **Database**: `https://dashboard.render.com/databases`

---

## Next Actions

**Immediate (After Deployment):**

- [ ] Test all API endpoints
- [ ] Test frontend-backend connection
- [ ] Verify tracing is working
- [ ] Run security scan: `.\scripts\security-test.ps1`

**Within 24 Hours:**

- [ ] Setup monitoring (Sentry)
- [ ] Configure automated backups
- [ ] Setup domain and SSL
- [ ] Load testing

**Within 1 Week:**

- [ ] External penetration test
- [ ] Performance optimization
- [ ] Setup CI/CD pipeline
- [ ] Team training

---

## Support Resources

- **Full Guide**: `DEPLOYMENT_WALKTHROUGH.md`
- **Digital Ocean Docs**: https://docs.digitalocean.com/
- **Render Docs**: https://render.com/docs
- **PM2 Docs**: https://pm2.keymetrics.io/docs/

---

**Status**: Ready to deploy  
**Estimated Time**: 30-45 minutes  
**Difficulty**: Medium

🚀 **Let's deploy!**
