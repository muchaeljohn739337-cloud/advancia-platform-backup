# Proxy Integration Examples

This document shows how to integrate the ProxyClient into existing backend services for external API calls.

## Table of Contents

-   [Overview](#overview)
-   [Import ProxyClient](#import-proxyclient)
-   [Example 1: Cryptomus API](#example-1-cryptomus-api)
-   [Example 2: Telegram Service](#example-2-telegram-service)
-   [Example 3: Trustpilot Service](#example-3-trustpilot-service)
-   [Example 4: Fraud Detection Service](#example-4-fraud-detection-service)
-   [Testing Integration](#testing-integration)

## Overview

The ProxyClient provides a drop-in replacement for axios with automatic proxy support based on environment variables. All external API calls should route through ProxyClient for:

-   **Development**: Test API behavior with different IP addresses
-   **Testing**: Simulate requests from different geolocations
-   **Security**: Avoid IP blocking during security scans
-   **Production**: Route sensitive API calls through residential proxies

## Import ProxyClient

Add this import at the top of any service file making external API calls:

```typescript
import { getProxyClient } from "../utils/proxyClient";
```

## Example 1: Cryptomus API

**File**: `backend/src/routes/cryptomus.ts`

### Before (using fetch)

```typescript
// Make request to Cryptomus API
const response = await fetch(`${CRYPTOMUS_BASE_URL}/payment`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    userId: CRYPTOMUS_USER_ID,
    sign: signature,
  },
  body: JSON.stringify(paymentData),
});

const result: any = await response.json();
```

### After (using ProxyClient)

```typescript
import { getProxyClient } from "../utils/proxyClient";

// Get singleton ProxyClient instance (respects PROXY_ENABLED env var)
const proxyClient = getProxyClient();

// Make request through proxy (if enabled)
const result = await proxyClient.post<any>(`${CRYPTOMUS_BASE_URL}/payment`, paymentData, {
  headers: {
    "Content-Type": "application/json",
    userId: CRYPTOMUS_USER_ID,
    sign: signature,
  },
});

// Result is already parsed JSON
console.log("Payment invoice created:", result);
```

### Benefits

-   ✅ Automatic proxy routing if `PROXY_ENABLED=true`
-   ✅ No code changes needed to enable/disable proxy
-   ✅ Same API as axios (familiar interface)
-   ✅ Handles authentication automatically
-   ✅ Respects bypass rules (localhost, etc.)

## Example 2: Telegram Service

**File**: `backend/src/services/telegramService.ts`

### Before (using axios)

```typescript
import axios from "axios";

export async function sendTelegramMessage(chatId: string, text: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const resp = await axios.post(url, {
    chat_id: chatId,
    text: text,
    parse_mode: "Markdown",
  });
  return resp.data;
}
```

### After (using ProxyClient)

```typescript
import { getProxyClient } from "../utils/proxyClient";

const proxyClient = getProxyClient();

export async function sendTelegramMessage(chatId: string, text: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  // Use ProxyClient instead of axios
  const data = await proxyClient.post<any>(url, {
    chat_id: chatId,
    text: text,
    parse_mode: "Markdown",
  });

  return data;
}
```

### Multiple Functions

Update all Telegram API calls in the same file:

```typescript
import { getProxyClient } from "../utils/proxyClient";

const proxyClient = getProxyClient();

export async function getMe() {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`;
  return await proxyClient.get<any>(url);
}

export async function setWebhook(webhookUrl: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`;
  return await proxyClient.post<any>(url, {
    url: webhookUrl,
    drop_pending_updates: true,
  });
}

export async function sendPhoto(chatId: string, photoUrl: string, caption?: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
  return await proxyClient.post<any>(url, {
    chat_id: chatId,
    photo: photoUrl,
    caption: caption,
  });
}
```

## Example 3: Trustpilot Service

**File**: `backend/src/services/trustpilotInvitationService.ts`

### Before (using axios)

```typescript
import axios from "axios";

// Send invitation to Trustpilot
await axios.post(
  "https://invitations-api.trustpilot.com/v1/private/business-units/YOUR_BUSINESS_UNIT_ID/invitations",
  {
    referenceId: user.id,
    email: user.email,
    name: user.username || user.email.split("@")[0],
    locale: "en-US",
    redirectUri: "https://advanciapayledger.com/reviews",
  },
  {
    headers: {
      Authorization: `ApiKey ${TRUSTPILOT_API_KEY}`,
      "Content-Type": "application/json",
    },
  },
);
```

### After (using ProxyClient)

```typescript
import { getProxyClient } from "../utils/proxyClient";

const proxyClient = getProxyClient();

// Send invitation through proxy (if enabled)
const result = await proxyClient.post<any>(
  "https://invitations-api.trustpilot.com/v1/private/business-units/YOUR_BUSINESS_UNIT_ID/invitations",
  {
    referenceId: user.id,
    email: user.email,
    name: user.username || user.email.split("@")[0],
    locale: "en-US",
    redirectUri: "https://advanciapayledger.com/reviews",
  },
  {
    headers: {
      Authorization: `ApiKey ${TRUSTPILOT_API_KEY}`,
      "Content-Type": "application/json",
    },
  },
);

console.log("Trustpilot invitation sent:", result);
```

## Example 4: Fraud Detection Service

**File**: `backend/src/services/fraudDetectionService.ts`

### Before (using axios)

```typescript
import axios from "axios";

// Check IP geolocation for fraud detection
const response = await axios.get(`https://ipapi.co/${ipAddress}/json/`);
const geoData = response.data;

// Analyze risk based on location
const isHighRisk = geoData.country_code in HIGH_RISK_COUNTRIES;
```

### After (using ProxyClient)

```typescript
import { getProxyClient } from "../utils/proxyClient";

const proxyClient = getProxyClient();

// Check IP geolocation through proxy (if enabled)
const geoData = await proxyClient.get<any>(`https://ipapi.co/${ipAddress}/json/`);

// Analyze risk based on location
const isHighRisk = geoData.country_code in HIGH_RISK_COUNTRIES;

// Bonus: Get proxy's own geolocation for testing
if (process.env.PROXY_ENABLED === "true") {
  const proxyGeo = await proxyClient.getGeolocation();
  console.log("Request coming from:", proxyGeo);
}
```

## Testing Integration

### 1. Test with Proxy Disabled (Direct Connection)

```bash
# In backend/.env
PROXY_ENABLED=false
```

```typescript
const proxyClient = getProxyClient();
const ip = await proxyClient.getPublicIP();
console.log("Direct IP:", ip); // Your real IP
```

### 2. Test with Proxy Enabled (Through SOCKS5)

```bash
# In backend/.env
PROXY_ENABLED=true
PROXY_TYPE=socks5
PROXY_HOST=127.0.0.1
PROXY_PORT=1080
```

```typescript
const proxyClient = getProxyClient();
const ip = await proxyClient.getPublicIP();
console.log("Proxy IP:", ip); // Proxy IP (different from direct)

const geo = await proxyClient.getGeolocation();
console.log("Proxy location:", geo); // Proxy geolocation
```

### 3. Test API Calls

```typescript
import { getProxyClient } from "./utils/proxyClient";

async function testIntegration() {
  const proxyClient = getProxyClient();

  console.log("Testing proxy integration...");

  // Test 1: Public IP check
  const ip = await proxyClient.getPublicIP();
  console.log("✅ Public IP:", ip);

  // Test 2: Geolocation
  const geo = await proxyClient.getGeolocation();
  console.log("✅ Geolocation:", geo);

  // Test 3: External API call
  const result = await proxyClient.get<any>("https://api.github.com/users/github");
  console.log("✅ GitHub API:", result.login);

  // Test 4: Connection test
  const isConnected = await proxyClient.testConnection();
  console.log("✅ Connection test:", isConnected ? "PASSED" : "FAILED");

  console.log("All tests passed!");
}

testIntegration();
```

### 4. Performance Comparison

```typescript
async function comparePerformance() {
  const axios = require("axios");
  const { getProxyClient } = require("./utils/proxyClient");

  const url = "https://api.ipify.org?format=json";

  // Direct connection (axios)
  const start1 = Date.now();
  await axios.get(url);
  const directTime = Date.now() - start1;

  // Through proxy (ProxyClient)
  const proxyClient = getProxyClient();
  const start2 = Date.now();
  await proxyClient.get(url);
  const proxyTime = Date.now() - start2;

  console.log("Performance Comparison:");
  console.log(`  Direct: ${directTime}ms`);
  console.log(`  Proxy: ${proxyTime}ms`);
  console.log(`  Overhead: ${proxyTime - directTime}ms`);
}
```

## Migration Checklist

-   [ ] Identify all external API calls in backend
-   [ ] Replace `axios` imports with `getProxyClient()`
-   [ ] Replace `fetch()` calls with `proxyClient.get/post/put/delete()`
-   [ ] Test with `PROXY_ENABLED=false` (should work as before)
-   [ ] Test with `PROXY_ENABLED=true` (should route through proxy)
-   [ ] Verify IP addresses differ between direct and proxy
-   [ ] Check API rate limits (some APIs may rate limit by IP)
-   [ ] Update error handling (ProxyClient throws on errors)
-   [ ] Add logging for proxy usage in production
-   [ ] Document proxy usage in API documentation

## Files to Update

Based on grep search, these files make external API calls:

### High Priority (External APIs)

1. ✅ `backend/src/routes/cryptomus.ts` - Cryptomus payment API
2. ⏳ `backend/src/routes/payments.ts` - Cryptomus payment API
3. ⏳ `backend/src/services/telegramService.ts` - Telegram Bot API
4. ⏳ `backend/src/services/trustpilotInvitationService.ts` - Trustpilot API
5. ⏳ `backend/src/services/fraudDetectionService.ts` - IP geolocation API
6. ⏳ `backend/src/jobs/trustpilotCollector.ts` - Trustpilot data collection

### Low Priority (Internal URLs)

-   `backend/src/routes/auth.ts` - Internal reset links (no proxy needed)
-   `backend/src/routes/email.ts` - Internal verification links (no proxy needed)
-   `backend/src/routes/emailSignup.ts` - Internal magic links (no proxy needed)
-   `backend/src/routes/gamification.ts` - Internal referral links (no proxy needed)

## Environment Variables Reference

```bash
# Enable/disable proxy
PROXY_ENABLED=true

# Proxy type (socks4, socks5, http, https)
PROXY_TYPE=socks5

# Proxy server
PROXY_HOST=127.0.0.1
PROXY_PORT=1080

# Authentication (if required)
PROXY_USERNAME=
PROXY_PASSWORD=

# Bypass rules (comma-separated domains)
PROXY_BYPASS=localhost,127.0.0.1,.local
```

## Troubleshooting

### Issue: "Cannot connect to proxy"

**Solution**: Verify Docker container is running:

```bash
docker ps | grep socks5-proxy
# If not running: .\scripts\setup-proxy.ps1 -Method docker
```

### Issue: "Proxy authentication failed"

**Solution**: Check credentials in .env:

```bash
PROXY_USERNAME=your_username
PROXY_PASSWORD=your_password
```

### Issue: "Request timeout through proxy"

**Solution**: Increase axios timeout:

```typescript
const result = await proxyClient.get<any>(url, {
  timeout: 30000, // 30 seconds
});
```

### Issue: "IP address not changing"

**Solution**: Verify proxy is enabled and working:

```bash
.\scripts\test-proxy.ps1
# Should show different IPs for direct vs proxy
```

### Issue: "Some APIs blocked by proxy"

**Solution**: Add to bypass list:

```bash
PROXY_BYPASS=localhost,127.0.0.1,.local,api.example.com
```

## Next Steps

1. **Install Dependencies**: Already done ✅
2. **Configure Environment**: Already done ✅
3. **Start Proxy**: Already done ✅
4. **Update Services**: See examples above
5. **Test Integration**: Use test scripts
6. **Deploy**: Update production .env with residential proxy credentials

## Production Considerations

### When to Enable Proxy in Production

-   ✅ **API Rate Limiting**: Rotate IPs to avoid rate limits
-   ✅ **Geo-Restrictions**: Access APIs from specific regions
-   ✅ **Security Testing**: Penetration testing with IP rotation
-   ✅ **Scraping Protection**: Avoid IP blocking during data collection
-   ✅ **Privacy**: Hide backend server IP from external services

### When NOT to Use Proxy

-   ❌ **Internal Services**: Backend <-> Database (use PROXY_BYPASS)
-   ❌ **Payment Webhooks**: Stripe/Cryptomus webhooks need direct access
-   ❌ **Real-time Communication**: WebSockets (Socket.IO) should be direct
-   ❌ **File Uploads**: Large files to S3/storage (bypass recommended)
-   ❌ **Monitoring**: Health checks, metrics (direct connection preferred)

### Recommended Production Setup

```bash
# Production .env (with residential proxy)
PROXY_ENABLED=true
PROXY_TYPE=http
PROXY_HOST=gate.smartproxy.com
PROXY_PORT=7000
PROXY_USERNAME=your_smartproxy_username
PROXY_PASSWORD=your_smartproxy_password
PROXY_BYPASS=localhost,127.0.0.1,.local,stripe.com,cryptomus.com

# Only route specific services through proxy:
# - Trustpilot API (avoid rate limiting)
# - Fraud detection (get accurate geolocation)
# - Web scraping (avoid IP blocking)
```

## Resources

-   **Proxy Configuration Guide**: See `PROXY_CONFIGURATION_GUIDE.md`
-   **Quick Start**: See `PROXY_QUICK_START.md`
-   **ProxyClient Source**: See `backend/src/utils/proxyClient.ts`
-   **Setup Script**: Run `.\scripts\setup-proxy.ps1`
-   **Test Script**: Run `.\scripts\test-proxy.ps1`

## Support

For issues or questions:

1. Check troubleshooting section above
2. Review proxy configuration guide
3. Test with `.\scripts\test-proxy.ps1`
4. Check Docker container logs: `docker logs socks5-proxy`
5. Verify environment variables: `cat backend/.env | grep PROXY`
