# 🚀 PAID-ONLY LAUNCH TONIGHT - Digital Ocean Deployment

**Launch Time**: Tonight (November 19, 2025)  
**Business Model**: $10/month subscription - NO FREE TIER  
**Infrastructure**: Digital Ocean ($12/month) + Vercel (FREE)

---

## 💰 Cost Breakdown

| Service                   | Purpose              | Cost                         |
| ------------------------- | -------------------- | ---------------------------- |
| **Digital Ocean Droplet** | Backend + PostgreSQL | $12/month                    |
| **Vercel**                | Frontend hosting     | FREE                         |
| **Stripe**                | Payment processing   | 2.9% + $0.30 per transaction |
| **Total Infrastructure**  |                      | **$12/month**                |

**Revenue**: $10/user/month → Break even at 2 paying customers!

---

## ⚡ 60-Minute Launch Checklist

### Phase 1: Add Subscription to Database (10 min)

```bash
cd backend

# Add to schema.prisma User model:
subscriptionStatus     String?   # 'active', 'inactive', 'cancelled', 'past_due'
subscriptionTier       String?   # 'PRO'
subscriptionStartDate  DateTime?
subscriptionEndDate    DateTime?
stripeSubscriptionId   String?   @unique
```

```bash
# Run migration
npx prisma migrate dev --name add_subscription_required
npx prisma generate
```

### Phase 2: Update Backend Auth (5 min)

**File: `backend/src/middleware/auth.ts`**

Add subscription check after user lookup:

```typescript
// After line ~100 in authenticateToken
// PRODUCTION: Block access without active subscription
if (!user.subscriptionStatus || user.subscriptionStatus !== "active") {
  return res.status(402).json({
    error: "Active subscription required",
    message: "Subscribe to Advancia Pay Pro ($10/month) to access the platform",
    redirectTo: "/pricing",
  });
}
```

**File: `backend/src/routes/auth.ts`**

Update registration (line ~56):

```typescript
subscriptionStatus: 'inactive', // Must pay to activate
subscriptionTier: null,
approved: true, // No approval needed, just payment
```

### Phase 3: Deploy to Digital Ocean (20 min)

#### Create Droplet

```bash
# 1. Go to: https://cloud.digitalocean.com/droplets/new
# 2. Choose:
#    - Image: Ubuntu 24.04 LTS
#    - Plan: Basic $12/month (2GB RAM, 2 vCPUs, 60GB SSD)
#    - Region: New York 3 (closest to users)
#    - Authentication: SSH key or password
#    - Hostname: advancia-production

# 3. Click "Create Droplet" (ready in 55 seconds)
```

#### Setup Server

```bash
# SSH into droplet
ssh root@YOUR_DROPLET_IP

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs

# Install PostgreSQL 16
apt install -y postgresql postgresql-contrib

# Install PM2 (process manager)
npm install -g pm2

# Setup PostgreSQL
sudo -u postgres psql
CREATE DATABASE advancia_prod;
CREATE USER advancia WITH PASSWORD 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE advancia_prod TO advancia;
\q
```

#### Deploy Backend Code

```bash
# On server
cd /var/www
git clone https://github.com/muchaeljohn739337-cloud/-modular-saas-platform.git
cd -modular-saas-platform/backend

# Install dependencies
npm install

# Create .env
nano .env
```

**Production .env**:

```bash
DATABASE_URL="postgresql://advancia:STRONG_PASSWORD@localhost:5432/advancia_prod"
FRONTEND_URL="https://advancia.vercel.app"
BACKEND_URL="http://YOUR_DROPLET_IP:4000"
NODE_ENV="production"
JWT_SECRET="GENERATE_64_CHAR_RANDOM_STRING"
SESSION_SECRET="GENERATE_64_CHAR_RANDOM_STRING"
PORT=4000

# Stripe (REQUIRED for paid model)
STRIPE_SECRET_KEY="sk_live_YOUR_LIVE_KEY"
STRIPE_WEBHOOK_SECRET="whsec_YOUR_WEBHOOK_SECRET"
STRIPE_PRICE_ID="price_YOUR_PRO_PLAN_PRICE_ID"

# Email (for receipts)
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"

# Optional APIs (can enable later)
CRYPTOMUS_API_KEY=""
HIBP_API_KEY=""
PROXYMESH_USERNAME=""
```

```bash
# Run migrations
npx prisma migrate deploy

# Build backend
npm run build

# Start with PM2
pm2 start dist/index.js --name advancia-backend
pm2 startup
pm2 save

# Setup firewall
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw allow 4000  # Backend API
ufw enable
```

### Phase 4: Setup Stripe Subscription (15 min)

#### Create Stripe Product

```bash
# 1. Go to: https://dashboard.stripe.com/products
# 2. Click "Add Product"
# 3. Fill in:
#    - Name: Advancia Pay Pro
#    - Description: Full access to crypto payments, breach monitoring, IP protection
#    - Pricing: $10.00 USD / month (recurring)
#    - Billing period: Monthly
# 4. Click "Save product"
# 5. Copy the Price ID (starts with "price_...")
```

#### Create Subscription Endpoint

**File: `backend/src/routes/subscription.ts`** (NEW)

```typescript
import express from "express";
import Stripe from "stripe";
import { authenticateToken } from "../middleware/auth";
import { prisma } from "../prismaClient";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

// Create checkout session
router.post("/create-checkout", authenticateToken, async (req, res) => {
  try {
    const { userId, email } = req.user!;

    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.FRONTEND_URL}/dashboard?payment=success`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing?payment=cancelled`,
      metadata: { userId },
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: "Failed to create checkout" });
  }
});

// Stripe webhook
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"]!;
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      await prisma.user.update({
        where: { id: session.metadata.userId },
        data: {
          subscriptionStatus: "active",
          subscriptionTier: "PRO",
          subscriptionStartDate: new Date(),
          stripeSubscriptionId: session.subscription as string,
        },
      });
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      await prisma.user.update({
        where: { stripeSubscriptionId: subscription.id },
        data: { subscriptionStatus: "cancelled" },
      });
    }

    res.json({ received: true });
  }
);

export default router;
```

**Register route in `backend/src/index.ts`**:

```typescript
import subscriptionRoutes from "./routes/subscription";
app.use("/api/subscription", subscriptionRoutes);
```

### Phase 5: Update Frontend Pricing Page (5 min)

**File: `frontend/src/app/pricing/page.tsx`**

Show single Pro plan:

```tsx
<div className="bg-gradient-to-br from-blue-600 to-purple-600 p-8 rounded-2xl text-white">
  <h2 className="text-3xl font-bold mb-4">Advancia Pay Pro</h2>
  <p className="text-5xl font-bold mb-6">
    $10<span className="text-xl">/month</span>
  </p>

  <ul className="space-y-3 mb-8">
    <li>✅ Unlimited crypto payments (BTC, ETH, USDT)</li>
    <li>✅ 24/7 breach monitoring (317+ sources)</li>
    <li>✅ IP protection & rotation (8 countries)</li>
    <li>✅ Live support chat</li>
    <li>✅ Priority processing</li>
  </ul>

  <button
    onClick={handleSubscribe}
    className="w-full bg-white text-blue-600 py-3 rounded-lg font-bold"
  >
    Subscribe Now
  </button>
</div>
```

**Subscribe function**:

```typescript
const handleSubscribe = async () => {
  const response = await fetch("/api/subscription/create-checkout", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const { url } = await response.json();
  window.location.href = url; // Redirect to Stripe Checkout
};
```

### Phase 6: Update Vercel Frontend (5 min)

```bash
cd frontend

# Update environment variables
# In Vercel dashboard or .env.production:
NEXT_PUBLIC_API_URL=http://YOUR_DROPLET_IP:4000
NEXT_PUBLIC_FRONTEND_URL=https://advancia.vercel.app
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PUBLISHABLE_KEY

# Deploy
vercel --prod
```

---

## 🧪 Testing (5 min)

### Test 1: Registration Without Payment

```bash
# Register new user
curl -X POST http://YOUR_DROPLET_IP:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","username":"testuser"}'

# Expected: User created with subscriptionStatus: 'inactive'
```

### Test 2: Login (Should Work)

```bash
curl -X POST http://YOUR_DROPLET_IP:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}'

# Expected: JWT token received
```

### Test 3: Access Protected Route (Should Block)

```bash
curl -X GET http://YOUR_DROPLET_IP:4000/api/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected: 402 Payment Required
# {
#   "error": "Active subscription required",
#   "message": "Subscribe to Advancia Pay Pro ($10/month)",
#   "redirectTo": "/pricing"
# }
```

### Test 4: Subscribe and Access

```bash
# 1. Go to: https://advancia.vercel.app/pricing
# 2. Click "Subscribe Now"
# 3. Complete Stripe Checkout (use test card: 4242 4242 4242 4242)
# 4. Redirected to /dashboard
# 5. Verify full access to all features
```

---

## 🎯 Production Launch Steps

1. **Update DNS** (if using custom domain):

   ```bash
   # Point your domain to Digital Ocean droplet IP
   A record: @ -> YOUR_DROPLET_IP
   A record: api -> YOUR_DROPLET_IP
   ```

2. **Setup SSL with Certbot**:

   ```bash
   apt install certbot python3-certbot-nginx
   certbot --nginx -d yourdomain.com -d api.yourdomain.com
   ```

3. **Setup Nginx reverse proxy**:

   ```bash
   apt install nginx
   nano /etc/nginx/sites-available/advancia
   ```

   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://localhost:4000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   ```bash
   ln -s /etc/nginx/sites-available/advancia /etc/nginx/sites-enabled/
   nginx -t
   systemctl restart nginx
   ```

4. **Enable monitoring**:

   ```bash
   pm2 install pm2-logrotate
   pm2 set pm2-logrotate:max_size 10M
   pm2 monitor # Opens PM2.io dashboard
   ```

5. **Setup backups**:
   ```bash
   # Daily PostgreSQL backup
   crontab -e
   0 2 * * * pg_dump advancia_prod > /backups/db_$(date +\%Y\%m\%d).sql
   ```

---

## 📊 Post-Launch Monitoring

### Health Checks

```bash
# Backend
curl http://YOUR_DROPLET_IP:4000/api/health

# Database
curl http://YOUR_DROPLET_IP:4000/api/system/health

# Stripe webhook
curl https://dashboard.stripe.com/webhooks
```

### Key Metrics to Watch

- **Active Subscriptions**: Stripe Dashboard → Subscriptions
- **MRR (Monthly Recurring Revenue)**: Active users × $10
- **Churn Rate**: Cancelled subscriptions / Total subscriptions
- **API Response Times**: PM2 logs
- **Database Size**: `SELECT pg_size_pretty(pg_database_size('advancia_prod'));`

---

## 🚨 Troubleshooting

### "Subscription required" after payment

```bash
# Check webhook delivery in Stripe Dashboard
# Verify user.subscriptionStatus in database:
psql advancia_prod
SELECT email, subscriptionStatus, subscriptionTier FROM users WHERE email = 'user@example.com';
```

### Backend 502 error

```bash
pm2 logs advancia-backend
pm2 restart advancia-backend
```

### Database connection failed

```bash
# Test connection
psql -U advancia -d advancia_prod -h localhost

# Check credentials in .env
cat /var/www/-modular-saas-platform/backend/.env | grep DATABASE_URL
```

---

## 💡 Revenue Projections

| Milestone   | Users | MRR    | Break-Even           |
| ----------- | ----- | ------ | -------------------- |
| **Launch**  | 2     | $20    | ✅ Yes (server paid) |
| **Week 1**  | 10    | $100   | ✅ Yes + profit      |
| **Month 1** | 50    | $500   | 🚀 Scaling up        |
| **Month 3** | 200   | $2,000 | 💰 Profitable        |

---

## ✅ Final Launch Checklist

- [ ] Database migration with subscription fields
- [ ] Auth middleware blocks unsubscribed users
- [ ] Stripe product created ($10/month)
- [ ] Stripe webhook endpoint configured
- [ ] Digital Ocean droplet running
- [ ] PostgreSQL database created
- [ ] Backend deployed with PM2
- [ ] Frontend deployed to Vercel
- [ ] Pricing page shows single Pro plan
- [ ] Test: Register → Can't access → Subscribe → Full access
- [ ] DNS pointed to droplet (if custom domain)
- [ ] SSL certificate installed
- [ ] Nginx reverse proxy configured
- [ ] PM2 monitoring enabled
- [ ] Daily backups scheduled

---

**🎉 You're ready to launch tonight!**

**Estimated time**: 60 minutes  
**Break-even**: 2 customers ($20/month)  
**Server cost**: $12/month (Digital Ocean)  
**Frontend cost**: FREE (Vercel)

**Launch URL**: https://advancia.vercel.app  
**After 2 customers sign up, you're profitable!** 🚀
