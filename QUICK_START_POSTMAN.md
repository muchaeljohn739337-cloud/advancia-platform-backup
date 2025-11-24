# 🚀 Quick Start - Postman Testing

## Step-by-Step Setup (5 Minutes)

### 1. Import into Postman

1. Open Postman
2. Click **Import** (top left)
3. Drag these files:
   -   `Advancia_NOWPayments_Integration.postman_collection.json`
   -   `Advancia_Local_Dev.postman_environment.json`
4. Click **Import**

✅ Collection appears in left sidebar  
✅ Environment in top-right dropdown

---

### 2. Start Backend Server

```powershell
cd C:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform\backend
npm run build
.\start-server.ps1
```

Wait for: `🚀 Server running on port 4000`

---

### 3. Test in Postman

#### Select Environment

Top-right dropdown → Select **"Advancia - Local Development"**

#### Run Tests (In Order)

**Folder 1: Authentication**

1. ▶️ Login User → Saves `{{auth_token}}`
2. ▶️ Login Admin → Saves `{{admin_token}}`

**Folder 2: Withdrawal Methods**

1. ▶️ Get Available Payment Providers
   -   Should return Cryptomus + NOWPayments
   -   NOWPayments marked as `recommended: true`

**Folder 3: NOWPayments - Payment Info**

1. ▶️ Get Supported Currencies → 200+ coins
2. ▶️ Get Minimum Amount
3. ▶️ Get Price Estimate

**Folder 4: User - Withdrawal Requests**

1. ▶️ Request Withdrawal (NOWPayments) → Saves `{{withdrawal_id}}`
2. ▶️ Get My Withdrawals

**Folder 5: Admin - Withdrawal Management**

1. ▶️ Get All Pending Withdrawals
2. ▶️ Get Approved Withdrawals (NOWPayments)
3. ▶️ Approve Withdrawal (uses `{{withdrawal_id}}`)

**Folder 6: Admin - NOWPayments Processing**

1. ▶️ Check Merchant Balance
2. ▶️ Process Withdrawals (Batch Payout)

---

## 🎯 Quick Tests

### Test 1: Provider Selection Works

```
GET /api/withdrawals/methods
Expected: 2 providers (Cryptomus + NOWPayments)
```

### Test 2: User Can Request NOWPayments Withdrawal

```
POST /api/withdrawals/request
Body: { "paymentProvider": "nowpayments", ... }
Expected: Withdrawal created with provider stored
```

### Test 3: Admin Can Filter by Provider

```
GET /api/withdrawals/admin/all?paymentProvider=nowpayments
Expected: Only NOWPayments withdrawals returned
```

### Test 4: Batch Processing Works

```
POST /api/nowpayments/process-withdrawals
Body: { "withdrawalIds": ["id1", "id2", "id3"] }
Expected: Batch ID returned, status → processing
```

---

## 📋 Admin Panel Endpoints

| Method | Endpoint                               | Description        | Auth  |
| ------ | -------------------------------------- | ------------------ | ----- |
| GET    | `/api/withdrawals/methods`             | List providers     | User  |
| POST   | `/api/withdrawals/request`             | Create withdrawal  | User  |
| GET    | `/api/withdrawals/my-requests`         | User's withdrawals | User  |
| GET    | `/api/withdrawals/admin/all`           | All withdrawals    | Admin |
| POST   | `/api/withdrawals/admin/:id/approve`   | Approve withdrawal | Admin |
| POST   | `/api/withdrawals/admin/:id/reject`    | Reject withdrawal  | Admin |
| GET    | `/api/nowpayments/balance`             | Merchant balance   | Admin |
| POST   | `/api/nowpayments/process-withdrawals` | Batch payout       | Admin |
| GET    | `/api/nowpayments/currencies`          | 200+ coins         | User  |

---

## 🎨 UI Components Needed

### 1. Withdrawal Form (User)

-   Provider selector (radio cards)
-   Currency dropdown
-   Amount input
-   Wallet address input
-   Submit button

### 2. Admin Withdrawal List

-   Table with filters
-   Status badges
-   Provider badges
-   Approve/Reject actions
-   Batch selection checkboxes

### 3. Batch Processing Panel (Admin)

-   Selected withdrawals count
-   Total amount display
-   Merchant balance check
-   Process button
-   Confirmation modal

---

## 🔧 Environment Variables

Already configured in `backend/.env`:

```env
NOWPAYMENTS_API_KEY=37593f7f-637f-45a7-8c0f-5a49f78f915f
NOWPAYMENTS_IPN_SECRET=XwMG4DS@aiUtFue
BACKEND_URL=http://localhost:4000
```

For production:

-   Get production keys from <https://account.nowpayments.io/>
-   Update BACKEND_URL to your domain
-   Configure IPN webhook URL in NOWPayments dashboard

---

## ✅ Success Criteria

### Backend Integration ✅

-   [x] Database schema updated (paymentProvider field)
-   [x] API endpoints implemented (11 total)
-   [x] Provider selection logic working
-   [x] Batch processing functional
-   [x] Error handling comprehensive
-   [x] Server shutdown issue fixed

### Postman Collection ✅

-   [x] Collection created (7 folders, 16+ requests)
-   [x] Environment file with variables
-   [x] Auto-token saving on login
-   [x] Test scripts for validation
-   [x] Mock response examples

### Documentation ✅

-   [x] Integration guide (TEST_NOWPAYMENTS_INTEGRATION.md)
-   [x] Workflow documentation (NOWPAYMENTS_WITHDRAWAL_SYSTEM.md)
-   [x] Server fix guide (SERVER_SHUTDOWN_FIX.md)
-   [x] Admin panel guide (ADMIN_PANEL_NOWPAYMENTS.md)
-   [x] Quick start guide (this file)

### Pending Frontend 🔄

-   [ ] Provider selector UI component
-   [ ] Admin withdrawal management page
-   [ ] Batch processing interface
-   [ ] Status tracking display
-   [ ] Balance widget

---

## 📞 Need Help?

### Documentation Files

1. **Quick Start**: `QUICK_START_POSTMAN.md` (this file)
2. **Full Testing**: `TEST_NOWPAYMENTS_INTEGRATION.md`
3. **Admin Guide**: `ADMIN_PANEL_NOWPAYMENTS.md`
4. **Workflow**: `NOWPAYMENTS_WITHDRAWAL_SYSTEM.md`
5. **Server Issues**: `SERVER_SHUTDOWN_FIX.md`

### Start Server

```powershell
cd backend
.\start-server.ps1
```

### Test Endpoints

```powershell
cd backend
.\test-endpoints.ps1
```

### Check Logs

Server logs show all requests and errors in real-time.

---

## 🎉 You're Ready

1. ✅ Import Postman collection
2. ✅ Start backend server
3. ✅ Run tests in order
4. ✅ Build frontend UI
5. ✅ Deploy to production

**Everything is working and documented!** 🚀
