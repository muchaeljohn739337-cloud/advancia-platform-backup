# Price Service API - Quick Start Guide

**Zero-config cryptocurrency price data** via CoinGecko + Binance (no API keys needed).

## Features

✅ Real-time prices for 100+ cryptocurrencies  
✅ Historical data (1-365 days)  
✅ Batch requests (up to 50 symbols)  
✅ Redis caching (5min TTL, configurable)  
✅ Automatic provider fallback  
✅ Portfolio value calculation

---

## API Endpoints

### 1. Get Current Price (Single Symbol)

```bash
GET /api/prices/current/:symbol

# Example:
curl http://localhost:4000/api/prices/current/BTC

# Response:
{
  "success": true,
  "data": {
    "symbol": "BTC",
    "price": 43250.50,
    "change24h": 2.34,
    "volume24h": 28500000000,
    "lastUpdated": 1700236800000,
    "provider": "coingecko"
  }
}
```

**Supported Symbols:** BTC, ETH, USDT, BNB, SOL, XRP, USDC, ADA, DOGE, AVAX, and 90+ more

---

### 2. Get Batch Prices (Multiple Symbols)

```bash
POST /api/prices/batch
Content-Type: application/json

# Body:
{
  "symbols": ["BTC", "ETH", "SOL", "BNB"]
}

# Example:
curl -X POST http://localhost:4000/api/prices/batch \
  -H "Content-Type: application/json" \
  -d '{"symbols":["BTC","ETH","SOL"]}'

# Response:
{
  "success": true,
  "count": 3,
  "data": {
    "BTC": {
      "symbol": "BTC",
      "price": 43250.50,
      "change24h": 2.34,
      "volume24h": 28500000000,
      "lastUpdated": 1700236800000,
      "provider": "coingecko"
    },
    "ETH": { /* ... */ },
    "SOL": { /* ... */ }
  }
}
```

**Limits:** Max 50 symbols per request

---

### 3. Get Historical Prices

```bash
GET /api/prices/historical/:symbol?days={1-365}

# Examples:
curl http://localhost:4000/api/prices/historical/BTC?days=7
curl http://localhost:4000/api/prices/historical/ETH?days=30

# Response:
{
  "success": true,
  "data": {
    "symbol": "BTC",
    "days": 7,
    "count": 168,
    "points": [
      { "timestamp": 1700150400000, "price": 42800.25 },
      { "timestamp": 1700236800000, "price": 43250.50 },
      /* ... */
    ]
  }
}
```

**Note:** Returns 5-minute intervals for ≤1 day, hourly for ≤7 days, daily for >7 days.

---

### 4. Get Portfolio Value (Authenticated)

```bash
GET /api/prices/portfolio
Authorization: Bearer <jwt-token>

# Example:
curl http://localhost:4000/api/prices/portfolio \
  -H "Authorization: Bearer eyJhbG..."

# Response:
{
  "success": true,
  "data": {
    "userId": "user-123",
    "totalValue": 125450.75,
    "holdings": [
      {
        "symbol": "BTC",
        "amount": 2.5,
        "currentPrice": 43250.50,
        "value": 108126.25,
        "change24h": 2.34
      },
      {
        "symbol": "ETH",
        "amount": 8.0,
        "currentPrice": 2165.56,
        "value": 17324.50,
        "change24h": -1.12
      }
    ],
    "lastUpdated": 1700236800000
  }
}
```

**Note:** Currently uses mock holdings. Integrate with your user's wallet/portfolio data.

---

### 5. Provider Health Status (Admin Only)

```bash
GET /api/prices/status
Authorization: Bearer <admin-jwt-token>

# Example:
curl http://localhost:4000/api/prices/status \
  -H "Authorization: Bearer eyJhbG..."

# Response:
{
  "success": true,
  "data": {
    "providers": [
      { "provider": "coingecko", "status": "healthy" },
      { "provider": "binance", "status": "healthy" }
    ],
    "cache": {
      "cachedKeys": 42,
      "redisInfo": "..."
    },
    "timestamp": "2025-11-17T10:30:00.000Z"
  }
}
```

---

## Frontend Integration

### React/Next.js Hook

```typescript
// hooks/useCryptoPrice.ts
import { useEffect, useState } from "react";

export function useCryptoPrice(symbol: string) {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/prices/current/${symbol}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPrice(data.data.price);
        }
      })
      .finally(() => setLoading(false));

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetch(`/api/prices/current/${symbol}`)
        .then((res) => res.json())
        .then((data) => data.success && setPrice(data.data.price));
    }, 30000);

    return () => clearInterval(interval);
  }, [symbol]);

  return { price, loading };
}

// Usage in component:
function BitcoinPrice() {
  const { price, loading } = useCryptoPrice("BTC");

  if (loading) return <div>Loading...</div>;
  return <div>Bitcoin: ${price?.toLocaleString()}</div>;
}
```

### Batch Price Fetcher

```typescript
// lib/priceService.ts
export async function fetchPrices(symbols: string[]) {
  const response = await fetch("/api/prices/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbols }),
  });

  const data = await response.json();
  return data.success ? data.data : {};
}

// Usage:
const prices = await fetchPrices(["BTC", "ETH", "SOL"]);
console.log(prices.BTC.price); // 43250.50
```

### Chart Data Fetcher

```typescript
// lib/chartData.ts
export async function fetchChartData(symbol: string, days: number = 7) {
  const response = await fetch(`/api/prices/historical/${symbol}?days=${days}`);
  const data = await response.json();

  if (!data.success) throw new Error("Failed to fetch chart data");

  // Format for chart library (e.g., recharts, chart.js)
  return data.data.points.map((point) => ({
    date: new Date(point.timestamp).toLocaleDateString(),
    price: point.price,
  }));
}

// Usage with recharts:
import { LineChart, Line, XAxis, YAxis } from "recharts";

function PriceChart({ symbol }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchChartData(symbol, 30).then(setData);
  }, [symbol]);

  return (
    <LineChart width={600} height={300} data={data}>
      <XAxis dataKey="date" />
      <YAxis />
      <Line type="monotone" dataKey="price" stroke="#8884d8" />
    </LineChart>
  );
}
```

---

## Configuration

### Environment Variables

```bash
# backend/.env
PRICE_CACHE_TTL=300          # Cache duration in seconds (default: 5 min)
REDIS_URL=redis://localhost:6379
```

### Rate Limits

-   **CoinGecko Free:** 10-30 calls/min (no key required)
-   **Binance Public:** 1200 calls/min (no key required)
-   **Caching:** Responses cached for 5 minutes (configurable)

### Upgrading to Paid Tiers (Optional)

When you exceed free limits:

```bash
# backend/.env (add these when needed)
COINGECKO_API_KEY=your-pro-key
BINANCE_API_KEY=your-key
BINANCE_API_SECRET=your-secret
```

Then update `priceService.ts` providers to use authenticated endpoints.

---

## Testing

### Quick Test (PowerShell)

```powershell
# Test single price
Invoke-WebRequest -Uri "http://localhost:4000/api/prices/current/BTC" | Select-Object -ExpandProperty Content | ConvertFrom-Json

# Test batch prices
$body = @{ symbols = @("BTC", "ETH", "SOL") } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:4000/api/prices/batch" -Method POST -ContentType "application/json" -Body $body | Select-Object -ExpandProperty Content | ConvertFrom-Json

# Test historical data
Invoke-WebRequest -Uri "http://localhost:4000/api/prices/historical/BTC?days=7" | Select-Object -ExpandProperty Content | ConvertFrom-Json
```

### Integration Test (Node.js)

```javascript
// tests/priceService.test.ts
import { priceService } from "../src/services/priceService";

describe("Price Service", () => {
  it("should fetch BTC price", async () => {
    const price = await priceService.getCurrentPrice("BTC");
    expect(price.symbol).toBe("BTC");
    expect(price.price).toBeGreaterThan(0);
  });

  it("should fetch batch prices", async () => {
    const prices = await priceService.getBatchPrices(["BTC", "ETH"]);
    expect(prices.size).toBe(2);
    expect(prices.get("BTC")).toBeDefined();
  });

  it("should fetch historical data", async () => {
    const history = await priceService.getHistoricalPrices("BTC", 7);
    expect(history.length).toBeGreaterThan(0);
    expect(history[0]).toHaveProperty("timestamp");
    expect(history[0]).toHaveProperty("price");
  });
});
```

---

## Common Use Cases

### 1. Portfolio Dashboard

```typescript
// Fetch all user holdings prices at once
const holdings = [
  { symbol: "BTC", amount: 0.5 },
  { symbol: "ETH", amount: 2.0 },
  { symbol: "SOL", amount: 50.0 },
];

const symbols = holdings.map((h) => h.symbol);
const prices = await fetchPrices(symbols);

const totalValue = holdings.reduce((sum, h) => {
  const price = prices[h.symbol]?.price || 0;
  return sum + price * h.amount;
}, 0);

console.log(`Portfolio value: $${totalValue.toLocaleString()}`);
```

### 2. Price Alerts

```typescript
// Check if BTC crossed threshold
const btcPrice = await fetch("/api/prices/current/BTC")
  .then((r) => r.json())
  .then((d) => d.data.price);

if (btcPrice > 45000) {
  // Send notification
  await fetch("/api/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Price Alert",
      message: `Bitcoin reached $${btcPrice}!`,
    }),
  });
}
```

### 3. Live Ticker

```typescript
// WebSocket alternative using polling
function startTicker(symbols: string[], callback: (prices: any) => void) {
  const fetchPrices = async () => {
    const response = await fetch("/api/prices/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbols }),
    });
    const data = await response.json();
    if (data.success) callback(data.data);
  };

  fetchPrices(); // Initial fetch
  return setInterval(fetchPrices, 10000); // Update every 10s
}

// Usage:
const tickerInterval = startTicker(["BTC", "ETH", "SOL"], (prices) => {
  console.log("Updated prices:", prices);
});

// Cleanup:
clearInterval(tickerInterval);
```

---

## Troubleshooting

### Redis Connection Errors

If you see `Redis connection error`:

```powershell
# Start Redis via Docker
docker run -d -p 6379:6379 redis:alpine

# Or install Redis locally:
choco install redis-64  # Windows
brew install redis      # macOS
```

### Rate Limit Exceeded

If you hit CoinGecko/Binance limits:

1. Increase `PRICE_CACHE_TTL` to reduce API calls
2. Implement request throttling on frontend
3. Upgrade to paid API tier (see Configuration section)

### Provider Failures

Check provider status:

```bash
curl http://localhost:4000/api/prices/status \
  -H "Authorization: Bearer <admin-token>"
```

The service automatically falls back to the next provider if one fails.

---

## Next Steps

1. **Integrate with user portfolios:** Replace mock holdings in `/api/prices/portfolio` with real user data from your database
2. **Add more providers:** Extend `PriceProvider` interface to support Coinbase, Kraken, etc.
3. **Implement WebSocket:** Real-time price streaming for live dashboards
4. **Add alerting:** Price threshold notifications via email/SMS/Telegram
5. **Historical analysis:** Moving averages, RSI, volume analysis

---

## Support

-   API errors? Check `/api/prices/status` for provider health
-   Need more symbols? CoinGecko supports 10,000+ coins via their ID system
-   Performance issues? Monitor Redis cache hit rates in admin dashboard

**No API keys needed to start. Scale when you need it.** 🚀
