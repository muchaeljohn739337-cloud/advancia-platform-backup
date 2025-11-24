# Vercel Deployment - REST API Endpoints Reference

**Backend API Base URL**: `http://localhost:4000` (dev) | `https://your-backend-url.com` (production)  
**Frontend Deployed on**: Vercel  
**Backend Deployed on**: DigitalOcean Droplet

---

## 📡 Core API Endpoints

### Authentication (`/api/auth`)

-   `POST /api/auth/register` - User registration
-   `POST /api/auth/login` - User login
-   `POST /api/auth/logout` - User logout
-   `POST /api/auth/refresh` - Refresh JWT token
-   `POST /api/auth/forgot-password` - Request password reset
-   `POST /api/auth/reset-password` - Reset password with token
-   `POST /api/auth/verify-email` - Verify email address
-   `POST /api/auth/resend-verification` - Resend verification email
-   `GET /api/auth/me` - Get current user info
-   `POST /api/auth/otp/send` - Send OTP via email
-   `POST /api/auth/otp/verify` - Verify OTP code

### Admin Authentication (`/api/auth/admin`)

-   `POST /api/auth/admin/login` - Admin login with 2FA
-   `POST /api/auth/admin/2fa/setup` - Setup TOTP 2FA
-   `POST /api/auth/admin/2fa/verify` - Verify 2FA token
-   `POST /api/auth/admin/2fa/disable` - Disable 2FA

### Users (`/api/users`)

-   `GET /api/users` - List all users (admin only)
-   `GET /api/users/:id` - Get user by ID
-   `PUT /api/users/:id` - Update user
-   `DELETE /api/users/:id` - Delete user
-   `GET /api/users/:id/transactions` - Get user transactions
-   `GET /api/users/:id/rewards` - Get user rewards

### Transactions (`/api/transactions`)

-   `GET /api/transactions` - List transactions (filtered)
-   `GET /api/transactions/:id` - Get transaction details
-   `POST /api/transactions` - Create transaction
-   `GET /api/transactions/balance/:userId` - Get user balance
-   `GET /api/transactions/history/:userId` - Transaction history

### Payments (`/api/payments`)

-   `POST /api/payments/create-payment-intent` - Create Stripe payment intent
-   `POST /api/payments/webhook` - Stripe webhook handler (raw body)
-   `GET /api/payments/:id` - Get payment details
-   `POST /api/payments/refund/:id` - Refund payment

### **Cryptomus API (`/api/cryptomus`)** ✅ UPDATED

-   `POST /api/cryptomus/create-invoice` - Create crypto payment invoice
    -   Headers: `Authorization: Bearer <JWT>`
    -   Body: `{ amount, currency, description? }`
    -   Returns: `{ payment_url, invoice_id, amount, currency }`
-   `POST /api/cryptomus/webhook` - Cryptomus payment webhook
    -   Validates signature: `MD5(base64(body) + API_KEY)`
-   `GET /api/cryptomus/status/:invoiceId` - Check payment status
    -   Headers: `Authorization: Bearer <JWT>`
-   `GET /api/cryptomus/test-config` - **NEW** Test configuration
    -   Returns: `{ success, config: { hasApiKey, hasUserId }, ready }`

### Crypto Wallets (`/api/crypto`)

-   `GET /api/crypto/balance/:userId` - Get crypto balance
-   `POST /api/crypto/withdraw` - Request crypto withdrawal
-   `GET /api/crypto/withdrawals/:userId` - Withdrawal history
-   `PUT /api/crypto/withdrawals/:id` - Update withdrawal status

### Tokens (`/api/tokens`)

-   `GET /api/tokens/balance/:userId` - Get token balance
-   `POST /api/tokens/transfer` - Transfer tokens
-   `POST /api/tokens/withdraw` - Withdraw tokens
-   `POST /api/tokens/cashout` - Cash out tokens
-   `GET /api/tokens/history/:userId` - Token transaction history

### Rewards (`/api/rewards`)

-   `GET /api/rewards` - List reward tiers
-   `GET /api/rewards/:userId` - Get user rewards
-   `POST /api/rewards/claim` - Claim reward
-   `GET /api/rewards/leaderboard` - Get leaderboard

### Notifications (`/api/notifications`)

-   `GET /api/notifications` - Get user notifications
-   `GET /api/notifications/unread-count` - Count unread notifications
-   `PUT /api/notifications/:id/read` - Mark as read
-   `PUT /api/notifications/read-all` - Mark all as read
-   `DELETE /api/notifications/:id` - Delete notification
-   `GET /api/notifications/preferences` - Get notification preferences
-   `PUT /api/notifications/preferences` - Update preferences
-   `POST /api/notifications/subscribe-push` - Subscribe to web push

### Support (`/api/support`)

-   `POST /api/support/contact` - Submit contact form
-   `GET /api/support/tickets` - List support tickets
-   `GET /api/support/tickets/:id` - Get ticket details
-   `POST /api/support/tickets/:id/reply` - Reply to ticket
-   `PUT /api/support/tickets/:id/close` - Close ticket

### Admin (`/api/admin`)

-   `GET /api/admin/stats` - Dashboard statistics
-   `GET /api/admin/users` - User management
-   `GET /api/admin/transactions` - Transaction monitoring
-   `POST /api/admin/users/:id/suspend` - Suspend user
-   `POST /api/admin/users/:id/unsuspend` - Unsuspend user
-   `GET /api/admin/portfolio/user/:userId` - User portfolio
-   `POST /api/admin/error-report` - Submit error report
-   `GET /api/admin/config/silent-mode` - Get silent mode status
-   `PUT /api/admin/config/silent-mode` - Toggle silent mode

### Health & System (`/api`)

-   `GET /api/health` - Health check endpoint
-   `GET /api/status` - System status
-   `GET /api-docs` - Swagger API documentation
-   `GET /api-docs.json` - OpenAPI spec JSON

### Invoices (`/api/invoices`)

-   `GET /api/invoices/:userId` - Get user invoices
-   `GET /api/invoices/:id/download` - Download invoice PDF

### Webhooks (`/api/webhooks`)

-   `POST /api/webhooks/stripe` - Stripe webhook
-   `POST /api/webhooks/cryptomus` - Cryptomus webhook

### Analytics (`/api/analytics`)

-   `GET /api/analytics/dashboard` - Analytics dashboard data
-   `POST /api/analytics/event` - Track analytics event

---

## 🔐 Authentication Methods

### JWT Bearer Token

```javascript
headers: {
  'Authorization': 'Bearer <JWT_TOKEN>',
  'Content-Type': 'application/json'
}
```

### API Key (Admin endpoints)

```javascript
headers: {
  'x-api-key': process.env.API_KEY,
  'Content-Type': 'application/json'
}
```

---

## 🌐 Vercel Environment Variables

Configure these in Vercel Dashboard → Settings → Environment Variables:

```env
# Backend API
NEXT_PUBLIC_API_URL=https://your-backend-domain.com

# NextAuth
NEXTAUTH_URL=https://your-frontend-domain.vercel.app
NEXTAUTH_SECRET=7e17d53349d43194df57ef4f8afe72f492436195d9b664ffb3088479690070d0

# Stripe (Frontend)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51SCXqNEG0x2sBmuO...

# Sentry (Optional)
NEXT_PUBLIC_SENTRY_DSN=

# Socket.IO
NEXT_PUBLIC_SOCKET_URL=https://your-backend-domain.com
```

---

## 🔗 CORS Configuration

The backend allows requests from:

-   `http://localhost:3000` (local development)
-   `http://127.0.0.1:3000` (local development)
-   Your Vercel production domain (configure in `backend/.env`)

Update `backend/.env`:

```env
ALLOWED_ORIGINS=http://localhost:3000,https://your-app.vercel.app
```

---

## 📝 Example API Calls from Vercel Frontend

### 1. Cryptomus Payment Creation

```typescript
// frontend/src/app/crypto/payment/page.tsx
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cryptomus/create-invoice`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    amount: "10.00",
    currency: "USDT",
    description: "Token purchase",
  }),
});

const data = await response.json();
// Redirect to: data.payment_url
```

### 2. Check User Balance

```typescript
// frontend/src/hooks/useBalance.ts
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transactions/balance/${userId}`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
const balance = await response.json();
```

### 3. Fetch Notifications

```typescript
// frontend/src/hooks/useNotifications.ts
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications?limit=20`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
const notifications = await response.json();
```

---

## 🚀 Deployment Checklist

### Vercel (Frontend)

-   [x] Environment variables configured
-   [x] `NEXT_PUBLIC_API_URL` points to backend
-   [x] `NEXTAUTH_SECRET` set
-   [x] Custom domain configured (optional)
-   [x] Build settings: `pnpm install && pnpm build`

### DigitalOcean (Backend)

-   [x] All environment variables in `backend/.env`
-   [x] `FRONTEND_URL` includes Vercel domain
-   [x] `ALLOWED_ORIGINS` includes Vercel domain
-   [x] PostgreSQL database configured
-   [x] PM2 running backend process
-   [x] Nginx reverse proxy configured
-   [x] SSL certificate active (Cloudflare or Certbot)

### Test Endpoints After Deployment

```bash
# Health check
curl https://your-backend.com/api/health

# Cryptomus config check
curl https://your-backend.com/api/cryptomus/test-config

# API documentation
curl https://your-backend.com/api-docs.json
```

---

## 📚 Additional Resources

-   **Swagger API Docs**: `https://your-backend.com/api-docs`
-   **Vercel Dashboard**: <https://vercel.com/dashboard>
-   **GitHub Repo**: <https://github.com/muchaeljohn739337-cloud/-modular-saas-platform>
-   **Deployment Guide**: `DEPLOYMENT_ARCHITECTURE.md`
-   **Credential Rotation Log**: `CREDENTIAL_ROTATION_LOG.md`

---

**Last Updated**: 2025-11-17  
**Cryptomus Integration**: ✅ Production Ready  
**Authentication**: JWT + 2FA for admin  
**Payment Methods**: Stripe + Cryptomus (BTC/ETH/USDT)
