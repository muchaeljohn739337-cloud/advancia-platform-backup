# 💳 Advancia Pay Ledger — Fintech SaaS

Advancia Pay is a secure, scalable fintech SaaS platform built with **Next.js 14**, **Node.js/Express**, and **PostgreSQL**, deployed on **Render** (backend) and **Vercel** (frontend) with **Cloudflare** edge protection.
It provides authentication, payments, crypto wallets, dashboards, and real-time notifications — ready for production.

---

## 🏗️ Architecture

**Stack Overview:**

- **Frontend** → Next.js 14 App Router (Vercel)
- **Backend** → Node.js + Express + Socket.IO (Render)
- **Database** → PostgreSQL (Render)
- **Backups** → Digital Ocean Spaces (S3-compatible, automated nightly)
- **CDN/DNS** → Cloudflare (WAF, SSL, Rate Limiting, Bot Protection)
- **Monitoring** → Sentry
- **CI/CD** → GitHub Actions (tests + automated backups)

---

## 🚀 Deployment

**Production Stack:**

- **Backend**: Render (Web Service + PostgreSQL)
- **Frontend**: Vercel (Next.js)
- **Backups**: Digital Ocean Spaces (automated nightly via GitHub Actions)
- **CDN**: Cloudflare

**Quick Deploy:**

1. **Backend**: Push to `main` branch → Render auto-deploys
2. **Frontend**: Push to `main` branch → Vercel auto-deploys
3. **Environment Variables**: Configure in Render & Vercel dashboards

See detailed guide: `deploy-vercel.ps1` for frontend, `scripts/trigger-render-deploy.sh` for backend

---

## ⚡ Quick Start (Local Dev)

```bash
# Backend (Terminal 1)
cd backend
npm install
npx prisma generate
npm run dev

# Frontend (Terminal 2)
cd frontend
npm install
npm run dev
```

**Access:**

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api/health
- Prisma Studio: `cd backend && npx prisma studio`

Environment variables are stored in `.env` files for backend and frontend.
See `backend/.env.example` for required keys (JWT_SECRET, STRIPE keys, DATABASE_URL).

---

## 📊 Features

- 🔐 **Authentication** → Email OTP (Gmail SMTP), JWT, 2FA/TOTP, password recovery
- 💳 **Fiat Payments** → Stripe integration (cards, webhooks)
- ₿ **Crypto Payments** → Cryptomus (BTC, ETH, USDT), custodial HD wallets
- 💰 **Multi-Currency** → USD, BTC, ETH, USDT balances per user
- 🎁 **Rewards System** → Token distribution, user tiers
- 📈 **Dashboard** → Real-time charts, transaction history, analytics
- 🔔 **Notifications** → Web Push, Email, Socket.IO real-time updates
- ⚙️ **Backend** → RESTful API, Prisma ORM, Socket.IO, rate limiting
- 🔒 **Security** → Cloudflare WAF, Sentry monitoring, audit logs
- 📦 **DevOps** → GitHub Actions CI/CD, automated DB backups

---

## 🧩 CI/CD Pipeline

**Automated Workflows:**

- **Tests**: Run on every PR (see `.github/workflows/ci.yml`)
- **Backups**: Nightly database backups to Digital Ocean Spaces
- **Deployments**: Auto-deploy to Render (backend) and Vercel (frontend) on push to `main`

**Key Scripts:**

- `deploy-vercel.ps1` - Deploy frontend to Vercel
- `scripts/trigger-render-deploy.sh` - Trigger backend deploy on Render
- `scripts/render-smoke.ps1` - Test deployed backend health

---

## 💰 Cost Breakdown (Production)

| Service             | Plan      | Monthly Cost  |
| ------------------- | --------- | ------------- |
| Render PostgreSQL   | Starter   | $7            |
| Render Web Service  | Starter   | $7            |
| Vercel              | Hobby     | $0            |
| Cloudflare          | Free      | $0            |
| Sentry              | Developer | $0            |
| DO Spaces (Backups) | Standard  | $5            |
| **Total**           |           | **$19/month** |

---

## 📜 License

MIT License — free to use and modify with attribution.
