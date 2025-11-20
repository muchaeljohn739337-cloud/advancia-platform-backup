# 🔐 Admin Login Troubleshooting Guide

## ✅ System Status Check (Completed)

### Admin User Status:
- **Email**: admin@advancia.com
- **Password**: Admin@123
- **Role**: ADMIN
- **Active**: Yes
- **Created**: November 10, 2025

### Admin Login Flow:
1. **Step 1**: POST /api/auth/admin/login
   - Verifies email + password
   - Generates 6-digit OTP
   - Sends OTP via SMS (Twilio) or shows in console

2. **Step 2**: POST /api/auth/admin/verify-otp
   - Verifies OTP code
   - Issues JWT tokens
   - Redirects to /admin/sessions

---

## 🔧 Common Login Issues & Solutions

### Issue 1: "Invalid credentials"
**Cause**: Wrong email or password  
**Solution**: Use correct credentials:
- Email: `admin@advancia.com`
- Password: `Admin@123`

### Issue 2: OTP not received
**Cause**: Twilio not configured or phone number missing

**Solutions**:

**Option A: Use Development Mode (Console OTP)**
1. Check backend console/logs
2. OTP will be displayed in terminal:
   ```
   [DEV] Admin OTP for admin@advancia.com: 123456
   ```
3. Use the 6-digit code from console

**Option B: Configure Twilio SMS**
Add to `backend/.env`:
```properties
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### Issue 3: "No admin user found in database"
**Cause**: Admin user missing from database

**Solution**: Run seed script
```bash
cd backend
npm run db:seed
```

### Issue 4: "OTP expired"
**Cause**: OTP valid for only 5 minutes

**Solution**: 
1. Go back to login screen
2. Request new OTP
3. Enter within 5 minutes

### Issue 5: "Too many attempts"
**Cause**: Rate limiting after failed attempts

**Solution**:
1. Wait 30 minutes
2. Or restart backend server to clear rate limit cache

### Issue 6: Frontend can't reach backend
**Cause**: Backend not running or CORS issues

**Solution**:
```bash
# Check backend is running
cd backend
npm run dev

# Should see: Server running on port 4000
```

### Issue 7: Network/CORS errors
**Cause**: Frontend can't connect to backend API

**Solution**:
1. Check `NEXT_PUBLIC_API_URL` in frontend/.env.local:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:4000
   ```

2. Check CORS settings in backend
3. Ensure both servers are running

---

## 🚀 Quick Login Test

### Terminal Test (Bypass Frontend):

**Step 1: Get OTP**
```bash
curl -X POST http://localhost:4000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@advancia.com",
    "password": "Admin@123",
    "phone": "+1234567890"
  }'
```

**Expected Response**:
```json
{
  "step": "verify_otp",
  "message": "OTP generated (check server logs)",
  "code": "123456"
}
```

**Step 2: Check backend console for OTP**
Look for line like:
```
[DEV] Admin OTP for admin@advancia.com: 123456
```

**Step 3: Verify OTP**
```bash
curl -X POST http://localhost:4000/api/auth/admin/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@advancia.com",
    "code": "123456"
  }'
```

**Expected Response**:
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "email": "admin@advancia.com",
  "role": "ADMIN"
}
```

---

## 🔍 Debug Checklist

### Backend Checks:
- [ ] Backend server running on port 4000
- [ ] Database connected (check logs)
- [ ] Admin user exists in database
- [ ] `.env` file has `JWT_SECRET`
- [ ] Console shows OTP when login attempted

### Frontend Checks:
- [ ] Frontend running on port 3000
- [ ] Can access http://localhost:3000/admin/login
- [ ] Browser console shows no errors
- [ ] `NEXT_PUBLIC_API_URL` is set correctly
- [ ] Network tab shows API requests being made

### Login Flow Checks:
- [ ] Email field: admin@advancia.com
- [ ] Password field: Admin@123
- [ ] Phone field: +1234567890 (optional)
- [ ] Click "Continue"
- [ ] Check backend console for OTP
- [ ] Enter 6-digit OTP
- [ ] Click "Verify Code"

---

## 🛠️ Manual Database Fix (If Needed)

### Create/Update Admin User:
```typescript
// Run in backend/scripts/fix-admin.ts
import prisma from "../src/prismaClient";
import bcrypt from "bcrypt";

async function fixAdmin() {
  const hashedPassword = await bcrypt.hash("Admin@123", 10);
  
  const admin = await prisma.user.upsert({
    where: { email: "admin@advancia.com" },
    update: {
      passwordHash: hashedPassword,
      role: "ADMIN",
      active: true,
    },
    create: {
      email: "admin@advancia.com",
      username: "admin",
      passwordHash: hashedPassword,
      role: "ADMIN",
      active: true,
      emailVerified: true,
    },
  });

  console.log("✅ Admin user ready:", admin.email);
}

fixAdmin();
```

Run with:
```bash
cd backend
npx tsx scripts/fix-admin.ts
```

---

## 📞 Testing with Real Phone (Production)

### Setup Twilio:
1. Sign up at https://www.twilio.com
2. Get Account SID, Auth Token, and Phone Number
3. Add to `backend/.env`:
   ```properties
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=...
   TWILIO_PHONE_NUMBER=+1234567890
   ```
4. Restart backend
5. Enter your real phone number when logging in
6. Receive OTP via SMS

---

## 🎯 Current System Status

✅ **Admin User**: EXISTS  
✅ **Email**: admin@advancia.com  
✅ **Password**: Admin@123  
✅ **Role**: ADMIN  
✅ **Active**: true  
✅ **Backend**: Running (check with curl http://localhost:4000/health)  
⚠️ **Twilio**: Not configured (using console OTP)

---

## 📝 Next Steps

### For Development:
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Go to: http://localhost:3000/admin/login
4. Enter credentials
5. Check backend console for OTP
6. Enter OTP to login

### For Production:
1. Configure Twilio for SMS OTP
2. Set `ADMIN_EMAIL` and `ADMIN_PASS` in production .env
3. Use strong password (not default)
4. Enable 2FA for additional security
5. Monitor admin login logs

---

## 🆘 Still Having Issues?

### Enable Debug Mode:
Add to backend console logging:
```typescript
// In authAdmin.ts login route
console.log("Login attempt:", { email, password: '***', phone });
console.log("Expected:", { 
  email: ADMIN_EMAIL, 
  password: ADMIN_PASS 
});
```

### Check Browser Network Tab:
1. Open DevTools (F12)
2. Go to Network tab
3. Attempt login
4. Look for failed requests
5. Check request/response details

### Check Backend Logs:
```bash
# In backend directory
npm run dev
# Watch console for errors
```

---

**Last Updated**: November 10, 2025  
**Admin User Verified**: ✅ Yes  
**System Ready**: ✅ Yes
