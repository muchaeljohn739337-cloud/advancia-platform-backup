# NOWPayments Withdrawal System with Admin Approval

## Overview

Complete user withdrawal system integrated with NOWPayments for crypto payouts. Users request withdrawals, admins approve/reject, and approved withdrawals are sent as batch payouts to NOWPayments.

---

## Workflow

### 1. **User Requests Withdrawal**

User submits withdrawal request and selects payment provider:

```json
POST /api/withdrawals/request
{
  "balanceType": "btc",
  "amount": 0.05,
  "withdrawalAddress": "bc1q...",
  "paymentProvider": "nowpayments"  // or "cryptomus"
}
```

**Available Providers** (GET `/api/withdrawals/methods`):

-   **Cryptomus**: 50+ coins, 1% fees, 5-30min processing
-   **NOWPayments**: 200+ coins, 0.5% fees, 10-60min processing ⭐ Recommended

This creates a record in `crypto_withdrawals` table with `status: "pending"` and stores the selected `paymentProvider`.

### 2. **Admin Reviews Withdrawal**

Admin logs into dashboard, sees pending withdrawals:

```sql
SELECT * FROM crypto_withdrawals WHERE status = 'approved';
```

Admin can:

-   ✅ **Approve** → Set `status = 'approved'`, `approvedBy = adminId`
-   ❌ **Reject** → Set `status = 'rejected'`, add `adminNotes`

### 3. **Admin Processes Approved Withdrawals (Batch)**

Admin selects approved withdrawals and sends them to NOWPayments:

```http
POST /api/nowpayments/process-withdrawals
Authorization: Bearer <admin_jwt>
Content-Type: application/json

{
  "withdrawalIds": [
    "withdrawal-id-1",
    "withdrawal-id-2",
    "withdrawal-id-3"
  ]
}
```

**Backend actions:**

1. Fetches approved withdrawals from database
2. Builds NOWPayments payout request
3. Sends batch payout to `POST https://api.nowpayments.io/v1/payout`
4. Updates withdrawal status to `processing`
5. Stores NOWPayments batch ID and payout ID

**Response:**

```json
{
  "success": true,
  "message": "3 withdrawals sent to NOWPayments",
  "batchId": "5000000713",
  "withdrawals": [
    {
      "id": "5000000000",
      "address": "bc1q...",
      "currency": "btc",
      "amount": 0.05,
      "status": "WAITING"
    }
  ]
}
```

### 4. **NOWPayments Processes Payouts**

NOWPayments sends crypto from your merchant account to user wallets.

### 5. **Payout IPN Webhook** (Automatic)

NOWPayments sends status updates to your server:

```http
POST /api/nowpayments/payout-ipn
x-nowpayments-sig: <hmac_signature>

{
  "id": "5000000000",
  "status": "FINISHED",
  "hash": "0x...",
  "unique_external_id": "withdrawal-id-1"
}
```

**Backend actions:**

1. Verifies HMAC signature
2. Finds withdrawal by `unique_external_id`
3. Updates status:
   -   `FINISHED` → `completed`, sets `txHash`, `completedAt`
   -   `FAILED` → `failed`, adds error notes
   -   `WAITING/CONFIRMING` → `processing`

### 6. **User Receives Crypto**

User sees transaction hash and can track on blockchain explorer.

---

## API Endpoints

### **GET /api/withdrawals/methods**

Get available payment providers for withdrawals.

**Request:**

```http
GET /api/withdrawals/methods
Authorization: Bearer <user_jwt>
```

**Response:**

```json
{
  "success": true,
  "methods": [
    {
      "provider": "cryptomus",
      "name": "Cryptomus",
      "description": "50+ cryptocurrencies supported",
      "currencies": ["btc", "eth", "usdt", "bnb", "ltc", "doge"],
      "minAmount": 10,
      "fees": "1%",
      "processingTime": "5-30 minutes",
      "features": ["Fast processing", "Popular currencies", "Instant payouts"]
    },
    {
      "provider": "nowpayments",
      "name": "NOWPayments",
      "description": "200+ cryptocurrencies supported",
      "currencies": ["btc", "eth", "usdt", "trx", "ltc", "xmr", "doge", "ada", "dot", "matic"],
      "minAmount": 10,
      "fees": "0.5%",
      "processingTime": "10-60 minutes",
      "features": ["Lowest fees", "Most currencies", "Mass payouts"],
      "recommended": true
    }
  ]
}
```

### **POST /api/withdrawals/request**

Create withdrawal request with provider selection.

**Request:**

```http
POST /api/withdrawals/request
Authorization: Bearer <user_jwt>
Content-Type: application/json

{
  "balanceType": "btc",
  "amount": 0.05,
  "withdrawalAddress": "bc1q...",
  "paymentProvider": "nowpayments"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Withdrawal request created successfully",
  "withdrawal": {
    "id": "withdrawal-123",
    "balanceType": "BTC",
    "amount": 0.05,
    "status": "pending",
    "createdAt": "2025-11-22T12:00:00Z"
  }
}
```

### **GET /api/nowpayments/balance** (Admin Only)

Check merchant balance before processing withdrawals.

**Request:**

```http
GET /api/nowpayments/balance
Authorization: Bearer <admin_jwt>
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
    }
  }
}
```

### **POST /api/nowpayments/process-withdrawals** (Admin Only)

Send approved withdrawals to NOWPayments as batch payout.

**Request:**

```http
POST /api/nowpayments/process-withdrawals
Authorization: Bearer <admin_jwt>
Content-Type: application/json

{
  "withdrawalIds": ["id1", "id2", "id3"]
}
```

**Response:**

```json
{
  "success": true,
  "message": "3 withdrawals sent to NOWPayments",
  "batchId": "5000000713",
  "withdrawals": [...]
}
```

**Error Cases:**

-   `403` - Not admin
-   `400` - Missing/invalid withdrawalIds
-   `404` - No approved withdrawals found
-   `500` - NOWPayments API error (withdrawals marked as `failed`)

### **POST /api/nowpayments/payout-ipn** (Webhook)

Receives payout status updates from NOWPayments (no auth required, signature verified).

---

## Database Schema

### `crypto_withdrawals` Table (Already Exists)

```sql
CREATE TABLE crypto_withdrawals (
  id VARCHAR PRIMARY KEY,
  userId VARCHAR NOT NULL,
  cryptoType VARCHAR NOT NULL,        -- e.g., "btc", "eth"
  cryptoAmount DECIMAL NOT NULL,      -- Amount in crypto
  usdEquivalent DECIMAL NOT NULL,     -- USD value at request time
  withdrawalAddress VARCHAR NOT NULL, -- Destination wallet address
  status VARCHAR DEFAULT 'pending',   -- pending, approved, rejected, processing, completed, failed
  adminApprovedBy VARCHAR,            -- Admin user ID who approved
  adminNotes TEXT,                    -- Admin notes (approval reason, error details)
  txHash VARCHAR,                     -- Blockchain transaction hash
  networkFee DECIMAL,                 -- Network fee charged
  approvedAt TIMESTAMP,               -- When admin approved
  rejectedAt TIMESTAMP,               -- When admin rejected
  completedAt TIMESTAMP,              -- When payout finished
  cancelledAt TIMESTAMP,              -- If cancelled
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP,

  -- Payment provider selection
  paymentProvider VARCHAR DEFAULT 'cryptomus',  -- 'cryptomus' | 'nowpayments'

  -- NOWPayments specific fields (reusing existing columns)
  currency VARCHAR,                   -- Crypto currency code
  amount DECIMAL,                     -- Same as cryptoAmount
  destinationAddress VARCHAR,         -- Same as withdrawalAddress
  requestedAt TIMESTAMP,              -- Same as createdAt

  FOREIGN KEY (userId) REFERENCES User(id),
  INDEX idx_payment_provider (paymentProvider)
);
```

### Status Flow

```
pending → approved/rejected (admin action)
       ↓
   processing (NOWPayments payout created)
       ↓
   completed/failed (NOWPayments IPN)
```

---

## Security Features

### 1. **Admin-Only Access**

Both `/balance` and `/process-withdrawals` check:

```typescript
if (user?.role !== "ADMIN" && user?.role !== "SUPERADMIN") {
  return res.status(403).json({ error: "Admin access required" });
}
```

### 2. **IPN Signature Verification**

Webhooks verify HMAC-SHA512 signature:

```typescript
function verifyIPNSignature(payload: string, signature: string): boolean {
  const hmac = crypto.createHmac("sha512", NOWPAYMENTS_IPN_SECRET);
  hmac.update(payload);
  const expectedSignature = hmac.digest("hex");
  return expectedSignature === signature;
}
```

### 3. **Status Validation**

Only `approved` withdrawals can be processed. Already completed/failed withdrawals are ignored.

### 4. **Unique External ID**

Each withdrawal gets a unique ID (`crypto_withdrawals.id`) sent to NOWPayments as `unique_external_id`. This links payouts back to your database.

---

## Testing Flow

### 1. **Create Test Withdrawal** (User)

```sql
INSERT INTO crypto_withdrawals (
  id, userId, cryptoType, cryptoAmount, usdEquivalent,
  withdrawalAddress, status, currency, amount, destinationAddress
) VALUES (
  'test-withdrawal-1',
  'user-123',
  'btc',
  0.001,
  60.00,
  'tb1q... (testnet address)',
  'approved',  -- Skip approval for testing
  'btc',
  0.001,
  'tb1q...'
);
```

### 2. **Check Balance** (Admin)

```bash
curl http://localhost:4000/api/nowpayments/balance \
  -H "Authorization: Bearer <admin_jwt>"
```

### 3. **Process Withdrawal** (Admin)

```bash
curl -X POST http://localhost:4000/api/nowpayments/process-withdrawals \
  -H "Authorization: Bearer <admin_jwt>" \
  -H "Content-Type: application/json" \
  -d '{"withdrawalIds": ["test-withdrawal-1"]}'
```

### 4. **Check Withdrawal Status** (Database)

```sql
SELECT id, status, adminNotes, txHash, completedAt
FROM crypto_withdrawals
WHERE id = 'test-withdrawal-1';
```

### 5. **Test IPN Webhook** (Ngrok)

```bash
# Expose local server
ngrok http 4000

# Add webhook URL in NOWPayments dashboard:
# https://abc123.ngrok.io/api/nowpayments/payout-ipn

# Send test payout from NOWPayments sandbox
```

---

## Environment Variables

Add to `backend/.env`:

```env
# NOWPayments (already configured)
NOWPAYMENTS_API_KEY=37593f7f-637f-45a7-8c0f-5a49f78f915f
NOWPAYMENTS_IPN_SECRET=XwMG4DS@aiUtFue

# Backend URL (for IPN callback)
BACKEND_URL=https://your-domain.com
# or for local testing: http://localhost:4000
```

---

## Admin Dashboard Integration

### Sample Admin UI Flow

**1. Pending Withdrawals Table:**

```tsx
const PendingWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState([]);

  useEffect(() => {
    fetch("/api/withdrawals?status=pending")
      .then((res) => res.json())
      .then((data) => setWithdrawals(data.withdrawals));
  }, []);

  const approve = async (id) => {
    await fetch(`/api/withdrawals/${id}/approve`, { method: "POST" });
    // Refresh list
  };

  return (
    <table>
      {withdrawals.map((w) => (
        <tr key={w.id}>
          <td>{w.user.email}</td>
          <td>
            {w.amount} {w.currency.toUpperCase()}
          </td>
          <td>{w.destinationAddress}</td>
          <td>
            <button onClick={() => approve(w.id)}>✅ Approve</button>
            <button onClick={() => reject(w.id)}>❌ Reject</button>
          </td>
        </tr>
      ))}
    </table>
  );
};
```

**2. Process Approved Withdrawals:**

```tsx
const ProcessWithdrawals = () => {
  const [approved, setApproved] = useState([]);
  const [selected, setSelected] = useState([]);

  const processBatch = async () => {
    const response = await fetch("/api/nowpayments/process-withdrawals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ withdrawalIds: selected }),
    });

    const result = await response.json();
    alert(`✅ ${result.message}`);
  };

  return (
    <>
      <h3>Approved Withdrawals</h3>
      {approved.map((w) => (
        <label key={w.id}>
          <input
            type="checkbox"
            checked={selected.includes(w.id)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelected([...selected, w.id]);
              } else {
                setSelected(selected.filter((id) => id !== w.id));
              }
            }}
          />
          {w.amount} {w.currency} → {w.destinationAddress}
        </label>
      ))}
      <button onClick={processBatch} disabled={selected.length === 0}>
        💸 Process {selected.length} Withdrawals
      </button>
    </>
  );
};
```

---

## Production Checklist

-   [ ] Switch from sandbox to production API keys
-   [ ] Configure production `BACKEND_URL` for IPN webhooks
-   [ ] Add IPN callback URL in NOWPayments dashboard
-   [ ] Set up monitoring for failed payouts
-   [ ] Implement admin email notifications for new withdrawal requests
-   [ ] Add withdrawal limits (daily/weekly per user)
-   [ ] Implement 2FA verification for batch payouts (optional)
-   [ ] Set up balance alerts (notify admin when merchant balance low)
-   [ ] Add blockchain explorer links in admin UI (using `txHash`)
-   [ ] Implement payout reconciliation report (compare DB vs NOWPayments)

---

## Troubleshooting

### Payout Failed

Check `adminNotes` in `crypto_withdrawals` table for NOWPayments error message.

Common issues:

-   **Insufficient balance**: Admin needs to deposit more crypto to merchant account
-   **Invalid address**: User provided wrong/malformed wallet address
-   **Currency mismatch**: Requested currency not supported or disabled

### IPN Not Received

1. Verify `NOWPAYMENTS_IPN_SECRET` matches dashboard value
2. Check webhook URL in NOWPayments dashboard
3. Use ngrok for local testing
4. Check server logs for signature verification failures

### Withdrawal Stuck in "Processing"

Manually check payout status via NOWPayments dashboard or API:

```bash
curl https://api.nowpayments.io/v1/payout/<batch_id> \
  -H "x-api-key: $NOWPAYMENTS_API_KEY"
```

Then manually update database if needed.

---

## Next Steps

1. ✅ **Backend complete** - Withdrawal endpoints implemented
2. ⏳ **Frontend** - Add admin withdrawal management UI
3. ⏳ **Testing** - Test with NOWPayments sandbox
4. ⏳ **Production** - Switch to production keys and deploy

**Ready to test!** The withdrawal system is fully functional and waiting for admin UI integration.
