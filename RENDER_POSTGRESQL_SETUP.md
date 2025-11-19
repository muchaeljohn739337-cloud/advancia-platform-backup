# 🐘 Render PostgreSQL Setup Guide

## Quick Setup (2 Minutes)

### Step 1: Create Database on Render

1. **Go to**: https://dashboard.render.com/new/database
2. **Fill in**:

   - Name: `advancia-db`
   - Database: `advancia_db`
   - User: (auto-generated)
   - Region: **Oregon (US West)** ← Recommended
   - PostgreSQL Version: **16**
   - Datadog API Key: (leave empty)
   - Plan: **Starter** ($7/month) or **Free** (90 days)

3. **Click**: "Create Database"

### Step 2: Copy Connection String

After creation (takes ~2 minutes), you'll see:

```
Internal Database URL (use this for Render services):
postgresql://advancia_db_user:xxx@dpg-xxx-a.oregon-postgres.render.com/advancia_db

External Database URL (use this for local development):
postgresql://advancia_db_user:xxx@dpg-xxx-a.oregon-postgres.render.com/advancia_db
```

**IMPORTANT**: Both URLs are the same. The "Internal" URL is optimized for Render services (same region = faster).

### Step 3: Update Backend Environment

#### Option A: If Backend is on Render

1. Go to your backend web service
2. Navigate to **Environment** tab
3. Add variable:
   ```
   DATABASE_URL=postgresql://advancia_db_user:xxx@dpg-xxx-a.oregon-postgres.render.com/advancia_db
   ```
4. Click "Save Changes" (auto-redeploys)

#### Option B: If Backend is on Digital Ocean

```bash
# SSH into your droplet
ssh root@your-droplet-ip

# Update .env file
cd /var/www/advancia-backend
nano .env

# Update the DATABASE_URL line:
DATABASE_URL=postgresql://advancia_db_user:xxx@dpg-xxx-a.oregon-postgres.render.com/advancia_db

# Save and exit (Ctrl+X, Y, Enter)

# Restart backend
pm2 restart advancia-backend
```

#### Option C: Local Development

```bash
# Update backend/.env
cd backend
echo "DATABASE_URL=postgresql://advancia_db_user:xxx@dpg-xxx-a.oregon-postgres.render.com/advancia_db" > .env.production
```

---

## 🔄 Run Database Migrations

After connecting to Render PostgreSQL, run migrations to create tables:

### From Local Machine

```bash
cd backend

# Set the Render PostgreSQL URL
$env:DATABASE_URL = "postgresql://advancia_db_user:xxx@dpg-xxx-a.oregon-postgres.render.com/advancia_db"

# Run migrations
npx prisma migrate deploy

# Verify tables created
npx prisma studio
```

### From Render Web Service (Automatic)

Update your **Build Command** in Render dashboard:

```bash
cd backend && npm install && npx prisma migrate deploy && npm run build
```

This runs migrations automatically on every deploy.

---

## 🧪 Test Connection

### Using psql CLI

```bash
# Install PostgreSQL client (if not installed)
# Windows: choco install postgresql
# Mac: brew install postgresql
# Linux: sudo apt install postgresql-client

# Connect to Render database
psql "postgresql://advancia_db_user:xxx@dpg-xxx-a.oregon-postgres.render.com/advancia_db"

# Test query
SELECT version();
\dt  # List tables
\q   # Exit
```

### Using Node.js

```javascript
// test-db.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://advancia_db_user:xxx@dpg-xxx-a.oregon-postgres.render.com/advancia_db",
    },
  },
});

async function main() {
  const result = await prisma.$queryRaw`SELECT version()`;
  console.log("✅ Database connected:", result);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

```bash
node test-db.js
```

### Via Backend Health Endpoint

```bash
# Start your backend
npm run dev

# Check health endpoint
curl http://localhost:4000/api/health
# Should return: {"status":"ok","database":"connected"}
```

---

## 📊 Render Database Features

### Free Plan ($0/month - 90 days)

- ✅ 1 GB storage
- ✅ SSL encryption
- ✅ Shared CPU
- ❌ No backups
- ❌ Expires after 90 days
- 📊 Perfect for: Testing, development

### Starter Plan ($7/month)

- ✅ 10 GB storage
- ✅ SSL encryption
- ✅ Shared CPU
- ✅ **Daily automatic backups**
- ✅ **No expiry**
- ✅ 99.9% uptime SLA
- 📊 Perfect for: Production, small to medium apps

### Pro Plan ($21/month)

- ✅ 100 GB storage
- ✅ SSL encryption
- ✅ Dedicated CPU
- ✅ **Daily automatic backups**
- ✅ Point-in-time recovery
- ✅ 99.99% uptime SLA
- 📊 Perfect for: High-traffic production apps

---

## 🔒 Security Best Practices

### 1. Connection String Security

```bash
# ❌ NEVER commit connection strings to Git
echo ".env" >> .gitignore
echo ".env.production" >> .gitignore
echo ".env.local" >> .gitignore

# ✅ Use environment variables
# In Vercel, Render, or Digital Ocean dashboard
```

### 2. SSL/TLS Enforcement

Render PostgreSQL **requires SSL** by default. Your connection string automatically includes `?sslmode=require`.

If you see SSL errors, add to connection string:

```
?sslmode=require
```

### 3. IP Whitelisting (Optional)

For extra security:

1. Go to Render dashboard → Your database → Access Control
2. Add your IP addresses
3. Only whitelisted IPs can connect

**Note**: This may break your app if your server IP changes!

### 4. Read-Only Users (Advanced)

Create read-only users for analytics/reporting:

```sql
-- Connect to database as admin
psql "postgresql://..."

-- Create read-only user
CREATE USER analytics_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE advancia_db TO analytics_user;
GRANT USAGE ON SCHEMA public TO analytics_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO analytics_user;
```

---

## 💾 Backups & Restore

### Automatic Backups (Starter/Pro plans)

- **Frequency**: Daily at 2 AM UTC
- **Retention**: 7 days (Starter), 30 days (Pro)
- **Location**: Same region as database

### Manual Backup

```bash
# Using pg_dump
pg_dump "postgresql://user:pass@host/db" > backup_$(date +%Y%m%d).sql

# Compress backup
gzip backup_*.sql
```

### Restore from Backup

```bash
# From Render dashboard backup
# 1. Download backup file from Render dashboard
# 2. Restore:
psql "postgresql://user:pass@host/db" < backup.sql

# Or use Render's one-click restore
```

---

## 📈 Monitoring & Performance

### View Database Metrics

Render Dashboard → Your Database:

- **Connections**: Current active connections
- **Storage**: Used/total storage
- **CPU/Memory**: Resource usage
- **Queries**: Slow queries log

### Enable Query Logging

```sql
-- Enable slow query logging (queries > 1 second)
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();
```

### Optimize Performance

```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('advancia_db'));

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Vacuum and analyze
VACUUM ANALYZE;
```

---

## 🚨 Troubleshooting

### Connection Timeout

```bash
# Error: connection timeout
# Fix: Check if database is suspended (Free plan after 90 days)
# Solution: Upgrade to Starter plan or create new free database
```

### SSL Certificate Error

```bash
# Error: SSL certificate verification failed
# Fix 1: Add sslmode to connection string
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# Fix 2: Disable SSL verification (NOT RECOMMENDED for production)
DATABASE_URL="postgresql://user:pass@host/db?sslmode=no-verify"
```

### Too Many Connections

```bash
# Error: too many connections
# Fix: Check connection pool settings

# In Prisma schema:
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  connection_limit = 10  // Reduce if needed
}

# Or use connection pooling (Render Pro plan includes PgBouncer)
```

### Slow Queries

```bash
# Enable logging
ALTER SYSTEM SET log_statement = 'all';
SELECT pg_reload_conf();

# View logs in Render dashboard → Logs tab

# Create indexes for frequently queried columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
```

---

## 🔄 Migration from Other Databases

### From Local PostgreSQL

```bash
# Export from local
pg_dump -h localhost -U postgres -d advancia_db > local_backup.sql

# Import to Render
psql "postgresql://user:pass@host.render.com/advancia_db" < local_backup.sql
```

### From Heroku PostgreSQL

```bash
# Get Heroku connection string
heroku config:get DATABASE_URL -a your-app

# Export from Heroku
heroku pg:backups:capture -a your-app
heroku pg:backups:download -a your-app

# Import to Render
pg_restore --no-acl --no-owner -d "postgresql://user:pass@host.render.com/db" latest.dump
```

---

## 💰 Cost Optimization Tips

1. **Start with Free**: Test with free plan (90 days)
2. **Upgrade when needed**: Move to Starter ($7/mo) before expiry
3. **Monitor storage**: Delete old data to stay within limits
4. **Use connection pooling**: Reduce connection overhead
5. **Optimize queries**: Add indexes to speed up queries

---

## 📚 Resources

- **Render PostgreSQL Docs**: https://render.com/docs/databases
- **Prisma with PostgreSQL**: https://www.prisma.io/docs/concepts/database-connectors/postgresql
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **Connection Pooling**: https://render.com/docs/connection-pooling

---

## ✅ Setup Checklist

- [ ] Render account created
- [ ] PostgreSQL database created (Free or Starter)
- [ ] Connection string copied
- [ ] Backend `DATABASE_URL` updated
- [ ] Prisma migrations run (`npx prisma migrate deploy`)
- [ ] Database connection tested
- [ ] Automatic backups enabled (Starter/Pro plans)
- [ ] SSL/TLS verified
- [ ] Monitoring dashboard reviewed

**Your Render PostgreSQL is ready! 🐘**
