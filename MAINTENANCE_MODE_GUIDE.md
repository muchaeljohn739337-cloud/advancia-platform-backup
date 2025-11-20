# 🔧 Automated Maintenance Mode System

## Overview

Professional maintenance/downtime page with company information, payment partners, and automated health checking.

---

## 🎯 Features

### Maintenance Page (`/maintenance`)

✅ Animated rotating gear icon
✅ Clear "We'll Be Right Back" messaging
✅ Expected completion time display
✅ Auto-refresh countdown (checks every 15 seconds)
✅ Manual "Check Status" button
✅ Support contact information
✅ **Company information footer** (like VeePN):

- Payment processing partners (Stripe, Cryptomus)
- Legal entity: Advancia Technologies LLC
- Registration details (FinCEN, State licenses)
- Trust badges (Bank-Level Security, SSL, PCI Compliant)

### Global Footer Component

✅ Professional footer for all pages
✅ Social media links
✅ Quick navigation links
✅ Legal/compliance links
✅ Payment partners disclosure
✅ Company registration info
✅ Risk disclosure statement
✅ Trust badges

---

## 🚀 How to Enable Maintenance Mode

### Method 1: Environment Variable (Recommended)

**Backend (.env):**

```bash
MAINTENANCE_MODE=true
```

**Frontend (.env.local):**

```bash
NEXT_PUBLIC_MAINTENANCE_MODE=true
```

**Restart services:**

```bash
# Development
npm run dev

# Production (PM2)
pm2 restart all

# Render.com
# Set environment variable in dashboard → Manual Deploy
```

### Method 2: PowerShell Script

Use the provided toggle script:

```powershell
.\scripts\toggle-maintenance.ps1
```

Choose option:

- `1` - Enable maintenance mode
- `2` - Disable maintenance mode

### Method 3: Middleware Check

The system automatically redirects to `/maintenance` when:

- `MAINTENANCE_MODE=true` in environment
- Backend health check fails
- Manual override via admin panel

---

## 📝 Customization

### Update Company Information

Edit `frontend/src/components/Footer.tsx`:

```tsx
// Change payment partners
<strong>Payment Processing Partners:</strong> Your Partners Here

// Change legal entity
Services provided by <strong>Your Company Name</strong>, registered in Your Location.

// Change registration info
FinCEN MSB Registration: Your Registration Number
State Money Transmitter Licenses: Your Licenses
```

### Update Maintenance Page

Edit `frontend/src/app/maintenance/page.tsx`:

```tsx
// Change completion time
Expected completion time: Within 30 minutes

// Change support email
support@advanciapayledger.com

// Change company name
Advancia Technologies LLC
```

---

## 🤖 Automated Health Checks

The maintenance page automatically:

1. **Checks health endpoint** every 15 seconds
2. **Auto-redirects** to dashboard when system is back online
3. **Shows countdown** to next check
4. **Manual check button** for immediate verification

**Health Check Endpoint:**

```
GET https://api.advanciapayledger.com/api/health
```

**Expected Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-11-19T...",
  "environment": "production"
}
```

---

## 📊 Monitoring Integration

### Trigger Maintenance Mode Automatically

**Using PM2 Ecosystem:**

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "advancia-backend",
      script: "./src/index.js",
      env: {
        MAINTENANCE_MODE: "false",
      },
      env_production: {
        MAINTENANCE_MODE: "false",
      },
    },
  ],
};
```

**Using GitHub Actions:**

```yaml
# .github/workflows/maintenance.yml
name: Toggle Maintenance Mode
on:
  workflow_dispatch:
    inputs:
      enabled:
        description: "Enable maintenance mode"
        required: true
        type: boolean

jobs:
  toggle:
    runs-on: ubuntu-latest
    steps:
      - name: Update Render Environment
        run: |
          curl -X PATCH \
            https://api.render.com/v1/services/${{ secrets.RENDER_SERVICE_ID }}/env-vars \
            -H "Authorization: Bearer ${{ secrets.RENDER_API_KEY }}" \
            -d '{"key": "MAINTENANCE_MODE", "value": "${{ inputs.enabled }}"}'
```

---

## 🎨 VeePN-Style Elements

Implemented features similar to VeePN's maintenance/checkout pages:

### 1. Company Footer

- ✅ Legal entity disclosure
- ✅ Payment partners listed
- ✅ Registration numbers shown
- ✅ Trust badges displayed

### 2. Professional Design

- ✅ Animated background gradients
- ✅ Backdrop blur effects
- ✅ Smooth animations (Framer Motion)
- ✅ Responsive layout

### 3. Trust Elements

- ✅ Security badges (SSL, PCI)
- ✅ Company verification
- ✅ Contact information
- ✅ Legal compliance statements

---

## 📦 Files Created/Modified

### New Files:

- ✅ `frontend/src/components/Footer.tsx` - Global footer component
- ✅ `frontend/src/app/payments/checkout/page.tsx` - VeePN-style checkout

### Modified Files:

- ✅ `frontend/src/app/maintenance/page.tsx` - Enhanced with company info
- ✅ `scripts/toggle-maintenance.ps1` - Maintenance mode toggle script

---

## 🔐 Security Considerations

1. **Health Check Endpoint**: Ensure it's publicly accessible but rate-limited
2. **Environment Variables**: Never commit `.env` files
3. **Maintenance Mode**: Use for planned maintenance only
4. **Auto-redirect**: Prevents users from being stuck on maintenance page

---

## 📞 Support

For questions about maintenance mode:

- **Email**: support@advanciapayledger.com
- **Docs**: Check this file
- **Status**: https://status.advanciapayledger.com

---

## ✅ Quick Checklist

Before enabling maintenance mode:

- [ ] Announce maintenance window to users (email/notifications)
- [ ] Set `MAINTENANCE_MODE=true` in environment
- [ ] Restart services (PM2/Render)
- [ ] Verify maintenance page displays correctly
- [ ] Monitor backend logs for completion
- [ ] Set `MAINTENANCE_MODE=false` when done
- [ ] Verify auto-redirect works

---

**Last Updated**: November 19, 2025
**Version**: 1.0.0
**Status**: Production Ready ✅
