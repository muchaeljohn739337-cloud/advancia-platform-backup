# 🚀 PRODUCTION DEPLOYMENT CHECKLIST

**Advancia Pay Ledger - Production Launch Guide**

Use this checklist to ensure a smooth production deployment.

---

## ✅ PRE-DEPLOYMENT CHECKLIST

### 1. Environment Configuration

- [ ] Copy `backend/.env.production` and fill in all production values
- [ ] Copy `frontend/.env.production` and update API URL
- [ ] Generate secure secrets:
  ```powershell
  # Run these commands to generate secure secrets
  node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"  # For JWT_SECRET
  node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"  # For SESSION_SECRET
  ```
- [ ] Update `FRONTEND_URL` with production domain
- [ ] Update `ALLOWED_ORIGINS` with all production domains
- [ ] Configure database connection string (PostgreSQL)
- [ ] Configure Redis connection string

### 2. External Services Setup

#### Stripe Payments (Required for payments)

- [ ] Create Stripe account at https://stripe.com
- [ ] Get **LIVE** keys (not test keys) from Dashboard
- [ ] Set `STRIPE_SECRET_KEY` in backend/.env.production
- [ ] Set `STRIPE_PUBLISHABLE_KEY` in frontend/.env.production
- [ ] Configure webhook endpoint: `https://your-domain.com/api/payments/webhook`
- [ ] Get webhook secret and set `STRIPE_WEBHOOK_SECRET`

#### Cryptomus (Required for crypto payments)

- [ ] Create account at https://cryptomus.com
- [ ] Get API key and merchant ID
- [ ] Set `CRYPTOMUS_API_KEY` and `CRYPTOMUS_MERCHANT_ID`

#### Email Services

- [ ] Configure Gmail SMTP for OTP emails:
  - Enable 2FA on Gmail account
  - Generate App-Specific Password
  - Set `EMAIL_USER` and `EMAIL_PASSWORD`
- [ ] Configure Resend for HTML templates (optional):
  - Sign up at https://resend.com
  - Get API key and set `RESEND_API_KEY`
- [ ] Set `EMAIL_FROM` with your domain email

#### Web Push Notifications

- [ ] Generate VAPID keys:
  ```powershell
  npx web-push generate-vapid-keys
  ```
- [ ] Set `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`
- [ ] Update same `VAPID_PUBLIC_KEY` in frontend/.env.production

#### Monitoring (Highly Recommended)

- [ ] Create Sentry account at https://sentry.io
- [ ] Create project and get DSN
- [ ] Set `SENTRY_DSN` in both backend and frontend

### 3. Database Setup

- [ ] Create production PostgreSQL database
- [ ] Set strong database password (min 32 characters)
- [ ] Update `DATABASE_URL` in backend/.env.production
- [ ] Run migrations:
  ```powershell
  cd backend
  npm run prisma:migrate:deploy
  npm run prisma:generate
  ```
- [ ] Seed admin user (if needed):
  ```powershell
  npm run seed
  ```

### 4. Security Configuration

- [ ] Change all default passwords
- [ ] Set strong `JWT_SECRET` (min 64 characters)
- [ ] Set strong `SESSION_SECRET` (different from JWT_SECRET)
- [ ] Set strong `API_KEY` for internal services
- [ ] Review CORS settings in `backend/src/jobs/config/index.ts`
- [ ] Enable rate limiting (already configured)
- [ ] Set up firewall rules (allow only 80, 443, 22)
- [ ] Configure fail2ban for SSH protection
- [ ] Enable database connection encryption (SSL)

### 5. Infrastructure Setup

#### Option A: Docker Deployment (Recommended)

- [ ] Install Docker and Docker Compose
- [ ] Review `docker-compose.prod.yml` settings
- [ ] Create `.env` file in root with Docker environment variables
- [ ] Test build: `docker-compose -f docker-compose.prod.yml build`

#### Option B: Local PM2 Deployment

- [ ] Install Node.js 18+ on server
- [ ] Install PM2: `npm install -g pm2`
- [ ] Configure PM2 startup: `pm2 startup`
- [ ] Install PM2 log rotation: `pm2 install pm2-logrotate`

### 6. SSL/TLS Certificates

- [ ] Purchase domain name
- [ ] Point domain DNS to server IP
- [ ] Install Certbot: `sudo snap install certbot --classic`
- [ ] Generate SSL certificate:
  ```bash
  sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com
  ```
- [ ] Update Nginx configuration with SSL paths
- [ ] Set up auto-renewal: `sudo certbot renew --dry-run`

### 7. DNS Configuration

- [ ] Create A record pointing to server IP
- [ ] Create CNAME record for www subdomain
- [ ] (Optional) Configure Cloudflare for CDN and DDoS protection
- [ ] Set up CAA records for SSL validation
- [ ] Configure SPF/DKIM/DMARC for email sending

---

## 🚀 DEPLOYMENT EXECUTION

### Step 1: Pre-Deployment Backup

```powershell
# Create backup of current state (if upgrading existing deployment)
./start-production.ps1 -Docker  # This includes automatic backup
```

### Step 2: Deploy Application

#### Using Docker:

```powershell
# Deploy with Docker Compose
./start-production.ps1 -Docker
```

#### Using PM2 (Local):

```powershell
# Deploy with PM2
./start-production.ps1 -Local
```

### Step 3: Verify Deployment

- [ ] Check backend health: `http://your-server-ip:4000/health`
- [ ] Check frontend: `http://your-server-ip:3000`
- [ ] Test API authentication endpoint
- [ ] Test database connection
- [ ] Test Redis connection
- [ ] Check application logs

### Step 4: Configure Reverse Proxy (Nginx)

- [ ] Install Nginx: `sudo apt install nginx`
- [ ] Copy production Nginx config
- [ ] Enable SSL configuration
- [ ] Test configuration: `sudo nginx -t`
- [ ] Restart Nginx: `sudo systemctl restart nginx`
- [ ] Enable autostart: `sudo systemctl enable nginx`

### Step 5: Post-Deployment Testing

#### Critical Tests:

- [ ] User registration flow
- [ ] User login flow
- [ ] Password reset flow
- [ ] 2FA setup and verification
- [ ] Payment processing (test mode first)
- [ ] Crypto payment creation
- [ ] Transaction creation
- [ ] Withdrawal requests
- [ ] Admin dashboard access
- [ ] Support ticket creation
- [ ] Email notifications
- [ ] Web push notifications
- [ ] Real-time socket updates

#### Load Testing:

- [ ] Run load tests with expected traffic
- [ ] Monitor CPU and memory usage
- [ ] Check database performance
- [ ] Verify Redis caching
- [ ] Test rate limiting

### Step 6: Monitoring Setup

- [ ] Configure Sentry error tracking
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Configure log aggregation (if using centralized logging)
- [ ] Set up automated backups
- [ ] Configure alerting for critical errors
- [ ] Set up performance monitoring

---

## 📊 POST-DEPLOYMENT CHECKLIST

### Day 1 - Launch Day

- [ ] Monitor error logs continuously
- [ ] Check Sentry for any errors
- [ ] Monitor server resources (CPU, RAM, disk)
- [ ] Verify all payment webhooks are working
- [ ] Test all critical user flows
- [ ] Have rollback plan ready

### Week 1 - Stabilization

- [ ] Review all error logs daily
- [ ] Monitor application performance
- [ ] Check database query performance
- [ ] Optimize slow queries if needed
- [ ] Review security logs
- [ ] Verify backup automation is working
- [ ] Test backup restoration process

### Ongoing - Maintenance

- [ ] Set up weekly security updates
- [ ] Monthly dependency updates
- [ ] Quarterly security audits
- [ ] Regular database optimization
- [ ] Log rotation and cleanup
- [ ] SSL certificate renewal (every 90 days)
- [ ] Database backup verification

---

## 🔒 SECURITY BEST PRACTICES

### Access Control

- [ ] Create separate admin users (don't use default admin)
- [ ] Enable 2FA for all admin accounts
- [ ] Use strong passwords (min 16 characters)
- [ ] Rotate API keys every 90 days
- [ ] Limit SSH access to specific IPs
- [ ] Disable root SSH login

### Network Security

- [ ] Configure firewall (UFW or iptables)
- [ ] Enable fail2ban for brute force protection
- [ ] Use Cloudflare or similar DDoS protection
- [ ] Enable HTTPS only (HSTS)
- [ ] Disable unused ports

### Application Security

- [ ] Keep dependencies updated
- [ ] Run security audits: `npm audit`
- [ ] Use environment-specific secrets
- [ ] Never commit secrets to Git
- [ ] Encrypt sensitive data at rest
- [ ] Use parameterized database queries (Prisma handles this)

### Backup Strategy

- [ ] Daily automated database backups
- [ ] Store backups in separate location (AWS S3, etc.)
- [ ] Test backup restoration monthly
- [ ] Keep backups for 30 days minimum
- [ ] Encrypt backup files

---

## 🆘 TROUBLESHOOTING

### Backend Won't Start

1. Check environment variables are set correctly
2. Verify database connection string
3. Check database is accessible
4. Review logs: `pm2 logs` or `docker logs advancia-backend`
5. Verify all dependencies installed: `npm ci`

### Frontend Won't Build

1. Check `NEXT_PUBLIC_API_URL` is set
2. Verify Node.js version (18+)
3. Clear Next.js cache: `rm -rf .next`
4. Reinstall dependencies: `rm -rf node_modules && npm ci`

### Database Connection Issues

1. Verify PostgreSQL is running
2. Check DATABASE_URL format
3. Verify database credentials
4. Check firewall allows database port
5. Test connection manually: `psql $DATABASE_URL`

### Payment Webhook Failures

1. Verify webhook URL is publicly accessible
2. Check Stripe webhook secret matches
3. Review webhook logs in Stripe dashboard
4. Ensure raw body parsing is enabled for webhook route
5. Check Nginx/proxy isn't modifying request body

### SSL Certificate Issues

1. Verify DNS is pointing to correct server
2. Check Certbot renewal is configured
3. Review Nginx SSL configuration
4. Test with: `sudo certbot renew --dry-run`
5. Check certificate expiration: `sudo certbot certificates`

---

## 📞 SUPPORT & RESOURCES

- **Documentation**: Check all `*.md` files in project root
- **API Reference**: `API_REFERENCE.md`
- **Deployment Guide**: `COMPLETE_DEPLOYMENT_GUIDE.md`
- **Security Guide**: `CLOUDFLARE_SECURITY_GUIDE.md`
- **Testing Guide**: `API_TESTING_GUIDE.md`

---

## ✅ FINAL VERIFICATION

Before announcing production launch:

- [ ] All items in Pre-Deployment Checklist completed
- [ ] All items in Deployment Execution completed
- [ ] All critical tests passing
- [ ] Monitoring and alerts configured
- [ ] Backup automation verified
- [ ] SSL certificate installed and valid
- [ ] Team trained on production procedures
- [ ] Rollback plan documented and tested
- [ ] Performance benchmarks met
- [ ] Security audit completed

---

**🎉 Ready for Production Launch!**

Document your deployment:

- Deployment date: ******\_\_\_******
- Deployed by: ******\_\_\_******
- Version: ******\_\_\_******
- Notes: ******\_\_\_******
