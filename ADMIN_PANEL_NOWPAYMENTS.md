# Admin Panel - NOWPayments Withdrawal Management

## 🎯 Admin Panel Overview

This guide shows how to test and use the admin panel for managing withdrawals with NOWPayments integration.

---

## 📋 Admin Endpoints Available

### Authentication

-   **POST** `/api/auth/admin-login` - Admin login
-   **POST** `/api/auth/admin-recovery` - Request admin password recovery
-   **POST** `/api/auth/admin-recover` - Complete admin password reset

### Withdrawal Management

-   **GET** `/api/withdrawals/admin/all` - Get all withdrawals (with filters)
-   **POST** `/api/withdrawals/admin/:id/approve` - Approve withdrawal
-   **POST** `/api/withdrawals/admin/:id/reject` - Reject withdrawal

### NOWPayments Processing

-   **GET** `/api/nowpayments/balance` - Check merchant balance
-   **POST** `/api/nowpayments/process-withdrawals` - Process batch payouts

---

## 🚀 Quick Start with Postman

### 1. Import Collection & Environment

**Files Created:**

-   `Advancia_NOWPayments_Integration.postman_collection.json`
-   `Advancia_Local_Dev.postman_environment.json`

**Import Steps:**

1. Open Postman
2. Click **Import** button (top left)
3. Select both JSON files
4. Collection appears in left sidebar
5. Environment appears in top-right dropdown

### 2. Set Up Environment

Select "Advancia - Local Development" from environment dropdown (top right)

**Variables:**

-   `base_url`: `http://localhost:4000`
-   `auth_token`: (auto-filled after login)
-   `admin_token`: (auto-filled after admin login)
-   `withdrawal_id`: (auto-filled after creating withdrawal)

### 3. Enable Mock Server (Optional)

**In Postman:**

1. Right-click collection → **Mock Collection**
2. Name: "Advancia Mock Server"
3. Environment: "Advancia - Local Development"
4. Click **Create Mock Server**
5. Copy mock URL → Update `base_url` variable

**Benefits:**

-   Test without backend running
-   Simulate responses before implementation
-   Share with frontend team

---

## 🧪 Testing Workflow

### Step 1: Admin Login

```http
POST {{base_url}}/api/auth/admin-login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "admin-123",
    "email": "admin@example.com",
    "role": "ADMIN"
  }
}
```

✅ Token automatically saved to `{{admin_token}}`

---

### Step 2: View Pending Withdrawals

```http
GET {{base_url}}/api/withdrawals/admin/all?status=pending
Authorization: Bearer {{admin_token}}
```

**Response:**

```json
{
  "success": true,
  "withdrawals": [
    {
      "id": "withdrawal-123",
      "userId": "user-456",
      "user": {
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe"
      },
      "cryptoType": "btc",
      "cryptoAmount": 0.001,
      "withdrawalAddress": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      "status": "pending",
      "paymentProvider": "nowpayments",
      "createdAt": "2025-11-22T12:00:00Z"
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 20
  }
}
```

---

### Step 3: Filter by Payment Provider

```http
GET {{base_url}}/api/withdrawals/admin/all?status=pending&paymentProvider=nowpayments
Authorization: Bearer {{admin_token}}
```

Shows only NOWPayments withdrawals (for batch processing).

---

### Step 4: Approve Withdrawal

```http
POST {{base_url}}/api/withdrawals/admin/withdrawal-123/approve
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "adminNotes": "Verified user identity and wallet address"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Withdrawal approved",
  "withdrawal": {
    "id": "withdrawal-123",
    "status": "approved",
    "approvedBy": "admin-123",
    "approvedAt": "2025-11-22T12:05:00Z",
    "adminNotes": "Verified user identity and wallet address"
  }
}
```

---

### Step 5: Check Merchant Balance (Before Processing)

```http
GET {{base_url}}/api/nowpayments/balance
Authorization: Bearer {{admin_token}}
```

**Response:**

```json
{
  "success": true,
  "balance": {
    "btc": {
      "amount": 1.5,
      "pendingAmount": 0.05
    },
    "eth": {
      "amount": 10.2,
      "pendingAmount": 0
    },
    "usdt": {
      "amount": 50000,
      "pendingAmount": 500
    }
  }
}
```

✅ Verify you have enough balance to process withdrawals

---

### Step 6: Get Approved NOWPayments Withdrawals

```http
GET {{base_url}}/api/withdrawals/admin/all?status=approved&paymentProvider=nowpayments
Authorization: Bearer {{admin_token}}
```

Copy withdrawal IDs for batch processing.

---

### Step 7: Process Withdrawals (Batch Payout)

```http
POST {{base_url}}/api/nowpayments/process-withdrawals
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "withdrawalIds": [
    "withdrawal-123",
    "withdrawal-456",
    "withdrawal-789"
  ]
}
```

**Response:**

```json
{
  "success": true,
  "message": "3 withdrawals sent to NOWPayments",
  "batchId": "5000000713",
  "withdrawals": [
    {
      "id": "5000000000",
      "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      "currency": "btc",
      "amount": 0.001,
      "status": "WAITING",
      "unique_external_id": "withdrawal-123"
    }
  ]
}
```

✅ Withdrawals updated to `status: "processing"`  
✅ Batch ID stored in `adminNotes`

---

### Step 8: Monitor Processing Status

```http
GET {{base_url}}/api/withdrawals/admin/all?status=processing
Authorization: Bearer {{admin_token}}
```

Watch for webhook updates (status changes to `completed` or `failed`).

---

## 🖥️ Admin Panel UI Routes

### Frontend Admin Pages

Based on the backend routes, the admin panel should have these pages:

#### `/admin/dashboard`

-   Overview stats
-   Pending withdrawals count
-   Recent activity

#### `/admin/withdrawals`

**Tabs:**

1. **Pending** - Withdrawals awaiting approval
2. **Approved** - Ready for processing
3. **Processing** - Sent to NOWPayments
4. **Completed** - Successfully paid out
5. **Failed** - Errors occurred
6. **Rejected** - Admin declined

**Filters:**

-   Payment Provider (All / Cryptomus / NOWPayments)
-   Date Range
-   Amount Range
-   User Search

**Actions:**

-   ✅ Approve (single)
-   ❌ Reject (single)
-   💸 Process (batch - only NOWPayments)

#### `/admin/withdrawals/:id`

**Withdrawal Details Page:**

-   User information (name, email, KYC status)
-   Withdrawal details (amount, currency, address)
-   Payment provider selection
-   Status history timeline
-   Admin notes section
-   Approve/Reject buttons
-   Blockchain explorer link (after completion)

#### `/admin/nowpayments`

**NOWPayments Management:**

-   Merchant balance display (all currencies)
-   Approved withdrawals ready for processing
-   Batch payout interface with checkboxes
-   Recent payout history
-   Failed payout retry option

#### `/admin/users`

**User Management:**

-   User list with withdrawal history
-   Filter by users with pending withdrawals
-   User details → withdrawals tab

---

## 📊 Admin Panel Components Needed

### 1. Withdrawal Table Component

```tsx
interface Column {
  id: string;
  user: { name: string; email: string };
  amount: string;
  currency: string;
  provider: "cryptomus" | "nowpayments";
  status: "pending" | "approved" | "processing" | "completed" | "failed";
  createdAt: Date;
  actions: JSX.Element;
}
```

**Features:**

-   Sortable columns
-   Provider badge with color coding
    -   🟢 NOWPayments (green, 0.5% fees)
    -   🔵 Cryptomus (blue, 1% fees)
-   Status badge
-   Quick approve/reject actions
-   Checkbox for batch selection

### 2. Provider Comparison Card

```tsx
<ProviderCard provider="nowpayments">
  <Badge>⭐ Recommended</Badge>
  <Stat label="Fees" value="0.5%" />
  <Stat label="Currencies" value="200+" />
  <Stat label="Processing" value="10-60min" />
  <Button>Process Batch</Button>
</ProviderCard>
```

### 3. Balance Display Widget

```tsx
<BalanceWidget>
  <CurrencyBalance currency="BTC" amount={1.5} pending={0.05} />
  <CurrencyBalance currency="ETH" amount={10.2} pending={0} />
  <CurrencyBalance currency="USDT" amount={50000} pending={500} />
  <RefreshButton />
</BalanceWidget>
```

### 4. Batch Processing Modal

```tsx
<BatchProcessModal
  selectedWithdrawals={[...]}
  provider="nowpayments"
  totalAmount="0.003 BTC"
  availableBalance="1.5 BTC"
  onConfirm={handleProcessBatch}
/>
```

---

## 🔒 Admin Permissions

### Role Checks

```typescript
// Required role for withdrawal management
role: "ADMIN" | "SUPERADMIN";

// Permissions hierarchy:
USER < STAFF < ADMIN < SUPERADMIN;
```

### Endpoint Protection

All admin endpoints check:

1. Valid JWT token
2. Role is ADMIN or SUPERADMIN
3. Session not expired

### Frontend Route Guards

```tsx
<ProtectedRoute path="/admin/*" requiredRole={["ADMIN", "SUPERADMIN"]} component={AdminPanel} />
```

---

## 📈 Admin Dashboard Metrics

### Key Stats to Display

1. **Pending Withdrawals** - Needs approval
2. **Processing Withdrawals** - Sent to providers
3. **Today's Payouts** - Completed today
4. **Failed Payouts** - Needs attention
5. **Total Volume** - Last 30 days
6. **Average Processing Time** - By provider

### Charts

1. **Withdrawal Volume** - Line chart (last 30 days)
2. **Provider Usage** - Pie chart (Cryptomus vs NOWPayments)
3. **Success Rate** - Bar chart (by provider)
4. **Processing Time** - Comparison chart

---

## 🧪 Postman Testing Checklist

### Setup

-   [ ] Import collection
-   [ ] Import environment
-   [ ] Start local backend server
-   [ ] Set environment to "Advancia - Local Development"

### Authentication

-   [ ] Login as admin (saves token)
-   [ ] Verify token saved to `{{admin_token}}`

### View Withdrawals

-   [ ] Get all pending withdrawals
-   [ ] Filter by provider (NOWPayments)
-   [ ] Filter by status (approved)

### Approve/Reject

-   [ ] Approve a withdrawal
-   [ ] Reject a withdrawal with notes
-   [ ] Verify status changes

### NOWPayments Processing

-   [ ] Check merchant balance
-   [ ] Get approved NOWPayments withdrawals
-   [ ] Process batch (3+ withdrawals)
-   [ ] Verify status updates to "processing"

### Monitor

-   [ ] Get processing withdrawals
-   [ ] Wait for webhook (or trigger mock)
-   [ ] Verify completion status

---

## 🚨 Error Handling

### Common Errors

#### 401 Unauthorized

```json
{
  "error": "Invalid or expired token"
}
```

**Fix:** Re-login to get fresh token

#### 403 Forbidden

```json
{
  "error": "Admin access required"
}
```

**Fix:** Ensure user has ADMIN/SUPERADMIN role

#### 404 Not Found

```json
{
  "error": "Withdrawal not found"
}
```

**Fix:** Check withdrawal ID is correct

#### 400 Bad Request

```json
{
  "error": "Invalid payment provider. Choose: cryptomus or nowpayments"
}
```

**Fix:** Use valid provider name

#### 500 NOWPayments API Error

```json
{
  "error": "Failed to process withdrawals",
  "details": "Insufficient balance in merchant account"
}
```

**Fix:** Top up NOWPayments merchant account

---

## 📞 Support

### NOWPayments Support

-   Dashboard: <https://account.nowpayments.io/>
-   API Docs: <https://documenter.getpostman.com/view/7907941/S1a32n38>
-   Support: <support@nowpayments.io>

### Testing Resources

-   Postman Collection: `Advancia_NOWPayments_Integration.postman_collection.json`
-   Environment: `Advancia_Local_Dev.postman_environment.json`
-   Documentation: `NOWPAYMENTS_WITHDRAWAL_SYSTEM.md`
-   Server Fix: `SERVER_SHUTDOWN_FIX.md`

---

## ✅ Next Steps

1. **Import Postman Collection** - Start testing immediately
2. **Create Admin UI** - Build React components
3. **Test Batch Processing** - Process 3+ withdrawals
4. **Configure Webhooks** - Use ngrok for IPN testing
5. **Production Deployment** - Switch to production API keys

**Admin panel backend is fully functional!** 🎉
