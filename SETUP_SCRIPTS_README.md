# 🚀 Quick Start - Automated Setup Scripts

These batch scripts bypass PowerShell issues and automate the complete setup process.

## 📦 Installation Scripts

### `install-dependencies.bat`

**What it does:**

-   Installs backend packages: `express-rate-limit`, `express-validator`, `crypto-js`, `bull`, `ioredis`
-   Installs frontend packages: `crypto-js`, `dompurify`
-   Runs Prisma migration for job queue system
-   Removes optional educational files
-   Verifies all installations

**How to use:**

1. Double-click `install-dependencies.bat`
2. Wait for installation to complete (~2-3 minutes)
3. Press any key to close

---

### `setup-redis.bat`

**What it does:**

-   Checks if Docker is installed
-   Starts Redis in Docker container on port 6379
-   Tests Redis connection
-   Configures auto-restart

**How to use:**

1. Make sure Docker Desktop is running
2. Double-click `setup-redis.bat`
3. Wait for Redis to start (~30 seconds)
4. Press any key to close

**Alternative (if no Docker):**
Download Redis for Windows:
<https://github.com/microsoftarchive/redis/releases>

---

### `start-dev.bat`

**What it does:**

-   Checks if dependencies are installed (runs `install-dependencies.bat` if needed)
-   Checks if Redis is running (runs `setup-redis.bat` if needed)
-   Starts backend on <http://localhost:4000>
-   Starts frontend on <http://localhost:3000>
-   Opens both in separate command windows

**How to use:**

1. Double-click `start-dev.bat`
2. Wait for services to start (~10 seconds)
3. Access:
   -   Frontend: <http://localhost:3000>
   -   Backend API: <http://localhost:4000>
   -   Job Queue Metrics: <http://localhost:4000/api/jobs/metrics>

**To stop:**

-   Press `Ctrl + C` in each command window

---

## 🎯 Complete Setup Flow

### First Time Setup

```
1. Double-click: install-dependencies.bat
   ↓ Installs all npm packages

2. Double-click: setup-redis.bat
   ↓ Starts Redis in Docker

3. Double-click: start-dev.bat
   ↓ Starts both backend and frontend
```

### Daily Development

```
Just double-click: start-dev.bat
(Automatically checks and starts everything)
```

---

## 📋 What Gets Installed

### Backend Dependencies

| Package              | Purpose                  | Size  |
| -------------------- | ------------------------ | ----- |
| `express-rate-limit` | Rate limiting middleware | 50KB  |
| `express-validator`  | Input validation         | 200KB |
| `crypto-js`          | Encryption utilities     | 500KB |
| `bull`               | Job queue system         | 300KB |
| `ioredis`            | Redis client for Bull    | 200KB |
| `@types/*`           | TypeScript definitions   | 100KB |

### Frontend Dependencies

| Package     | Purpose                | Size  |
| ----------- | ---------------------- | ----- |
| `crypto-js` | Encryption utilities   | 500KB |
| `dompurify` | XSS sanitization       | 100KB |
| `@types/*`  | TypeScript definitions | 50KB  |

**Total Download:** ~2MB

---

## 🔍 Verification

After installation, verify everything is working:

### 1. Check Installed Packages

```cmd
cd backend
npm list express-rate-limit express-validator crypto-js bull ioredis

cd ../frontend
npm list crypto-js dompurify
```

### 2. Check Redis

```cmd
docker ps
```

Should show: `advancia-redis` container running

### 3. Test Job Queue

```cmd
curl http://localhost:4000/api/jobs/metrics
```

Should return JSON with queue metrics

---

## 🐛 Troubleshooting

### "Docker is not installed"

1. Download Docker Desktop: <https://www.docker.com/products/docker-desktop>
2. Install and restart computer
3. Start Docker Desktop
4. Run `setup-redis.bat` again

### "npm is not recognized"

1. Install Node.js: <https://nodejs.org/> (LTS version)
2. Restart computer
3. Run `install-dependencies.bat` again

### "Port 6379 already in use"

Another Redis instance is running:

```cmd
docker stop advancia-redis
docker rm advancia-redis
```

Then run `setup-redis.bat` again

### "Port 4000 already in use"

Another backend is running:

1. Find the process: `netstat -ano | findstr :4000`
2. Kill it: `taskkill /PID <process_id> /F`
3. Run `start-dev.bat` again

---

## 📝 Manual Commands (if scripts fail)

### Install Dependencies

```cmd
cd backend
npm install express-rate-limit express-validator crypto-js bull ioredis
npm install --save-dev @types/crypto-js @types/bull

cd ../frontend
npm install crypto-js dompurify
npm install --save-dev @types/crypto-js @types/dompurify
```

### Start Redis

```cmd
docker run -d --name advancia-redis -p 6379:6379 redis:alpine
```

### Start Backend

```cmd
cd backend
npm run dev
```

### Start Frontend

```cmd
cd frontend
npm run dev
```

---

## 🎉 Success Indicators

✅ **Installation successful when you see:**

-   "Installation Complete!" message
-   No error messages in red
-   Package verification shows all packages installed

✅ **Redis successful when you see:**

-   "Redis is now running!" message
-   `docker ps` shows `advancia-redis` container
-   `PONG` response from ping test

✅ **Dev server successful when you see:**

-   Backend: "Server running on port 4000"
-   Frontend: "Ready on <http://localhost:3000>"
-   No error messages in console

---

## 🔐 Security Notes

These scripts:

-   ✅ Install only verified npm packages
-   ✅ Use official Redis Docker image
-   ✅ Run locally (no cloud connections)
-   ✅ Don't expose ports externally
-   ✅ Can be reviewed before running (open in text editor)

---

## 📚 Next Steps

After successful installation:

1. **Read the guides:**
   -   `JOB_QUEUE_QUICK_START.md` - Job queue setup
   -   `RATE_LIMITING_GUIDE.md` - Rate limiting usage
   -   `FORM_SECURITY_GUIDE.md` - Form security patterns

2. **Update your routes:**
   -   Replace blocking operations with job queue
   -   Add rate limiting to API endpoints
   -   Implement form security

3. **Deploy to production:**
   -   Set up Redis on Render ($7/month)
   -   Configure environment variables
   -   Push to GitHub and deploy

---

## 💡 Tips

-   **Run scripts as Administrator** if you get permission errors
-   **Close VS Code terminals** before running scripts (PowerShell conflicts)
-   **Keep Docker Desktop running** while developing
-   **Use `start-dev.bat`** every day instead of manual commands
-   **Check logs** in the opened command windows for errors

---

Need help? Check:

-   `JOB_QUEUE_GUIDE.md` - Complete job queue documentation
-   `backend/src/services/jobQueue.ts` - Implementation code
-   `backend/src/routes/jobs.ts` - API endpoints
