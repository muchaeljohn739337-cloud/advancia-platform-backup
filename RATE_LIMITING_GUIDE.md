# Advanced Rate Limiting Guide

## 🚦 Complete Rate Limiting System for Advancia Pay

Comprehensive guide to implementing and using different rate limiting algorithms for various use cases.

---

## 📋 Table of Contents

1. [Rate Limiting Algorithms](#rate-limiting-algorithms)
2. [When to Use Each](#when-to-use-each)
3. [Implementation Examples](#implementation-examples)
4. [Configuration Guide](#configuration-guide)
5. [Production Setup](#production-setup)

---

## 🎯 Rate Limiting Algorithms

### 1. Token Bucket (Bursty Traffic) 🪣

**Best for: API endpoints that can handle occasional bursts**

**How it works:**

-   Bucket holds tokens (e.g., 100 tokens)
-   Each request consumes 1 token
-   Tokens refill at steady rate (e.g., 10/second)
-   Allows bursts up to bucket capacity

**Characteristics:**

-   ✅ Allows traffic bursts
-   ✅ Good user experience
-   ✅ Flexible for varying loads
-   ❌ Can be exploited if not tuned properly

```typescript
// Token Bucket Example
import { TokenBucketRateLimiter } from "./middleware/rateLimiting";

// 100 token capacity, refill 10 tokens/second
const apiLimiter = new TokenBucketRateLimiter({
  bucketSize: 100, // Max burst size
  refillRate: 10, // Tokens per second
  windowMs: 60000, // Window for tracking
  max: 100, // Not used in token bucket but required
});

router.use("/api", apiLimiter.middleware());
```

**Real-world scenario:**

```
User uploads 50 files at once (burst) → ✅ Allowed (has 100 tokens)
Tokens left: 50
After 5 seconds → Refilled 50 tokens (10/sec * 5)
Tokens now: 100 (capped at bucket size)
User uploads 10 more → ✅ Allowed
```

---

### 2. Leaky Bucket (Fixed Flow) 💧

**Best for: Operations requiring steady, predictable flow**

**How it works:**

-   Requests enter bucket (queue)
-   Processed at fixed rate (leak rate)
-   Excess requests overflow and rejected
-   No bursts - strictly controlled

**Characteristics:**

-   ✅ Smooth, predictable flow
-   ✅ Protects downstream services
-   ✅ No traffic spikes
-   ❌ Rejects bursts
-   ❌ Less flexible

```typescript
// Leaky Bucket Example
import { LeakyBucketRateLimiter } from "./middleware/rateLimiting";

// Process 5 requests/second, queue up to 20
const paymentLimiter = new LeakyBucketRateLimiter({
  leakRate: 5, // Requests per second (fixed)
  bucketSize: 20, // Maximum queue size
  windowMs: 60000,
  max: 20,
});

router.use("/api/payments", paymentLimiter.middleware());
```

**Real-world scenario:**

```
Payment processing: Must handle exactly 5/second to avoid overload
10 requests arrive at once:
- 5 processed immediately
- 5 queued
- After 1 second, next 5 processed
- Arrival of 21st request → ❌ Rejected (queue full)
```

---

### 3. Fixed Window (Simple Counter) 📅

**Best for: Simple rate limiting, basic protection**

**How it works:**

-   Count requests in fixed time window
-   Reset counter when window expires
-   Fast and memory efficient

**Characteristics:**

-   ✅ Simple to implement
-   ✅ Memory efficient
-   ✅ Fast
-   ❌ Edge case: 2x burst at window boundaries

```typescript
// Fixed Window Example
import { FixedWindowRateLimiter } from "./middleware/rateLimiting";

// 100 requests per minute
const basicLimiter = new FixedWindowRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests
});

router.use("/api/public", basicLimiter.middleware());
```

**Edge case scenario:**

```
Window: 10:00:00 - 10:01:00
User sends 100 requests at 10:00:59 → ✅ Allowed
Window resets at 10:01:00
User sends 100 requests at 10:01:00 → ✅ Allowed
Result: 200 requests in 1 second! (edge case)
```

---

### 4. Sliding Window Log (Precise) 🎯

**Best for: Critical operations needing precise control**

**How it works:**

-   Store timestamp of every request
-   Count requests in sliding time window
-   No edge cases, perfectly accurate
-   More memory intensive

**Characteristics:**

-   ✅ Most accurate
-   ✅ No edge cases
-   ✅ Fair to all users
-   ❌ Higher memory usage
-   ❌ Slightly slower

```typescript
// Sliding Window Log Example
import { SlidingWindowLogRateLimiter } from "./middleware/rateLimiting";

// 50 requests per minute, precisely enforced
const criticalLimiter = new SlidingWindowLogRateLimiter({
  windowMs: 60 * 1000,
  max: 50,
});

router.use("/api/critical", criticalLimiter.middleware());
```

**Precise control:**

```
Requests at: 10:00:00, 10:00:15, 10:00:30, 10:00:45
At 10:01:00:
- Check last 60 seconds
- Count: 4 requests
- Allows 46 more

At 10:01:01:
- 10:00:00 request is now > 60 seconds old
- Removed from count
- Allows 47 more (perfectly sliding)
```

---

### 5. Adaptive Rate Limiter (Smart) 🧠

**Best for: Production systems with varying user trust levels**

**How it works:**

-   Adjusts limits based on user behavior
-   Higher limits for trusted users
-   Lower limits for suspicious activity
-   Considers system load

**Characteristics:**

-   ✅ Smart and flexible
-   ✅ Protects against abuse
-   ✅ Better UX for good users
-   ❌ More complex
-   ❌ Requires tuning

```typescript
// Adaptive Example
import { AdaptiveRateLimiter } from "./middleware/rateLimiting";

const adaptiveLimiter = new AdaptiveRateLimiter({
  windowMs: 60 * 1000,
  max: 100, // Base limit
  // Automatically adjusts per user
});

router.use("/api", adaptiveLimiter.middleware());
```

**Adaptive behavior:**

```
Anonymous user: 100 requests/min
Authenticated user: 150 requests/min (1.5x)
Trusted user (low error rate): 200 requests/min (2x)
Suspicious user (high errors): 50 requests/min (0.5x)
High system load (80%+): All limits * 0.7
```

---

## 🎯 When to Use Each Algorithm

### Use Token Bucket When

-   ✅ Handling API endpoints
-   ✅ File uploads/downloads
-   ✅ Batch operations
-   ✅ User-facing features
-   ✅ Need to allow occasional bursts

**Examples:**

```typescript
// File upload endpoint (allow burst of files)
router.post(
  "/api/upload",
  new TokenBucketRateLimiter({
    bucketSize: 50,
    refillRate: 5,
    windowMs: 60000,
    max: 50,
  }).middleware(),
);

// Dashboard API (bursty data fetching)
router.get(
  "/api/dashboard/*",
  new TokenBucketRateLimiter({
    bucketSize: 100,
    refillRate: 20,
    windowMs: 60000,
    max: 100,
  }).middleware(),
);
```

### Use Leaky Bucket When

-   ✅ Payment processing
-   ✅ Database writes
-   ✅ External API calls
-   ✅ Email sending
-   ✅ Need smooth, predictable flow

**Examples:**

```typescript
// Payment processing (must be steady)
router.post(
  "/api/payments/process",
  new LeakyBucketRateLimiter({
    leakRate: 5, // 5 payments/second max
    bucketSize: 20, // Queue up to 20
    windowMs: 60000,
    max: 20,
  }).middleware(),
);

// Email sending (avoid spam filters)
router.post(
  "/api/emails/send",
  new LeakyBucketRateLimiter({
    leakRate: 10, // 10 emails/second
    bucketSize: 50,
    windowMs: 60000,
    max: 50,
  }).middleware(),
);

// Database write operations
router.post(
  "/api/data/write",
  new LeakyBucketRateLimiter({
    leakRate: 20,
    bucketSize: 100,
    windowMs: 60000,
    max: 100,
  }).middleware(),
);
```

### Use Fixed Window When

-   ✅ Simple protection needed
-   ✅ Public endpoints
-   ✅ Memory constrained
-   ✅ Edge cases acceptable

**Examples:**

```typescript
// Public API endpoints
router.use(
  "/api/public",
  new FixedWindowRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
  }).middleware(),
);

// Health check endpoint
router.get(
  "/health",
  new FixedWindowRateLimiter({
    windowMs: 60 * 1000,
    max: 60, // 1 per second average
  }).middleware(),
);
```

### Use Sliding Window When

-   ✅ Critical operations
-   ✅ Security-sensitive endpoints
-   ✅ Need precise control
-   ✅ Fair enforcement required

**Examples:**

```typescript
// Password reset (prevent abuse)
router.post(
  "/api/auth/reset-password",
  new SlidingWindowLogRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Only 3 attempts per hour
  }).middleware(),
);

// Admin operations
router.use(
  "/api/admin",
  new SlidingWindowLogRateLimiter({
    windowMs: 60 * 1000,
    max: 50,
  }).middleware(),
);

// 2FA verification
router.post(
  "/api/auth/verify-2fa",
  new SlidingWindowLogRateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // 5 attempts
  }).middleware(),
);
```

### Use Adaptive When

-   ✅ Production systems
-   ✅ Multiple user types
-   ✅ Need DDoS protection
-   ✅ Want smart behavior

**Examples:**

```typescript
// Main API with adaptive limits
router.use(
  "/api",
  new AdaptiveRateLimiter({
    windowMs: 60 * 1000,
    max: 100, // Base limit, auto-adjusted
  }).middleware(),
);
```

---

## 🔧 Implementation Examples

### Complete Route Setup

```typescript
// backend/src/routes/transactions.ts
import { Router } from "express";
import { TokenBucketRateLimiter, LeakyBucketRateLimiter, SlidingWindowLogRateLimiter } from "../middleware/rateLimiting";

const router = Router();

// Read operations - Token Bucket (allow bursts)
const readLimiter = new TokenBucketRateLimiter({
  bucketSize: 100,
  refillRate: 20,
  windowMs: 60000,
  max: 100,
  keyGenerator: (req) => `${req.ip}:${req.user?.id || "anon"}`,
});

// Write operations - Leaky Bucket (steady flow)
const writeLimiter = new LeakyBucketRateLimiter({
  leakRate: 5,
  bucketSize: 20,
  windowMs: 60000,
  max: 20,
  keyGenerator: (req) => req.user?.id || req.ip,
});

// Sensitive operations - Sliding Window (precise)
const sensitiveLimiter = new SlidingWindowLogRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  keyGenerator: (req) => req.user?.id || req.ip,
});

// Apply limiters
router.get("/transactions", readLimiter.middleware(), getTransactions);
router.post("/transactions", writeLimiter.middleware(), createTransaction);
router.delete("/transactions/:id", sensitiveLimiter.middleware(), deleteTransaction);

export default router;
```

### Custom Key Generators

```typescript
// By IP address
const ipLimiter = new TokenBucketRateLimiter({
  bucketSize: 100,
  refillRate: 10,
  windowMs: 60000,
  max: 100,
  keyGenerator: (req) => req.ip || "unknown",
});

// By user ID (authenticated users)
const userLimiter = new TokenBucketRateLimiter({
  bucketSize: 200,
  refillRate: 20,
  windowMs: 60000,
  max: 200,
  keyGenerator: (req) => {
    const user = (req as any).user;
    return user ? `user:${user.id}` : `ip:${req.ip}`;
  },
});

// By API key
const apiKeyLimiter = new TokenBucketRateLimiter({
  bucketSize: 1000,
  refillRate: 100,
  windowMs: 60000,
  max: 1000,
  keyGenerator: (req) => {
    const apiKey = req.headers["x-api-key"];
    return apiKey ? `apikey:${apiKey}` : `ip:${req.ip}`;
  },
});

// By route + user (granular control)
const granularLimiter = new LeakyBucketRateLimiter({
  leakRate: 10,
  bucketSize: 50,
  windowMs: 60000,
  max: 50,
  keyGenerator: (req) => {
    const user = (req as any).user;
    const route = req.path;
    return `${user?.id || req.ip}:${route}`;
  },
});
```

### Skip Certain Requests

```typescript
// Skip rate limiting for admins
const publicLimiter = new TokenBucketRateLimiter({
  bucketSize: 50,
  refillRate: 5,
  windowMs: 60000,
  max: 50,
  skip: (req) => {
    const user = (req as any).user;
    return user?.role === "admin";
  },
});

// Skip for whitelisted IPs
const whitelist = ["127.0.0.1", "10.0.0.1"];
const whitelistLimiter = new FixedWindowRateLimiter({
  windowMs: 60000,
  max: 100,
  skip: (req) => whitelist.includes(req.ip || ""),
});

// Skip for internal services
const internalLimiter = new LeakyBucketRateLimiter({
  leakRate: 10,
  bucketSize: 50,
  windowMs: 60000,
  max: 50,
  skip: (req) => {
    const internalToken = req.headers["x-internal-token"];
    return internalToken === process.env.INTERNAL_TOKEN;
  },
});
```

### Custom Error Handlers

```typescript
// Custom rate limit response
const customLimiter = new TokenBucketRateLimiter({
  bucketSize: 100,
  refillRate: 10,
  windowMs: 60000,
  max: 100,
  handler: (req, res) => {
    // Send custom response
    res.status(429).json({
      error: "RATE_LIMIT_EXCEEDED",
      message: "You are sending requests too quickly",
      suggestion: "Please wait a moment before trying again",
      documentation: "https://docs.advancia.com/rate-limits",
    });
  },
});

// Log to monitoring service
const monitoredLimiter = new LeakyBucketRateLimiter({
  leakRate: 5,
  bucketSize: 20,
  windowMs: 60000,
  max: 20,
  handler: (req, res) => {
    // Log to monitoring
    logger.warn("Rate limit hit", {
      ip: req.ip,
      user: (req as any).user?.id,
      path: req.path,
      method: req.method,
    });

    // Send to analytics
    analytics.track("rate_limit_exceeded", {
      userId: (req as any).user?.id,
      ip: req.ip,
      endpoint: req.path,
    });

    res.status(429).json({
      error: "Too many requests",
    });
  },
});
```

---

## ⚙️ Configuration Guide

### Development vs Production

```typescript
// config/rateLimits.ts
const isDevelopment = process.env.NODE_ENV === "development";

export const rateLimitConfigs = {
  // API endpoints (Token Bucket)
  api: {
    bucketSize: isDevelopment ? 1000 : 100,
    refillRate: isDevelopment ? 100 : 10,
    windowMs: 60000,
    max: isDevelopment ? 1000 : 100,
  },

  // Payment processing (Leaky Bucket)
  payments: {
    leakRate: isDevelopment ? 50 : 5,
    bucketSize: isDevelopment ? 200 : 20,
    windowMs: 60000,
    max: isDevelopment ? 200 : 20,
  },

  // Authentication (Sliding Window)
  auth: {
    windowMs: isDevelopment ? 60000 : 60 * 60 * 1000,
    max: isDevelopment ? 100 : 5,
  },
};

// Usage
import { rateLimitConfigs } from "./config/rateLimits";

const apiLimiter = new TokenBucketRateLimiter(rateLimitConfigs.api);
const paymentLimiter = new LeakyBucketRateLimiter(rateLimitConfigs.payments);
const authLimiter = new SlidingWindowLogRateLimiter(rateLimitConfigs.auth);
```

### Environment-Based Configuration

```bash
# .env
RATE_LIMIT_API_BUCKET_SIZE=100
RATE_LIMIT_API_REFILL_RATE=10
RATE_LIMIT_PAYMENT_LEAK_RATE=5
RATE_LIMIT_AUTH_MAX_ATTEMPTS=5
```

```typescript
// Load from environment
const apiLimiter = new TokenBucketRateLimiter({
  bucketSize: parseInt(process.env.RATE_LIMIT_API_BUCKET_SIZE || "100"),
  refillRate: parseInt(process.env.RATE_LIMIT_API_REFILL_RATE || "10"),
  windowMs: 60000,
  max: parseInt(process.env.RATE_LIMIT_API_BUCKET_SIZE || "100"),
});
```

---

## 🚀 Production Setup

### Using Redis Store

```typescript
// backend/src/config/redis.ts
import Redis from "ioredis";
import { RedisStore } from "../middleware/rateLimiting";

const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  db: 0,
});

export const redisStore = new RedisStore(redis);

// Use with rate limiters
import { redisStore } from "./config/redis";

const productionLimiter = new TokenBucketRateLimiter(
  {
    bucketSize: 100,
    refillRate: 10,
    windowMs: 60000,
    max: 100,
  },
  redisStore, // Use Redis instead of memory
);
```

### Monitoring & Alerts

```typescript
// middleware/rateLimitMonitoring.ts
import { Request, Response, NextFunction } from "express";

export function rateLimitMonitoring() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Capture rate limit headers
    const originalSend = res.send;
    res.send = function (data) {
      if (res.statusCode === 429) {
        // Log rate limit hit
        logger.warn("Rate limit exceeded", {
          ip: req.ip,
          path: req.path,
          user: (req as any).user?.id,
          remaining: res.getHeader("X-RateLimit-Remaining"),
          limit: res.getHeader("X-RateLimit-Limit"),
        });

        // Send to monitoring service
        if (process.env.SENTRY_DSN) {
          Sentry.captureMessage("Rate limit exceeded", {
            level: "warning",
            extra: {
              ip: req.ip,
              path: req.path,
            },
          });
        }
      }
      return originalSend.call(this, data);
    };
    next();
  };
}

// Apply globally
app.use(rateLimitMonitoring());
```

### Complete Production Setup

```typescript
// backend/src/index.ts
import express from "express";
import { redisStore } from "./config/redis";
import { TokenBucketRateLimiter, LeakyBucketRateLimiter, SlidingWindowLogRateLimiter, AdaptiveRateLimiter } from "./middleware/rateLimiting";

const app = express();

// Global rate limiter (adaptive)
const globalLimiter = new AdaptiveRateLimiter(
  {
    windowMs: 60000,
    max: 100,
    message: "Too many requests from this IP",
  },
  redisStore,
);

app.use(globalLimiter.middleware());

// API routes with token bucket (bursty)
const apiLimiter = new TokenBucketRateLimiter(
  {
    bucketSize: 100,
    refillRate: 10,
    windowMs: 60000,
    max: 100,
  },
  redisStore,
);

app.use("/api", apiLimiter.middleware());

// Payment routes with leaky bucket (steady)
const paymentLimiter = new LeakyBucketRateLimiter(
  {
    leakRate: 5,
    bucketSize: 20,
    windowMs: 60000,
    max: 20,
  },
  redisStore,
);

app.use("/api/payments", paymentLimiter.middleware());

// Auth routes with sliding window (precise)
const authLimiter = new SlidingWindowLogRateLimiter(
  {
    windowMs: 60 * 60 * 1000,
    max: 5,
  },
  redisStore,
);

app.use("/api/auth", authLimiter.middleware());

app.listen(4000, () => {
  console.log("Server running with advanced rate limiting");
});
```

---

## 📊 Performance Comparison

| Algorithm      | Memory Usage | CPU Usage | Precision | Allows Bursts | Best For        |
| -------------- | ------------ | --------- | --------- | ------------- | --------------- |
| Token Bucket   | Low          | Low       | Good      | ✅ Yes        | General APIs    |
| Leaky Bucket   | Low          | Low       | Good      | ❌ No         | Steady flow     |
| Fixed Window   | Very Low     | Very Low  | Moderate  | ✅ Yes\*      | Simple limits   |
| Sliding Window | High         | Medium    | Excellent | ❌ No         | Precise control |
| Adaptive       | Medium       | Medium    | Good      | ✅ Yes        | Production      |

\*Fixed Window has edge case allowing 2x burst at boundaries

---

**🎉 Your backend now has enterprise-grade rate limiting!**

Choose the right algorithm for each endpoint based on traffic patterns and requirements.
