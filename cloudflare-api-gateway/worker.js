/**
 * Advancia Pay Ledger - API Gateway Worker
 *
 * Features:
 * - JWT authentication & validation
 * - Rate limiting (per user, per IP)
 * - Multi-API aggregation (Stripe, Cryptomus, CoinGecko, etc.)
 * - Request/response logging
 * - CORS handling
 * - Error handling & monitoring
 */

// Rate limiting configuration
const RATE_LIMITS = {
  anonymous: { requests: 10, window: 60 }, // 10 requests per minute
  authenticated: { requests: 100, window: 60 }, // 100 requests per minute
  premium: { requests: 1000, window: 60 }, // 1000 requests per minute
};

export default {
  async fetch(request, env, ctx) {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return handleCORS();
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Health check
      if (path === "/health") {
        return jsonResponse({
          status: "ok",
          timestamp: new Date().toISOString(),
        });
      }

      // Public routes (no auth required)
      if (path.startsWith("/api/public/")) {
        return handlePublicRoutes(request, env, path);
      }

      // Protected routes (JWT required)
      const authResult = await validateJWT(request, env);
      if (!authResult.valid) {
        return jsonResponse(
          { error: "Unauthorized", message: authResult.error },
          401
        );
      }

      // Rate limiting
      const rateLimitResult = await checkRateLimit(
        request,
        env,
        authResult.user
      );
      if (!rateLimitResult.allowed) {
        return jsonResponse(
          {
            error: "Rate limit exceeded",
            limit: rateLimitResult.limit,
            reset: rateLimitResult.reset,
          },
          429
        );
      }

      // Route to appropriate handler
      if (path.startsWith("/api/dashboard")) {
        return handleDashboardAggregation(request, env, authResult.user);
      } else if (path.startsWith("/api/payments")) {
        return handlePaymentsProxy(request, env, authResult.user);
      } else if (path.startsWith("/api/crypto")) {
        return handleCryptoProxy(request, env, authResult.user);
      } else if (path.startsWith("/api/prices")) {
        return handlePricesProxy(request, env, authResult.user);
      } else {
        // Proxy to backend
        return proxyToBackend(request, env, authResult.user);
      }
    } catch (error) {
      console.error("Gateway error:", error);
      return jsonResponse(
        { error: "Internal server error", message: error.message },
        500
      );
    }
  },
};

/**
 * Validate JWT token from Authorization header
 */
async function validateJWT(request, env) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { valid: false, error: "Missing or invalid Authorization header" };
  }

  const token = authHeader.substring(7);

  try {
    // Verify with backend or use crypto.subtle for self-validation
    const response = await fetch(`${env.BACKEND_URL}/api/auth/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": env.INTERNAL_API_KEY,
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      return { valid: false, error: "Invalid token" };
    }

    const data = await response.json();
    return { valid: true, user: data.user };
  } catch (error) {
    return { valid: false, error: "Token verification failed" };
  }
}

/**
 * Rate limiting using Cloudflare Durable Objects or KV
 */
async function checkRateLimit(request, env, user) {
  const identifier =
    user?.userId || request.headers.get("CF-Connecting-IP") || "unknown";
  const tier = user?.tier || "anonymous";
  const limit = RATE_LIMITS[tier] || RATE_LIMITS.anonymous;

  const key = `rate_limit:${identifier}:${Math.floor(
    Date.now() / (limit.window * 1000)
  )}`;

  try {
    // Get current count from KV
    const currentCount = parseInt((await env.RATE_LIMIT_KV?.get(key)) || "0");

    if (currentCount >= limit.requests) {
      return {
        allowed: false,
        limit: limit.requests,
        reset: Math.ceil(Date.now() / 1000) + limit.window,
      };
    }

    // Increment counter
    await env.RATE_LIMIT_KV?.put(key, (currentCount + 1).toString(), {
      expirationTtl: limit.window + 10,
    });

    return { allowed: true, remaining: limit.requests - currentCount - 1 };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    return { allowed: true }; // Fail open
  }
}

/**
 * Dashboard aggregation - parallel API calls
 */
async function handleDashboardAggregation(request, env, user) {
  const userId = user.userId;

  try {
    // Parallel fetch all dashboard data
    const [userProfile, wallets, transactions, prices, trustScore] =
      await Promise.all([
        fetch(`${env.BACKEND_URL}/api/users/${userId}`, {
          headers: { "X-API-Key": env.INTERNAL_API_KEY },
        }).then((r) => r.json()),

        fetch(`${env.BACKEND_URL}/api/wallets`, {
          headers: { "X-API-Key": env.INTERNAL_API_KEY, "X-User-ID": userId },
        }).then((r) => r.json()),

        fetch(`${env.BACKEND_URL}/api/transactions?userId=${userId}&limit=10`, {
          headers: { "X-API-Key": env.INTERNAL_API_KEY },
        }).then((r) => r.json()),

        fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=usd`
        ).then((r) => r.json()),

        fetch(`${env.BACKEND_URL}/api/trust-score/me`, {
          headers: {
            "X-API-Key": env.INTERNAL_API_KEY,
            "X-User-ID": userId,
          },
        }).then((r) => r.json()),
      ]);

    // Aggregate response
    return jsonResponse({
      success: true,
      dashboard: {
        user: userProfile,
        wallets: wallets,
        recentTransactions: transactions,
        prices: prices,
        trustScore: trustScore,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Dashboard aggregation error:", error);
    return jsonResponse(
      { error: "Failed to fetch dashboard data", message: error.message },
      500
    );
  }
}

/**
 * Payments proxy (Stripe, Cryptomus)
 */
async function handlePaymentsProxy(request, env, user) {
  const url = new URL(request.url);
  const path = url.pathname.replace("/api/payments", "");

  // Route to appropriate payment provider
  if (path.startsWith("/stripe")) {
    return proxyToStripe(request, env, user);
  } else if (path.startsWith("/crypto")) {
    return proxyToCryptomus(request, env, user);
  } else {
    return proxyToBackend(request, env, user);
  }
}

/**
 * Crypto prices proxy (CoinGecko, Binance)
 */
async function handleCryptoProxy(request, env, user) {
  const url = new URL(request.url);
  const symbol = url.searchParams.get("symbol") || "BTC";

  try {
    // Parallel fetch from multiple sources
    const [coinGecko, binance] = await Promise.all([
      fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${getCoinGeckoId(
          symbol
        )}&vs_currencies=usd`
      ).then((r) => r.json()),
      fetch(
        `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`
      ).then((r) => r.json()),
    ]);

    return jsonResponse({
      success: true,
      symbol,
      sources: {
        coinGecko: coinGecko,
        binance: binance,
      },
      average: calculateAveragePrice(coinGecko, binance, symbol),
    });
  } catch (error) {
    return jsonResponse(
      { error: "Failed to fetch crypto prices", message: error.message },
      500
    );
  }
}

/**
 * Prices aggregation (multi-source)
 */
async function handlePricesProxy(request, env, user) {
  try {
    const [btcPrice, ethPrice, usdtPrice] = await Promise.all([
      fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
      ).then((r) => r.json()),
      fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
      ).then((r) => r.json()),
      fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd"
      ).then((r) => r.json()),
    ]);

    return jsonResponse({
      success: true,
      prices: {
        BTC: btcPrice.bitcoin.usd,
        ETH: ethPrice.ethereum.usd,
        USDT: usdtPrice.tether.usd,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return jsonResponse(
      { error: "Failed to fetch prices", message: error.message },
      500
    );
  }
}

/**
 * Public routes (no auth)
 */
async function handlePublicRoutes(request, env, path) {
  if (path === "/api/public/prices") {
    return handlePricesProxy(request, env, null);
  } else if (path === "/api/public/status") {
    return jsonResponse({
      status: "operational",
      services: {
        backend: "operational",
        stripe: "operational",
        cryptomus: "operational",
      },
    });
  }

  return jsonResponse({ error: "Not found" }, 404);
}

/**
 * Proxy to backend API
 */
async function proxyToBackend(request, env, user) {
  const url = new URL(request.url);
  const backendUrl = `${env.BACKEND_URL}${url.pathname}${url.search}`;

  const headers = new Headers(request.headers);
  headers.set("X-API-Key", env.INTERNAL_API_KEY);
  if (user) {
    headers.set("X-User-ID", user.userId);
    headers.set("X-User-Role", user.role);
  }

  try {
    const response = await fetch(backendUrl, {
      method: request.method,
      headers: headers,
      body: request.body,
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: addCORSHeaders(response.headers),
    });
  } catch (error) {
    return jsonResponse(
      { error: "Backend proxy failed", message: error.message },
      502
    );
  }
}

/**
 * Proxy to Stripe
 */
async function proxyToStripe(request, env, user) {
  const url = new URL(request.url);
  const stripePath = url.pathname.replace("/api/payments/stripe", "");

  try {
    const response = await fetch(`https://api.stripe.com/v1${stripePath}`, {
      method: request.method,
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: request.body,
    });

    return new Response(response.body, {
      status: response.status,
      headers: addCORSHeaders(response.headers),
    });
  } catch (error) {
    return jsonResponse(
      { error: "Stripe proxy failed", message: error.message },
      502
    );
  }
}

/**
 * Proxy to Cryptomus
 */
async function proxyToCryptomus(request, env, user) {
  const url = new URL(request.url);
  const cryptoPath = url.pathname.replace("/api/payments/crypto", "");

  try {
    const response = await fetch(`https://api.cryptomus.com${cryptoPath}`, {
      method: request.method,
      headers: {
        merchant: env.CRYPTOMUS_MERCHANT_ID,
        sign: await generateCryptomusSign(request, env),
        "Content-Type": "application/json",
      },
      body: request.body,
    });

    return new Response(response.body, {
      status: response.status,
      headers: addCORSHeaders(response.headers),
    });
  } catch (error) {
    return jsonResponse(
      { error: "Cryptomus proxy failed", message: error.message },
      502
    );
  }
}

/**
 * Helper functions
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: addCORSHeaders(
      new Headers({ "Content-Type": "application/json" })
    ),
  });
}

function handleCORS() {
  return new Response(null, {
    status: 204,
    headers: addCORSHeaders(new Headers()),
  });
}

function addCORSHeaders(headers) {
  const newHeaders = new Headers(headers);
  newHeaders.set("Access-Control-Allow-Origin", "*");
  newHeaders.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  newHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  newHeaders.set("Access-Control-Max-Age", "86400");
  return newHeaders;
}

function getCoinGeckoId(symbol) {
  const mapping = {
    BTC: "bitcoin",
    ETH: "ethereum",
    USDT: "tether",
    USDC: "usd-coin",
    BNB: "binancecoin",
  };
  return mapping[symbol.toUpperCase()] || symbol.toLowerCase();
}

function calculateAveragePrice(coinGecko, binance, symbol) {
  const cgId = getCoinGeckoId(symbol);
  const cgPrice = coinGecko[cgId]?.usd || 0;
  const binancePrice = parseFloat(binance.price) || 0;

  if (cgPrice && binancePrice) {
    return (cgPrice + binancePrice) / 2;
  }
  return cgPrice || binancePrice || 0;
}

async function generateCryptomusSign(request, env) {
  // Implement Cryptomus signature generation
  // See: https://doc.cryptomus.com/personal/authentication
  const body = await request.text();
  const encoder = new TextEncoder();
  const data = encoder.encode(body + env.CRYPTOMUS_API_KEY);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
