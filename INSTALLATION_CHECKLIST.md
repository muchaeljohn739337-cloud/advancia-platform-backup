# ✅ Installation Checklist - Advancia Pay

Use this checklist to track your installation progress.

---

## 📦 Phase 1: Install Dependencies

-   [ ] **Step 1.1:** Close all VS Code terminals (to avoid PowerShell conflicts)
-   [ ] **Step 1.2:** Navigate to project root: `c:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform`
-   [ ] **Step 1.3:** Double-click `install-dependencies.bat`
-   [ ] **Step 1.4:** Wait for completion (2-3 minutes)
-   [ ] **Step 1.5:** Verify "Installation Complete!" message appears
-   [ ] **Step 1.6:** Press any key to close

**✅ Success when you see:**

```
[6/6] Verifying installations...
Backend packages:
express-rate-limit@7.x.x
express-validator@7.x.x
crypto-js@4.x.x
bull@4.x.x
ioredis@5.x.x
```

---

## 🐳 Phase 2: Set Up Redis

-   [ ] **Step 2.1:** Make sure Docker Desktop is installed
    -   If not: Download from <https://www.docker.com/products/docker-desktop>
-   [ ] **Step 2.2:** Start Docker Desktop
-   [ ] **Step 2.3:** Wait for Docker to fully start (green indicator)
-   [ ] **Step 2.4:** Double-click `setup-redis.bat`
-   [ ] **Step 2.5:** Wait for Redis container to start (30 seconds)
-   [ ] **Step 2.6:** Verify "Redis is now running!" message
-   [ ] **Step 2.7:** Verify "PONG" response from connection test
-   [ ] **Step 2.8:** Press any key to close

**✅ Success when you see:**

```
Container name: advancia-redis
Port: 6379
Image: redis:alpine

Testing connection...
PONG

Redis is responding correctly!
```

**Verify with:**

```cmd
docker ps
```

Should show: `advancia-redis` container with status "Up"

---

## 🚀 Phase 3: Start Development Servers

-   [ ] **Step 3.1:** Double-click `start-dev.bat`
-   [ ] **Step 3.2:** Wait for 2 command windows to open
    -   Window 1: Backend (port 4000)
    -   Window 2: Frontend (port 3000)
-   [ ] **Step 3.3:** Wait 10-15 seconds for servers to start
-   [ ] **Step 3.4:** Verify backend shows "Server running on port 4000"
-   [ ] **Step 3.5:** Verify frontend shows "Ready in X.Xs"

**✅ Success when you see:**

**Backend Window:**

```
Job queues initialized { queues: [ 1, 2, 3, 4, 5 ] }
Server running on port 4000
Connected to Redis
```

**Frontend Window:**

```
▲ Next.js 14.0.0
- Local:   http://localhost:3000
✓ Ready in 3.2s
```

---

## 🧪 Phase 4: Verify Everything Works

### Test 1: Backend Health Check

-   [ ] Open browser: <http://localhost:4000/api/health>
-   [ ] **Expected:** JSON response with `"status": "ok"`

### Test 2: Frontend Loads

-   [ ] Open browser: <http://localhost:3000>
-   [ ] **Expected:** Advancia Pay login page appears

### Test 3: Redis Connection

-   [ ] Open command prompt
-   [ ] Run: `docker exec advancia-redis redis-cli ping`
-   [ ] **Expected:** Response shows `PONG`

### Test 4: Job Queue Initialized

-   [ ] Check backend command window
-   [ ] **Expected:** See line: `Job queues initialized { queues: [ 1, 2, 3, 4, 5 ] }`

### Test 5: Package Verification

-   [ ] Open command prompt
-   [ ] Run:

  ```cmd
  cd c:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform\backend
  npm list express-rate-limit bull ioredis
  ```

-   [ ] **Expected:** All packages listed without errors

---

## 📝 Phase 5: Update Application Code

### Update Auth Routes

-   [ ] Open: `backend/src/routes/auth.ts`
-   [ ] Replace password reset email with:

  ```typescript
  import { sendPasswordResetJob } from "../services/jobQueue";
  await sendPasswordResetJob(email, token);
  ```

-   [ ] Replace OTP email with:

  ```typescript
  import { sendOTPJob } from "../services/jobQueue";
  await sendOTPJob(email, code);
  ```

### Update Payment Routes

-   [ ] Open: `backend/src/routes/payments.ts`
-   [ ] Wrap webhook processing with job queue:

  ```typescript
  import { jobQueue, JobType, JobPriority } from "../services/jobQueue";
  await jobQueue.addJob(JobType.WEBHOOK_CRYPTOMUS, JobPriority.HIGH, req.body);
  ```

### Register Job Routes

-   [ ] Open: `backend/src/index.ts`
-   [ ] Add import:

  ```typescript
  import jobRoutes from "./routes/jobs";
  ```

-   [ ] Add route:

  ```typescript
  app.use("/api/jobs", jobRoutes);
  ```

-   [ ] Add graceful shutdown:

  ```typescript
  import { jobQueue } from "./services/jobQueue";

  process.on("SIGTERM", async () => {
    await jobQueue.close();
    await prisma.$disconnect();
    process.exit(0);
  });
  ```

---

## 🔒 Phase 6: Production Deployment

### Set Up Render Redis

-   [ ] Go to: <https://dashboard.render.com>
-   [ ] Click: "New +" → "Redis"
-   [ ] Name: `advancia-redis`
-   [ ] Plan: Starter ($7/month) or Free tier
-   [ ] Click: "Create Redis"
-   [ ] Copy: Internal Redis URL
-   [ ] Note down:
    -   Host: `________________`
    -   Port: `6379`
    -   Password: `________________`

### Update Environment Variables

-   [ ] Go to: <https://dashboard.render.com/web/srv-d4f29vadbo4c738b4dsg/env-vars>
-   [ ] Add:

  ```
  REDIS_HOST=your-redis-host.render.com
  REDIS_PORT=6379
  REDIS_PASSWORD=your-secure-password
  ```

-   [ ] Click: "Save Changes"

### Commit and Push Changes

-   [ ] Open Git Graph in VS Code
-   [ ] Stage all new files:
    -   `backend/src/services/jobQueue.ts`
    -   `backend/src/routes/jobs.ts`
    -   `backend/prisma/schema.prisma` (FailedJob model)
    -   `install-dependencies.bat`
    -   `setup-redis.bat`
    -   `start-dev.bat`
    -   All guide files
-   [ ] Commit message: `feat: add job queue system with SLA-based priority routing`
-   [ ] Push to branch: `hardening/ts-strict-and-zod`

### Deploy to Production

-   [ ] Open PR on GitHub: `hardening/ts-strict-and-zod` → `main`
-   [ ] PR Title: `feat: NOWPayments integration, security hardening, job queue system, and TypeScript strict mode`
-   [ ] Merge PR (triggers Render deployment)
-   [ ] Monitor deployment logs
-   [ ] Verify deployment success:

  ```bash
  curl https://api.advanciapayledger.com/api/health
  curl https://api.advanciapayledger.com/api/jobs/metrics \
    -H "Authorization: Bearer $ADMIN_TOKEN"
  ```

---

## 🎯 Final Verification

### Development Environment

-   [ ] ✅ Backend starts without errors
-   [ ] ✅ Frontend starts without errors
-   [ ] ✅ Redis container running
-   [ ] ✅ Job queues initialized (5 queues)
-   [ ] ✅ Can access <http://localhost:4000/api/health>
-   [ ] ✅ Can access <http://localhost:3000>

### Job Queue Functionality

-   [ ] ✅ Can view job metrics at `/api/jobs/metrics`
-   [ ] ✅ Password reset emails queue instantly
-   [ ] ✅ Payment webhooks process without timeout
-   [ ] ✅ No failed jobs in dead letter queue

### Production Deployment

-   [ ] ✅ Render Redis instance created
-   [ ] ✅ Environment variables configured
-   [ ] ✅ Code pushed to GitHub
-   [ ] ✅ PR merged and deployed
-   [ ] ✅ Production API responding
-   [ ] ✅ Job queues working in production

---

## 📊 Installation Summary

| Component             | Status | Time       | Size     |
| --------------------- | ------ | ---------- | -------- |
| Backend dependencies  | ⬜     | 2 min      | 1.2MB    |
| Frontend dependencies | ⬜     | 1 min      | 650KB    |
| Redis container       | ⬜     | 30 sec     | 15MB     |
| Prisma migration      | ⬜     | 10 sec     | -        |
| Dev servers start     | ⬜     | 15 sec     | -        |
| **Total**             | **⬜** | **~4 min** | **~2MB** |

---

## 🆘 Troubleshooting Reference

### Issue: Dependencies fail to install

**Try:**

1. Close all VS Code terminals
2. Run `install-dependencies.bat` as Administrator
3. Check internet connection
4. Clear npm cache: `npm cache clean --force`

### Issue: Docker not found

**Try:**

1. Install Docker Desktop
2. Restart computer
3. Verify Docker is running (system tray icon)
4. Run `setup-redis.bat` again

### Issue: Port conflicts

**Try:**

1. Check what's using port: `netstat -ano | findstr :4000`
2. Kill process: `taskkill /PID <pid> /F`
3. Or change port in `backend/.env`

### Issue: Prisma migration fails

**Try:**

1. Delete database: `npx prisma migrate reset`
2. Re-run migration: `npx prisma migrate dev`
3. Verify DATABASE_URL in `.env`

---

## 📚 Documentation Reference

-   [ ] Read: `SETUP_SCRIPTS_README.md` - Script overview
-   [ ] Read: `INSTALLATION_VISUAL_GUIDE.md` - Visual guide
-   [ ] Read: `JOB_QUEUE_QUICK_START.md` - Quick start
-   [ ] Read: `JOB_QUEUE_GUIDE.md` - Complete guide
-   [ ] Read: `RATE_LIMITING_GUIDE.md` - Rate limiting
-   [ ] Read: `FORM_SECURITY_GUIDE.md` - Form security

---

## ✨ Completion

When ALL checkboxes above are checked (✅), your installation is complete!

**Congratulations! 🎉**

You now have:

-   ✅ Complete job queue system with 5 priority levels
-   ✅ Rate limiting for API protection
-   ✅ Form security with validation and sanitization
-   ✅ Redis-backed background job processing
-   ✅ Dead letter queue for failed jobs
-   ✅ Admin monitoring dashboard
-   ✅ Production-ready deployment setup

**Next:** Start building features and deploying to production!

---

**Date Completed:** ******\_\_\_******  
**Completed By:** ******\_\_\_******  
**Production Deployed:** ⬜ Yes ⬜ No
