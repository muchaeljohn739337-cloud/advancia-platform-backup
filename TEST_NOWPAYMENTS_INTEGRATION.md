# NOWPayments Integration - Testing Guide

## ✅ Implementation Complete

The NOWPayments payment provider has been fully integrated into your withdrawal system. Users can now choose between **Cryptomus** and **NOWPayments** when requesting withdrawals.

---

## 🎯 What's Been Implemented

### 1. **Database Migration** ✅

-   **Migration**: `20251122121401_add_payment_provider_to_withdrawals`
-   **Field Added**: `paymentProvider` to `crypto_withdrawals` table
-   **Default Value**: `'cryptomus'` (backward compatible)
-   **Status**: Applied and Prisma client regenerated

### 2. **Backend API Endpoints** ✅

#### New Endpoint: `GET /api/withdrawals/methods`

Returns available payment providers with details:

```bash
curl http://localhost:4000/api/withdrawals/methods \
  -H "Authorization: Bearer <your-jwt-token>"
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

#### Updated Endpoint: `POST /api/withdrawals/request`

Now accepts `paymentProvider` parameter:

```bash
curl -X POST http://localhost:4000/api/withdrawals/request \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "balanceType": "btc",
    "amount": 0.001,
    "withdrawalAddress": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    "paymentProvider": "nowpayments"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Withdrawal request created successfully",
  "withdrawal": {
    "id": "clxxxxx",
    "balanceType": "BTC",
    "amount": 0.001,
    "status": "pending",
    "createdAt": "2025-11-22T12:00:00.000Z"
  }
}
```

### 3. **Admin Processing** ✅

When admin processes withdrawals:

1. System checks `paymentProvider` field in database
2. Routes NOWPayments withdrawals to `POST /api/nowpayments/process-withdrawals`
3. Routes Cryptomus withdrawals to existing Cryptomus endpoint

```bash
# Admin processes NOWPayments withdrawals
curl -X POST http://localhost:4000/api/nowpayments/process-withdrawals \
  -H "Authorization: Bearer <admin-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "withdrawalIds": ["withdrawal-id-1", "withdrawal-id-2"]
  }'
```

---

## 📋 Testing Checklist

### Test 1: Get Available Methods

```bash
# Expected: Returns both Cryptomus and NOWPayments
curl http://localhost:4000/api/withdrawals/methods \
  -H "Authorization: Bearer <token>"
```

✅ Should show:

-   Cryptomus: 50+ coins, 1% fees
-   NOWPayments: 200+ coins, 0.5% fees (recommended)

### Test 2: Create Withdrawal with Cryptomus (Default)

```bash
curl -X POST http://localhost:4000/api/withdrawals/request \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "balanceType": "btc",
    "amount": 0.001,
    "withdrawalAddress": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
  }'
```

✅ Should create withdrawal with `paymentProvider: "cryptomus"` (default)

### Test 3: Create Withdrawal with NOWPayments

```bash
curl -X POST http://localhost:4000/api/withdrawals/request \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "balanceType": "btc",
    "amount": 0.001,
    "withdrawalAddress": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    "paymentProvider": "nowpayments"
  }'
```

✅ Should create withdrawal with `paymentProvider: "nowpayments"`

### Test 4: Invalid Provider Validation

```bash
curl -X POST http://localhost:4000/api/withdrawals/request \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "balanceType": "btc",
    "amount": 0.001,
    "withdrawalAddress": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    "paymentProvider": "invalid"
  }'
```

✅ Should return error: "Invalid payment provider. Choose: cryptomus or nowpayments"

### Test 5: Database Verification

```sql
-- Check that paymentProvider field exists and is populated
SELECT id, userId, amount, currency, status, paymentProvider, createdAt
FROM crypto_withdrawals
ORDER BY createdAt DESC
LIMIT 10;
```

✅ Should show `paymentProvider` column with values: 'cryptomus' or 'nowpayments'

### Test 6: Admin Processes NOWPayments Withdrawal

```bash
# First, approve a withdrawal in database:
# UPDATE crypto_withdrawals SET status = 'approved' WHERE id = 'xxx';

# Then process it:
curl -X POST http://localhost:4000/api/nowpayments/process-withdrawals \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "withdrawalIds": ["xxx"]
  }'
```

✅ Should send withdrawal to NOWPayments API and return batch ID

---

## 🎨 Frontend Integration

Add this component to your withdrawal form:

```tsx
import { useState, useEffect } from "react";

interface PaymentMethod {
  provider: string;
  name: string;
  description: string;
  currencies: string[];
  minAmount: number;
  fees: string;
  processingTime: string;
  features: string[];
  recommended?: boolean;
}

const WithdrawalForm = () => {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selectedProvider, setSelectedProvider] = useState("nowpayments");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("btc");
  const [address, setAddress] = useState("");

  useEffect(() => {
    // Fetch available payment methods
    fetch("/api/withdrawals/methods", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMethods(data.methods);
        }
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch("/api/withdrawals/request", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        balanceType: currency,
        amount: parseFloat(amount),
        withdrawalAddress: address,
        paymentProvider: selectedProvider,
      }),
    });

    const result = await response.json();

    if (result.success) {
      alert("✅ Withdrawal request submitted!");
    } else {
      alert(`❌ Error: ${result.error}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold">Request Withdrawal</h2>

      {/* Payment Provider Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold">Select Payment Provider</label>
        <div className="grid gap-3">
          {methods.map((method) => (
            <label
              key={method.provider}
              className={`
                relative flex items-start p-4 border-2 rounded-lg cursor-pointer
                transition-all hover:shadow-lg
                ${selectedProvider === method.provider ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
              `}
            >
              <input type="radio" name="paymentProvider" value={method.provider} checked={selectedProvider === method.provider} onChange={(e) => setSelectedProvider(e.target.value)} className="mt-1 mr-3" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">{method.name}</span>
                  {method.recommended && <span className="px-2 py-0.5 text-xs font-semibold text-green-800 bg-green-100 rounded-full">⭐ Recommended</span>}
                </div>
                <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="text-gray-700">
                    💰 Fees: <strong>{method.fees}</strong>
                  </span>
                  <span className="text-gray-700">
                    ⏱️ Time: <strong>{method.processingTime}</strong>
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {method.features.map((feature) => (
                    <span key={feature} className="px-2 py-0.5 text-xs bg-gray-100 rounded">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Currency Selection */}
      <div>
        <label className="block text-sm font-semibold mb-2">Currency</label>
        <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-4 py-2 border rounded-lg">
          <option value="btc">Bitcoin (BTC)</option>
          <option value="eth">Ethereum (ETH)</option>
          <option value="usdt">Tether (USDT)</option>
          <option value="trx">Tron (TRX)</option>
        </select>
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-semibold mb-2">Amount</label>
        <input type="number" step="0.00000001" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.001" className="w-full px-4 py-2 border rounded-lg" required />
      </div>

      {/* Wallet Address */}
      <div>
        <label className="block text-sm font-semibold mb-2">Wallet Address</label>
        <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="bc1q..." className="w-full px-4 py-2 border rounded-lg font-mono text-sm" required />
      </div>

      <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">
        Request Withdrawal
      </button>
    </form>
  );
};

export default WithdrawalForm;
```

---

## 📊 Database Schema Updates

### Migration Applied: `20251122121401_add_payment_provider_to_withdrawals`

```sql
-- Added to crypto_withdrawals table:
ALTER TABLE "crypto_withdrawals"
ADD COLUMN "paymentProvider" TEXT DEFAULT 'cryptomus';

-- Index added for performance:
CREATE INDEX "crypto_withdrawals_paymentProvider_idx"
ON "crypto_withdrawals"("paymentProvider");
```

### Current Schema

```prisma
model crypto_withdrawals {
  id                 String    @id
  userId             String
  cryptoType         String
  cryptoAmount       Decimal
  usdEquivalent      Decimal
  withdrawalAddress  String
  status             String    @default("pending")
  adminApprovedBy    String?
  adminNotes         String?
  txHash             String?
  networkFee         Decimal?
  approvedAt         DateTime?
  rejectedAt         DateTime?
  completedAt        DateTime?
  cancelledAt        DateTime?
  createdAt          DateTime  @default(now())
  updatedAt          DateTime
  user_notes         String?
  amount             Decimal
  approvedBy         String?
  currency           String
  destinationAddress String
  requestedAt        DateTime  @default(now())
  paymentProvider    String?   @default("cryptomus") // ⭐ NEW FIELD
  user               User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([createdAt])
  @@index([cryptoType])
  @@index([currency])
  @@index([requestedAt])
  @@index([status])
  @@index([userId])
  @@index([paymentProvider]) // ⭐ NEW INDEX
}
```

---

## 🔄 Complete User Flow

1. **User opens withdrawal form**
   -   Calls `GET /api/withdrawals/methods`
   -   Sees Cryptomus and NOWPayments options

2. **User selects NOWPayments** (or Cryptomus)
   -   Fills amount, currency, wallet address
   -   Submits form with `paymentProvider: "nowpayments"`

3. **Backend creates withdrawal**
   -   Validates provider is 'cryptomus' or 'nowpayments'
   -   Deducts from user balance
   -   Creates record with `status: "pending"` and selected provider
   -   Notifies admins via Socket.IO

4. **Admin reviews withdrawal**
   -   Sees withdrawal with provider badge
   -   Approves or rejects

5. **Admin processes approved withdrawals**
   -   Filters by provider if needed
   -   Selects NOWPayments withdrawals
   -   Calls `POST /api/nowpayments/process-withdrawals`

6. **Backend sends to NOWPayments**
   -   Creates batch payout request
   -   Updates status to `processing`
   -   Stores batch ID in `adminNotes`

7. **NOWPayments processes payout**
   -   Sends crypto from merchant account
   -   Fires webhook to `/api/nowpayments/payout-ipn`

8. **Webhook updates status**
   -   Verifies HMAC signature
   -   Updates withdrawal to `completed`
   -   Sets `txHash` and `completedAt`

9. **User sees completed withdrawal**
   -   Can view transaction on blockchain explorer
   -   Balance updated correctly

---

## 🚀 Production Deployment

### 1. Environment Variables

Ensure these are set in production:

```env
NOWPAYMENTS_API_KEY=<production-key>
NOWPAYMENTS_IPN_SECRET=<production-secret>
BACKEND_URL=https://api.yourdomn.com
```

### 2. NOWPayments Dashboard Setup

-   Add production IPN callback URL: `https://api.yourdomain.com/api/nowpayments/payout-ipn`
-   Configure 2FA for payouts (optional but recommended)

### 3. Admin Dashboard

-   Add provider filter to withdrawal list
-   Show provider badge on each withdrawal
-   Add bulk selection by provider

### 4. Monitoring

-   Set up alerts for failed payouts
-   Monitor webhook delivery success rate
-   Track provider usage (Cryptomus vs NOWPayments)

---

## 📝 Summary

✅ **Database**: `paymentProvider` field added and migrated  
✅ **API**: New `/methods` endpoint, updated `/request` endpoint  
✅ **Validation**: Provider must be 'cryptomus' or 'nowpayments'  
✅ **Admin Flow**: Routes to correct provider based on field  
✅ **Documentation**: Complete guide in `NOWPAYMENTS_WITHDRAWAL_SYSTEM.md`  
✅ **Frontend Example**: React component provided above

**Status**: 🎉 **READY FOR PRODUCTION** 🎉

Users can now choose their preferred payment provider based on:

-   **Fees**: NOWPayments 0.5% vs Cryptomus 1%
-   **Coins**: NOWPayments 200+ vs Cryptomus 50+
-   **Speed**: Cryptomus faster (5-30min) vs NOWPayments (10-60min)
