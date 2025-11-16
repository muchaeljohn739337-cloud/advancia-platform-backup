# Next Steps - Production Deployment

## 🎯 Current Status

✅ SSH connected to server (157.245.8.131)
✅ Archive uploaded (181MB)
⏳ Awaiting deployment commands

## 🚀 Complete Deployment Now

You're currently SSH'd into the server. Run these commands:

### Step 1: Extract Archive and Verify

```bash
# Check archive exists
ls -lh /root/advancia-deploy.zip

# Extract
mkdir -p /var/www/advancia
cd /root
unzip -o advancia-deploy.zip -d /var/www/advancia

# Verify extraction
ls -la /var/www/advancia/
```

### Step 2: Setup Backend

```bash
cd /var/www/advancia/backend

# Install dependencies
npm ci --production

# Setup Prisma
npx prisma generate
npx prisma migrate deploy
```

### Step 3: Setup Frontend

```bash
cd /var/www/advancia/frontend

# Install and build
npm ci --production
npm run build
```

### Step 4: Start Services with PM2

```bash
# Clear existing processes
pm2 delete all || true

# Start backend
cd /var/www/advancia/backend
NODE_ENV=production pm2 start src/index.js --name advancia-backend

# Start frontend
cd /var/www/advancia/frontend
NODE_ENV=production pm2 start npm --name advancia-frontend -- start

# Save configuration
pm2 save

# Check status
pm2 status
pm2 logs --lines 20
```

### Step 5: Verify Services

```bash
# Test backend
curl http://localhost:4000/health

# Test frontend
curl -I http://localhost:3000

# Check ports
netstat -tlnp | grep -E '(3000|4000)'
```

## 🔧 Quick Fixes

### If unzip not found:

```bash
apt-get update && apt-get install -y unzip
```

### If database issues:

```bash
systemctl start postgresql
sudo -u postgres psql -c "CREATE DATABASE advancia_prod;"
sudo -u postgres psql -c "CREATE USER advancia_user WITH PASSWORD 'AdvanciaSecure2025!';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE advancia_prod TO advancia_user;"
```

### If PM2 errors:

```bash
pm2 logs --lines 50
```

## ✅ Once Complete

Your application will be accessible at:

- **Frontend:** http://157.245.8.131:3000
- **Backend:** http://157.245.8.131:4000/health

Setup auto-start:

```bash
pm2 startup systemd
pm2 save
```

## 📖 Additional Resources

- `MANUAL_DEPLOYMENT_GUIDE.md` - Detailed deployment guide
- `DEPLOYMENT_STATUS_CHECK.md` - Troubleshooting guide
- `DEPLOYMENT_TROUBLESHOOTING.md` - SSH and connection issues

## 🆘 Need Help?

Share the output of any failed commands and I'll help troubleshoot!
