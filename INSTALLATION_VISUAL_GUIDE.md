# 🎯 Installation - Visual Guide

## Step 1: Run Installation Script

![Double-click install-dependencies.bat](https://img.shields.io/badge/Step%201-Double%20Click-blue?style=for-the-badge)

**Location:** Project root folder  
**File:** `install-dependencies.bat`

### What You'll See

```
========================================
Advancia Pay - Dependency Installation
========================================

[1/6] Installing backend dependencies...
Installing rate limiting, validation, and encryption packages...
✓ express-rate-limit@7.x.x
✓ express-validator@7.x.x
✓ crypto-js@4.x.x

[2/6] Installing job queue dependencies...
✓ bull@4.x.x
✓ ioredis@5.x.x

[3/6] Running Prisma migration...
✓ Migration complete: add_job_queue_and_security

[4/6] Installing frontend dependencies...
✓ crypto-js@4.x.x
✓ dompurify@3.x.x

[5/6] Removing optional educational files...
✓ Removed: JAVASCRIPT_REACT_CONCEPTS.md
✓ Removed: SecureLogin.tsx
✓ Removed: SafeUserProfile.tsx
✓ Removed: SecureLoginFormComplete.tsx

[6/6] Verifying installations...
Backend packages:
express-rate-limit@7.x.x
express-validator@7.x.x
crypto-js@4.x.x
bull@4.x.x
ioredis@5.x.x

Frontend packages:
crypto-js@4.x.x
dompurify@3.x.x

========================================
Installation Complete!
========================================

Press any key to continue...
```

**Duration:** 2-3 minutes  
**Download size:** ~2MB

---

## Step 2: Start Redis

![Double-click setup-redis.bat](https://img.shields.io/badge/Step%202-Double%20Click-green?style=for-the-badge)

**Location:** Project root folder  
**File:** `setup-redis.bat`

### Prerequisites

-   ✅ Docker Desktop installed and running
-   ✅ Port 6379 available

### What You'll See

```
========================================
Advancia Pay - Redis Setup
========================================

Docker found! Starting Redis container...

Starting Redis on port 6379...
advancia-redis

========================================
Redis is now running!
========================================

Container name: advancia-redis
Port: 6379
Image: redis:alpine

Testing connection...
PONG

Redis is responding correctly!

Press any key to continue...
```

**Duration:** 30 seconds

---

## Step 3: Start Development Servers

![Double-click start-dev.bat](https://img.shields.io/badge/Step%203-Double%20Click-orange?style=for-the-badge)

**Location:** Project root folder  
**File:** `start-dev.bat`

### What Happens

1. ✅ Checks dependencies (installs if missing)
2. ✅ Checks Redis (starts if not running)
3. ✅ Opens 2 new command windows:
   -   Backend window (port 4000)
   -   Frontend window (port 3000)

### Backend Window

```
> advancia-pay-backend@1.0.0 dev
> nodemon src/index.ts

[nodemon] starting `ts-node src/index.ts`
Job queues initialized { queues: [ 1, 2, 3, 4, 5 ] }
Server running on port 4000
Connected to Redis
Socket.IO initialized
```

### Frontend Window

```
> advancia-pay-frontend@1.0.0 dev
> next dev

  ▲ Next.js 14.0.0
  - Local:        http://localhost:3000
  - Network:      http://192.168.1.100:3000

✓ Ready in 3.2s
```

**Duration:** 10-15 seconds

---

## ✅ Verification Checklist

### 1. Backend is Running

Open: <http://localhost:4000/api/health>

**Expected:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. Job Queue is Working

Open: <http://localhost:4000/api/jobs/metrics>  
_(Need admin token in Authorization header)_

**Expected:**

```json
{
  "success": true,
  "metrics": {
    "CRITICAL": { "waiting": 0, "active": 0, "completed": 0, "failed": 0 },
    "HIGH": { "waiting": 0, "active": 0, "completed": 0, "failed": 0 },
    "MEDIUM": { "waiting": 0, "active": 0, "completed": 0, "failed": 0 },
    "LOW": { "waiting": 0, "active": 0, "completed": 0, "failed": 0 },
    "BATCH": { "waiting": 0, "active": 0, "completed": 0, "failed": 0 }
  }
}
```

### 3. Frontend is Running

Open: <http://localhost:3000>

**Expected:** Advancia Pay login page loads

### 4. Redis is Running

Run in command prompt:

```cmd
docker ps
```

**Expected:**

```
CONTAINER ID   IMAGE          STATUS        PORTS                    NAMES
abc123def456   redis:alpine   Up 5 minutes  0.0.0.0:6379->6379/tcp   advancia-redis
```

---

## 🚨 Common Issues & Solutions

### Issue 1: "Docker is not installed"

**Solution:**

1. Download: <https://www.docker.com/products/docker-desktop>
2. Install Docker Desktop
3. Restart computer
4. Start Docker Desktop
5. Run `setup-redis.bat` again

---

### Issue 2: "npm is not recognized"

**Solution:**

1. Download Node.js: <https://nodejs.org/> (LTS version)
2. Run installer (default settings)
3. Restart computer
4. Run `install-dependencies.bat` again

---

### Issue 3: "Port 4000 already in use"

**Solution A - Find and kill process:**

```cmd
netstat -ano | findstr :4000
taskkill /PID <process_id> /F
```

**Solution B - Change port:**
Edit `backend/.env`:

```env
PORT=4001
```

---

### Issue 4: "Port 6379 already in use"

**Solution:**

```cmd
docker stop advancia-redis
docker rm advancia-redis
```

Then run `setup-redis.bat` again

---

### Issue 5: Prisma migration fails

**Solution:**

```cmd
cd backend
npx prisma migrate reset
npx prisma migrate dev --name initial
```

---

## 🎨 File Structure After Installation

```
-modular-saas-platform/
├── 📜 install-dependencies.bat    ← Double-click first
├── 📜 setup-redis.bat             ← Double-click second
├── 📜 start-dev.bat               ← Double-click daily
├── 📄 SETUP_SCRIPTS_README.md     ← You are here
├── 📄 JOB_QUEUE_QUICK_START.md
├── 📄 JOB_QUEUE_GUIDE.md
├── backend/
│   ├── node_modules/
│   │   ├── express-rate-limit/    ✅ Installed
│   │   ├── express-validator/     ✅ Installed
│   │   ├── crypto-js/             ✅ Installed
│   │   ├── bull/                  ✅ Installed
│   │   └── ioredis/               ✅ Installed
│   ├── prisma/
│   │   └── migrations/
│   │       └── XXX_add_job_queue_and_security/  ✅ Created
│   └── src/
│       ├── services/
│       │   └── jobQueue.ts        ✅ Ready
│       └── routes/
│           └── jobs.ts            ✅ Ready
└── frontend/
    └── node_modules/
        ├── crypto-js/             ✅ Installed
        └── dompurify/             ✅ Installed
```

---

## 📊 System Resources

### During Installation

-   💾 Disk space: +150MB
-   🌐 Network: ~2MB download
-   ⏱️ Time: 2-3 minutes

### During Development

-   💾 RAM: ~500MB (backend + frontend + Redis)
-   🔌 Ports: 3000, 4000, 6379
-   💻 CPU: Low (~5%)

---

## 🎯 Next Steps

After successful installation:

### 1. Test Job Queue

```cmd
curl -X POST http://localhost:4000/api/jobs/test/otp ^
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"code\":\"123456\"}"
```

### 2. Update Your Routes

Replace blocking operations with job queue:

**Before:**

```typescript
await sendPasswordResetEmail(email, token); // Blocks 2-5 seconds
```

**After:**

```typescript
await sendPasswordResetJob(email, token); // Returns in < 50ms
```

### 3. Deploy to Production

1. Set up Redis on Render ($7/month)
2. Push to GitHub
3. Configure environment variables
4. Merge PR to trigger deployment

---

## 📞 Support

### Documentation

-   `SETUP_SCRIPTS_README.md` ← Overview (this file)
-   `JOB_QUEUE_QUICK_START.md` ← Quick reference
-   `JOB_QUEUE_GUIDE.md` ← Complete guide
-   `RATE_LIMITING_GUIDE.md` ← Rate limiting patterns
-   `FORM_SECURITY_GUIDE.md` ← Form security

### Code

-   `backend/src/services/jobQueue.ts` ← Job queue implementation
-   `backend/src/routes/jobs.ts` ← Admin API
-   `backend/src/middleware/rateLimiting.ts` ← Rate limiters

---

## 🎉 Success

When you see:

-   ✅ "Installation Complete!" message
-   ✅ Backend running on port 4000
-   ✅ Frontend running on port 3000
-   ✅ Redis container running
-   ✅ Job queue metrics accessible

**You're ready to develop!**

Happy coding! 🚀
