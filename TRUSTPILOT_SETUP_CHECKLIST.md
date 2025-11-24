# ✅ Trustpilot Automation - Quick Setup Checklist

## Prerequisites

-   [ ] Active Trustpilot business account
-   [ ] Access to Trustpilot Business Portal
-   [ ] Backend running with database access
-   [ ] Admin account credentials

## Step 1: Get Trustpilot Credentials (5 minutes)

1. [ ] Log in to <https://businessapp.b2b.trustpilot.com/>
2. [ ] Navigate to **Integrations** → **API**
3. [ ] Click **Create API key**
4. [ ] Copy **API Key** (starts with "tp\_")
5. [ ] Go to **Account Settings** → Copy **Business Unit ID**

## Step 2: Install Dependencies (2 minutes)

```powershell
cd backend
npm install node-cron @types/node-cron
```

## Step 3: Configure Environment (3 minutes)

### Backend `.env`

```bash
TRUSTPILOT_API_KEY=tp_your_actual_api_key_here
TRUSTPILOT_BUSINESS_UNIT_ID=your_business_unit_id_here
```

### Frontend `.env.local`

```bash
NEXT_PUBLIC_TRUSTPILOT_BUSINESS_UNIT_ID=your_business_unit_id_here
NEXT_PUBLIC_TRUSTPILOT_DOMAIN=advanciapayledger.com
```

## Step 4: Database Migration (2 minutes)

```powershell
cd backend
npx prisma migrate dev --name add-trustpilot-reviews
npx prisma generate
```

## Step 5: Test Backend (5 minutes)

```powershell
# Start server
cd backend
npm run dev

# New terminal - test stats endpoint
curl http://localhost:4000/api/trustpilot/stats

# Should return: {"success": true, "stats": {...}}
```

## Step 6: Trigger Initial Sync (2 minutes)

### Option A: Via Admin API

```powershell
# Get admin JWT token first (login as admin)
$token = "YOUR_ADMIN_JWT_TOKEN"

curl -X POST http://localhost:4000/api/trustpilot/sync `
  -H "Authorization: Bearer $token"
```

### Option B: Via Code

```typescript
import rpaScheduler from "./rpa/scheduler";
await rpaScheduler.runTask("trustpilotSync");
```

## Step 7: Verify Database (1 minute)

```powershell
cd backend
npx prisma studio

# Navigate to TrustpilotReview table
# Should see synced reviews
```

## Step 8: Add to Frontend (5 minutes)

Edit `frontend/src/app/page.tsx`:

```tsx
import TrustpilotReviews from "@/components/TrustpilotReviews";

export default function HomePage() {
  return (
    <div>
      {/* Your existing content */}

      <section className="container mx-auto px-4 py-12">
        <TrustpilotReviews limit={6} showTitle={true} />
      </section>
    </div>
  );
}
```

## Step 9: Test Frontend (2 minutes)

```powershell
cd frontend
npm run dev

# Visit http://localhost:3000
# Should see reviews displayed
```

## Step 10: Enable Automated Sync (1 minute)

In `backend/.env`, add or verify:

```bash
RPA_AUTO_START=true
```

Restart backend - reviews will now sync every 6 hours automatically.

---

## ⚡ Quick Commands Reference

### Manual Sync

```powershell
curl -X POST http://localhost:4000/api/trustpilot/sync `
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### View Reviews

```powershell
curl http://localhost:4000/api/trustpilot/reviews?limit=10
```

### View Stats

```powershell
curl http://localhost:4000/api/trustpilot/stats
```

### Check Scheduler Status

```powershell
curl http://localhost:4000/api/rpa/status `
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## 🐛 Troubleshooting

### Issue: npm install fails

```powershell
npm cache clean --force
Remove-Item -Recurse -Force node_modules
npm install
```

### Issue: No reviews syncing

1. Check API credentials in `.env`
2. Test Trustpilot API directly:

   ```powershell
   curl "https://api.trustpilot.com/v1/business-units/YOUR_BU_ID/reviews" `
     -H "apikey: YOUR_API_KEY"
   ```

3. Check backend logs for errors

### Issue: Reviews not displaying on frontend

1. Check `NEXT_PUBLIC_API_URL` is set correctly
2. Verify reviews are marked `isPublished: true` in database
3. Check browser console for errors

### Issue: Migration fails

```powershell
# Reset if needed
npx prisma migrate reset
npx prisma migrate dev
npx prisma generate
```

---

## ✨ Success Criteria

-   [ ] ✅ Backend starts without errors
-   [ ] ✅ Stats endpoint returns data
-   [ ] ✅ Manual sync completes successfully
-   [ ] ✅ Reviews visible in database (Prisma Studio)
-   [ ] ✅ Reviews display on frontend
-   [ ] ✅ Automated sync scheduled (check logs)

---

## 📚 Documentation

-   **Full Guide**: `TRUSTPILOT_AUTOMATION_GUIDE.md`
-   **Implementation Details**: `TRUSTPILOT_IMPLEMENTATION_SUMMARY.md`
-   **Trustpilot API Docs**: <https://documentation-apidocumentation.trustpilot.com/>

---

**Total Setup Time**: ~25 minutes  
**Status**: Ready for Production ✅
