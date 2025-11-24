# Manual Deployment Completion Guide

## Current Status

✅ Archive uploaded to server (181MB - advancia-deploy.zip)
✅ SSH connection working (with password)
⚠️ Files need to be extracted and services started

## Quick Fix - Run These Commands

### Step 1: Connect to Server

```powershell
ssh -i $HOME\.ssh\advancia_droplet root@157.245.8.131
```

### Step 2: Extract and Deploy (Copy/Paste All)

```bash
# Extract archive
mkdir -p /var/www/advancia
cd /root
unzip -o advancia-deploy.zip -d /var/www/advancia

# Verify extraction
ls -la /var/www/advancia/

# Install backend dependencies
cd /var/www/advancia/backend
npm ci --production

# Setup database
npx prisma generate
npx prisma migrate deploy

# Install frontend dependencies
cd /var/www/advancia/frontend
npm ci --production
npm run build

# Stop any existing PM2 processes
pm2 delete all || true

# Start backend
cd /var/www/advancia/backend
NODE_ENV=production pm2 start src/index.js --name advancia-backend

# Start frontend
cd /var/www/advancia/frontend
NODE_ENV=production pm2 start npm --name advancia-frontend -- start

# Save PM2 configuration
pm2 save

# Check status
pm2 status
pm2 logs --lines 20
```

### Step 3: Test Services

```bash
# Test backend
curl http://localhost:4000/health

# Test frontend
curl -I http://localhost:3000

# Check ports
netstat -tlnp | grep -E '(3000|4000)'
```

## If You See Errors

### Error: "unzip: command not found"

```bash
apt-get update && apt-get install -y unzip
```

### Error: "npm: command not found"

```bash
# Check if Node.js is installed
node --version
npm --version

# If not, install:
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
```

### Error: Database Connection Failed

```bash
# Check PostgreSQL
systemctl status postgresql
systemctl start postgresql

# Create database
sudo -u postgres psql -c "CREATE DATABASE advancia_prod;"
sudo -u postgres psql -c "CREATE USER advancia_user WITH PASSWORD 'AdvanciaSecure2025!';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE advancia_prod TO advancia_user;"
```

### Error: PM2 Processes Keep Crashing

```bash
# View detailed logs
pm2 logs advancia-backend --lines 50
pm2 logs advancia-frontend --lines 50

# Check if .env.production exists
ls -la /var/www/advancia/backend/.env.production
ls -la /var/www/advancia/frontend/.env.production
```

## Verification Checklist

After running the commands above, verify:

-   [ ] PM2 shows 2 processes online (`pm2 status`)
-   [ ] Backend responds: `curl http://localhost:4000/health` returns `{"status":"ok"}`
-   [ ] Frontend responds: `curl -I http://localhost:3000` returns HTTP 200
-   [ ] Ports listening: `netstat -tlnp | grep 4000` and `netstat -tlnp | grep 3000`

## Access Your Application

Once PM2 shows both processes as "online":

-   **Frontend:** <http://157.245.8.131:3000>
-   **Backend:** <http://157.245.8.131:4000/health>

## Useful Commands

```bash
# View logs
pm2 logs

# Restart services
pm2 restart all

# Stop services
pm2 stop all

# Monitor in real-time
pm2 monit

# Save configuration
pm2 save

# Setup auto-start on reboot
pm2 startup systemd
# Then run the command it outputs
```

## If Everything Works

Setup PM2 to start on boot:

```bash
pm2 startup systemd
pm2 save
```

## Need Help?

If you encounter issues, share the output of:

```bash
pm2 status
pm2 logs --lines 30
ls -la /var/www/advancia/
```

---

**After successful deployment, access your app at:**

-   <http://157.245.8.131:3000> (frontend)
-   <http://157.245.8.131:4000> (backend)
