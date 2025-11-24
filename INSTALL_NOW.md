# 🚀 Install Now (Windows + PowerShell)

Get the app running locally in minutes. This guide is tuned for Windows with PowerShell (`pwsh`).

## Prerequisites

-   Node.js 20 LTS (recommended)
-   Git
-   Docker Desktop (optional, for one-command setup)
-   PostgreSQL 15+ (skip if using Docker)

Verify tools:

```powershell
node -v
npm -v
```

---

## Option A — One Command with Docker (Fastest)

This starts Postgres, RabbitMQ, backend (4000), frontend (3000), and Nginx (80).

```powershell
# From repo root
docker compose up -d
```

Open:

-   [http://localhost](http://localhost) (Nginx proxy)
-   [http://localhost:3000](http://localhost:3000) (Frontend)
-   [http://localhost:4000/api/health](http://localhost:4000/api/health) (Backend)
-   [http://localhost:15672](http://localhost:15672) (RabbitMQ UI, user: advancia / rabbitmq_pass_change_in_prod)

Stop:

```powershell
docker compose down
```

---

## Option B — Local Dev (Backend + Frontend)

Follow if you don’t want Docker.

### 1) Clone and install

```powershell
# From any folder
git clone https://github.com/muchaeljohn739337-cloud/-modular-saas-platform.git
cd -modular-saas-platform

# Backend deps
cd backend
npm install

# Frontend deps
cd ..\frontend
npm install
```

### 2) Environment variables

Copy examples and adjust minimally to run local.

```powershell
# Backend
cd ..\backend
Copy-Item .env.example .env -Force

# Frontend
cd ..\frontend
Copy-Item .env.example .env.local -Force
```

Minimal backend edits (`backend/.env`):

-   `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/advancia_db`
-   Generate a `JWT_SECRET` (64+ chars). Quick generator:

```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

If you don’t have Postgres installed, install it or use Docker for Postgres:

```powershell
docker run --name advancia-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=advancia_db -p 5432:5432 -d postgres:15
```

### 3) Prepare the database (Prisma)

```powershell
cd ..\backend
npx prisma migrate dev --name init
# Optional: open Prisma Studio
npx prisma studio
```

### 4) Run the backend (port 4000)

```powershell
cd backend
npm run dev
```

### 5) Run the frontend (port 3000)

Open a new terminal:

```powershell
cd -modular-saas-platform\frontend
npm run dev
```

Open:

-   [http://localhost:3000](http://localhost:3000)
-   [http://localhost:4000/api/health](http://localhost:4000/api/health)

---

## Option C — WSL (Ubuntu on Windows)

Run everything inside Linux without leaving Windows. Best performance if you keep the repo inside the Linux filesystem (for example, `/home/<you>`), not under `/mnt/c`.

### 1) Install WSL + Ubuntu

```powershell
wsl --install -d Ubuntu
# Reboot if prompted, then launch "Ubuntu" from Start Menu
```

### 2) Setup Node and tools (inside Ubuntu)

```bash
sudo apt update && sudo apt install -y build-essential git curl
# Install nvm (Node Version Manager)
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm install --lts
node -v && npm -v
```

Optional (tmux):

```bash
sudo apt install -y tmux
```

### 3) Enable Docker in WSL

-   Install Docker Desktop for Windows
-   Settings → General: enable “Use the WSL 2 based engine”
-   Settings → Resources → WSL Integration: enable for your Ubuntu distro

Verify in Ubuntu:

```bash
docker --version
docker run --rm hello-world
```

### 4) Clone and run (choose Docker or local dev)

Docker (fastest):

```bash
git clone https://github.com/muchaeljohn739337-cloud/-modular-saas-platform.git
cd -modular-saas-platform
docker compose up -d
```

Local dev:

```bash
git clone https://github.com/muchaeljohn739337-cloud/-modular-saas-platform.git
cd -modular-saas-platform

# Backend deps
cd backend && npm install

# Frontend deps
cd ../frontend && npm install

# Env files
cd ../backend && cp .env.example .env
cd ../frontend && cp .env.example .env.local

# Prepare DB
cd ../backend && npx prisma migrate dev --name init

# Run services (two terminals or tmux)
cd backend && npm run dev
# new terminal
cd ../frontend && npm run dev
```

Open:

-   [http://localhost:3000](http://localhost:3000)
-   [http://localhost:4000/api/health](http://localhost:4000/api/health)

---

## Optional quick installer

You can also double‑click `install-dependencies.bat` from the repo root to install packages quickly, then start services as above.

---

## Troubleshooting

-   Port in use:

```powershell
# Find and stop Docker stack
docker compose down
# Or kill process by port (replace 4000/3000)
Get-Process -Id (Get-NetTCPConnection -LocalPort 4000).OwningProcess | Stop-Process -Force
```

-   Reset DB:

```powershell
cd backend
npx prisma migrate reset --force
```

-   Node version:

```powershell
node -v  # prefer v20.x
```

## Need more depth?

-   `DEV_SETUP_GUIDE.md` — advanced workflows, scripts, and troubleshooting
-   `backend/.env.example` and `frontend/.env.example` — complete env references
