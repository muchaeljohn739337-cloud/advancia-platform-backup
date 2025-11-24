# Security Whitelist Implementation Guide

## Overview

This guide documents the IP and wallet address whitelisting security features implemented for Advancia Pay Ledger. These features provide an additional layer of security for cryptocurrency withdrawals by restricting withdrawals to whitelisted IPs and verified wallet addresses.

## Features Implemented

### 1. **IP Whitelisting**

-   Users can whitelist specific IP addresses
-   Withdrawals are blocked if initiated from non-whitelisted IPs (when whitelist is active)
-   Simple IP format validation
-   Add/remove IPs via API endpoints

### 2. **Wallet Address Whitelisting**

-   Users can whitelist cryptocurrency wallet addresses (BTC, ETH, USDT, etc.)
-   Addresses require verification before use
-   Prevents withdrawals to unknown/unverified addresses
-   Support for labels to identify addresses

### 3. **Enhanced Error Handling**

-   Sentry integration for production error tracking
-   Context-rich error logging (user ID, IP, path, method)
-   Sensitive data sanitization in logs
-   Different error responses for development vs production

### 4. **Prometheus Metrics**

-   HTTP request duration and count tracking
-   Active users monitoring
-   Withdrawal tracking by currency and status
-   Security alerts counter
-   Database query performance monitoring
-   WebSocket connection tracking

## Database Schema Changes

### User Model

```prisma
model User {
  // ...existing fields...
  whitelistedIPs            String[]
  whitelisted_addresses     WhitelistedAddress[]
}
```

### New WhitelistedAddress Model

```prisma
model WhitelistedAddress {
  id        String   @id @default(cuid())
  userId    String
  address   String
  currency  String   // BTC, ETH, USDT, etc.
  label     String?  // Optional label
  verified  Boolean  @default(false)
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, address, currency])
  @@index([userId])
  @@index([verified])
}
```

## API Endpoints

### IP Whitelist Endpoints

#### Get Whitelisted IPs

```
GET /api/security/whitelist/ips
Authorization: Bearer <token>

Response:
{
  "success": true,
  "ips": ["192.168.1.100", "10.0.0.1"]
}
```

#### Add IP to Whitelist

```
POST /api/security/whitelist/ip
Authorization: Bearer <token>
Content-Type: application/json

{
  "ip": "192.168.1.100",
  "label": "Home"
}

Response:
{
  "success": true,
  "message": "IP 192.168.1.100 added to whitelist",
  "ips": ["192.168.1.100"]
}
```

#### Remove IP from Whitelist

```
DELETE /api/security/whitelist/ip/:ip
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "IP 192.168.1.100 removed from whitelist",
  "ips": []
}
```

### Wallet Address Whitelist Endpoints

#### Get Whitelisted Addresses

```
GET /api/security/whitelist/addresses
Authorization: Bearer <token>

Response:
{
  "success": true,
  "addresses": [
    {
      "id": "ck123456",
      "userId": "user123",
      "address": "bc1q...",
      "currency": "BTC",
      "label": "My BTC Wallet",
      "verified": true,
      "createdAt": "2025-11-22T08:00:00.000Z"
    }
  ]
}
```

#### Add Wallet Address to Whitelist

```
POST /api/security/whitelist/address
Authorization: Bearer <token>
Content-Type: application/json

{
  "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  "currency": "BTC",
  "label": "My BTC Wallet"
}

Response:
{
  "success": true,
  "message": "Address added. Verification required before use.",
  "address": {
    "id": "ck123456",
    "userId": "user123",
    "address": "bc1q...",
    "currency": "BTC",
    "label": "My BTC Wallet",
    "verified": false,
    "createdAt": "2025-11-22T08:00:00.000Z"
  }
}
```

#### Verify Whitelisted Address

```
POST /api/security/whitelist/address/:id/verify
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Address verified successfully",
  "address": {
    "id": "ck123456",
    "verified": true,
    ...
  }
}
```

#### Remove Address from Whitelist

```
DELETE /api/security/whitelist/address/:id
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Address removed from whitelist"
}
```

### Metrics Endpoints

#### Prometheus Metrics (Text Format)

```
GET /api/metrics
Authorization: Bearer <admin_token>

Response: Prometheus text format metrics
```

#### Metrics JSON

```
GET /api/metrics/json
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "metrics": [...]
}
```

#### Health Check

```
GET /api/metrics/health

Response:
{
  "status": "healthy",
  "timestamp": "2025-11-22T08:00:00.000Z",
  "uptime": 12345,
  "memory": {...}
}
```

## Security Flow

### Withdrawal Request Flow

1. **User initiates withdrawal** via `POST /api/withdrawals/request`

2. **IP Whitelist Check**
   -   Extract client IP from request headers
   -   If user has whitelisted IPs, verify current IP is in the list
   -   If not whitelisted, reject with 403 and send security alert

3. **Address Whitelist Check** (crypto only)
   -   Check if withdrawal address exists in user's whitelist
   -   Verify address is marked as verified
   -   If not whitelisted or not verified, reject with 403

4. **Balance Check**
   -   Verify user has sufficient balance

5. **Create Withdrawal Request**
   -   Deduct balance (locked until processed)
   -   Create database records
   -   Notify admins via Socket.IO

## Testing

### Running Tests

```bash
cd backend
npm test -- security.test.ts
```

### Test Coverage

The test suite covers:

-   ✅ IP whitelist management (add, get, remove)
-   ✅ IP format validation
-   ✅ Duplicate IP prevention
-   ✅ Wallet address whitelist management
-   ✅ Address verification flow
-   ✅ Duplicate address prevention
-   ✅ Withdrawal blocking from non-whitelisted IPs
-   ✅ Withdrawal blocking to non-whitelisted addresses
-   ✅ Successful withdrawal after whitelisting

## Configuration

### Environment Variables

No additional environment variables needed for basic functionality. However, for production:

```env
# Sentry (for error tracking)
SENTRY_DSN=your_sentry_dsn_here

# Node environment
NODE_ENV=production
```

## Integration Steps

### 1. Register Metrics Route (index.ts)

Add to your route registration section:

```typescript
import metricsRouter from "./routes/metrics";
import { metricsMiddleware } from "./utils/metrics";

// Add metrics middleware early in the stack
app.use(metricsMiddleware);

// Register metrics route
app.use("/api/metrics", metricsRouter);
```

### 2. Track Security Events

In your security-critical code:

```typescript
import { trackSecurityAlert } from "../utils/metrics";

// When blocking unauthorized access
trackSecurityAlert("ip_whitelist_block", "high");

// When detecting suspicious activity
trackSecurityAlert("multiple_failed_logins", "medium");
```

### 3. Track Withdrawals

In your withdrawal processing code:

```typescript
import { trackWithdrawal } from "../utils/metrics";

// When withdrawal is created
trackWithdrawal("BTC", "pending", 0.001);

// When withdrawal completes
trackWithdrawal("BTC", "completed", 0.001);

// When withdrawal fails
trackWithdrawal("BTC", "failed", 0.001);
```

## Frontend Integration

### Example: Whitelist IP

```typescript
async function whitelistIP(ip: string, label?: string) {
  const response = await fetch("/api/security/whitelist/ip", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ip, label }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error);
  }

  return data;
}
```

### Example: Whitelist Address

```typescript
async function whitelistAddress(address: string, currency: string, label?: string) {
  const response = await fetch("/api/security/whitelist/address", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ address, currency, label }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error);
  }

  return data;
}
```

### Example: Verify Address

```typescript
async function verifyAddress(addressId: string) {
  const response = await fetch(`/api/security/whitelist/address/${addressId}/verify`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error);
  }

  return data;
}
```

## Monitoring with Grafana

### Setting Up Prometheus

1. Install Prometheus
2. Configure scrape target:

```yaml
scrape_configs:
  - job_name: "advancia-backend"
    static_configs:
      - targets: ["localhost:4000"]
    metrics_path: "/api/metrics"
    bearer_token: "your_admin_token"
```

### Grafana Dashboard Queries

**HTTP Request Duration (P95):**

```promql
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, method, route))
```

**Request Rate:**

```promql
rate(http_requests_total[5m])
```

**Active Users:**

```promql
active_users_total
```

**Withdrawal Rate by Currency:**

```promql
rate(withdrawal_total[5m])
```

**Security Alerts by Type:**

```promql
rate(security_alerts_total[5m])
```

**Error Rate:**

```promql
rate(errors_total[5m])
```

## Security Best Practices

### 1. IP Whitelisting

-   ✅ Encourage users to whitelist home/office IPs
-   ✅ Warn users about public WiFi/VPN risks
-   ✅ Allow emergency bypass for locked accounts (via support)
-   ✅ Log all IP whitelist changes for audit

### 2. Address Whitelisting

-   ✅ Require email verification before marking address as verified
-   ✅ Allow 24-48 hour cooling period for new addresses
-   ✅ Limit number of addresses per user (e.g., 10 per currency)
-   ✅ Provide address verification history

### 3. Monitoring

-   ✅ Set up alerts for high security event rates
-   ✅ Monitor withdrawal patterns for anomalies
-   ✅ Track failed authentication attempts
-   ✅ Review Sentry errors daily

## Troubleshooting

### Issue: IP Whitelist Blocking Legitimate User

**Solution:**

1. Verify user's current IP via `/api/security/ip-info`
2. Have user add current IP via dashboard
3. If locked out, admin can disable whitelist temporarily

### Issue: Address Already Whitelisted Error

**Solution:**
The address already exists in the whitelist. Check with:

```
GET /api/security/whitelist/addresses
```

### Issue: Metrics Endpoint Returns 401

**Solution:**
Metrics endpoints require admin authentication. Ensure you're using an admin token:

```
Authorization: Bearer <admin_token>
```

## Migration Checklist

-   [x] Database schema updated (User.whitelistedIPs, WhitelistedAddress model)
-   [x] Prisma migration applied
-   [x] Security routes enhanced
-   [x] Withdrawal routes updated with security checks
-   [x] Error handler enhanced with Sentry
-   [x] Tests created for whitelist functionality
-   [x] Metrics utility created
-   [x] Metrics route created
-   [ ] Routes registered in index.ts
-   [ ] Frontend UI components created
-   [ ] Email verification for addresses implemented
-   [ ] Monitoring dashboard configured
-   [ ] Production deployment

## Next Steps

### Week 1 (High Priority)

-   [x] Add WhitelistedAddress model to Prisma schema
-   [x] Create security routes for IP/address whitelisting
-   [x] Update crypto withdrawal route with security checks
-   [ ] Add email verification for whitelisted addresses
-   [ ] Test withdrawal flow with whitelisted/non-whitelisted IPs

### Week 2-3 (Medium Priority)

-   [x] Enhance error handler with context logging
-   [x] Add Sentry integration for production errors
-   [x] Write security tests (IP whitelist, address whitelist)
-   [ ] Write payment flow tests
-   [ ] Add integration tests for critical paths

### Week 4 (Low Priority)

-   [x] Add Prometheus metrics endpoints
-   [ ] Set up Grafana dashboard for monitoring
-   [ ] Optimize database queries with indexes
-   [ ] Add query performance logging
-   [ ] Document new security features in README

### Ongoing

-   [ ] Monitor error rates in Sentry
-   [ ] Review security alerts weekly
-   [ ] Update dependencies monthly
-   [ ] Review and rotate secrets quarterly

## Support

For questions or issues:

-   Check error logs in Sentry
-   Review test coverage in `__tests__/security.test.ts`
-   Consult API documentation in this file
-   Contact development team

---

**Document Version:** 1.0  
**Last Updated:** November 22, 2025  
**Author:** GitHub Copilot
