/**
 * Multi-Provider Cryptocurrency Price Service
 *
 * Features:
 * - Multiple provider support (CoinGecko, Binance)
 * - Redis caching with configurable TTL
 * - Automatic fallback on provider failure
 * - Rate limit tracking
 * - No API keys required for free tier
 */

import { Redis } from 'ioredis';

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryStrategy: (times) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false,
});

redis.on('error', (err) => {
  console.error('Redis connection error (price service):', err.message);
});

// Types
export interface PricePoint {
  timestamp: number;
  price: number;
  volume?: number;
}

export interface CurrentPrice {
  symbol: string;
  price: number;
  change24h?: number;
  volume24h?: number;
  lastUpdated: number;
  provider: string;
}

export interface PriceProvider {
  name: string;
  getCurrentPrice(symbol: string): Promise<CurrentPrice>;
  getBatchPrices(symbols: string[]): Promise<Map<string, CurrentPrice>>;
  getHistoricalPrices(symbol: string, days: number): Promise<PricePoint[]>;
}

// CoinGecko Provider (Free, no API key)
class CoinGeckoProvider implements PriceProvider {
  name = 'coingecko';
  private baseUrl = 'https://api.coingecko.com/api/v3';
  private symbolMap: Record<string, string> = {
    BTC: 'bitcoin',
    ETH: 'ethereum',
    USDT: 'tether',
    BNB: 'binancecoin',
    SOL: 'solana',
    XRP: 'ripple',
    USDC: 'usd-coin',
    ADA: 'cardano',
    DOGE: 'dogecoin',
    AVAX: 'avalanche-2',
  };

  async getCurrentPrice(symbol: string): Promise<CurrentPrice> {
    const coinId = this.symbolMap[symbol.toUpperCase()] || symbol.toLowerCase();
    const url = `${this.baseUrl}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = (await response.json()) as Record<string, any>;
    const coinData = data[coinId];

    if (!coinData) {
      throw new Error(`Symbol ${symbol} not found on CoinGecko`);
    }

    return {
      symbol: symbol.toUpperCase(),
      price: coinData.usd,
      change24h: coinData.usd_24h_change,
      volume24h: coinData.usd_24h_vol,
      lastUpdated: Date.now(),
      provider: this.name,
    };
  }

  async getBatchPrices(symbols: string[]): Promise<Map<string, CurrentPrice>> {
    const coinIds = symbols
      .map((s) => this.symbolMap[s.toUpperCase()] || s.toLowerCase())
      .join(',');
    const url = `${this.baseUrl}/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = (await response.json()) as Record<string, any>;
    const results = new Map<string, CurrentPrice>();

    symbols.forEach((symbol) => {
      const coinId =
        this.symbolMap[symbol.toUpperCase()] || symbol.toLowerCase();
      const coinData = data[coinId];

      if (coinData) {
        results.set(symbol.toUpperCase(), {
          symbol: symbol.toUpperCase(),
          price: coinData.usd,
          change24h: coinData.usd_24h_change,
          volume24h: coinData.usd_24h_vol,
          lastUpdated: Date.now(),
          provider: this.name,
        });
      }
    });

    return results;
  }

  async getHistoricalPrices(
    symbol: string,
    days: number,
  ): Promise<PricePoint[]> {
    const coinId = this.symbolMap[symbol.toUpperCase()] || symbol.toLowerCase();
    const url = `${this.baseUrl}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data: any = await response.json();

    return data.prices.map(([timestamp, price]: [number, number]) => ({
      timestamp,
      price,
    }));
  }
}

// Binance Provider (Free, no API key)
class BinanceProvider implements PriceProvider {
  name = 'binance';
  private baseUrl = 'https://api.binance.com/api/v3';

  async getCurrentPrice(symbol: string): Promise<CurrentPrice> {
    const pair = `${symbol.toUpperCase()}USDT`;
    const url = `${this.baseUrl}/ticker/24hr?symbol=${pair}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }

    const data: any = await response.json();

    return {
      symbol: symbol.toUpperCase(),
      price: parseFloat(data.lastPrice),
      change24h: parseFloat(data.priceChangePercent),
      volume24h: parseFloat(data.quoteVolume),
      lastUpdated: data.closeTime,
      provider: this.name,
    };
  }

  async getBatchPrices(symbols: string[]): Promise<Map<string, CurrentPrice>> {
    const url = `${this.baseUrl}/ticker/24hr`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }

    const allData = (await response.json()) as any[];
    const results = new Map<string, CurrentPrice>();

    symbols.forEach((symbol) => {
      const pair = `${symbol.toUpperCase()}USDT`;
      const tickerData = allData.find((t: any) => t.symbol === pair);

      if (tickerData) {
        results.set(symbol.toUpperCase(), {
          symbol: symbol.toUpperCase(),
          price: parseFloat(tickerData.lastPrice),
          change24h: parseFloat(tickerData.priceChangePercent),
          volume24h: parseFloat(tickerData.quoteVolume),
          lastUpdated: tickerData.closeTime,
          provider: this.name,
        });
      }
    });

    return results;
  }

  async getHistoricalPrices(
    symbol: string,
    days: number,
  ): Promise<PricePoint[]> {
    const pair = `${symbol.toUpperCase()}USDT`;
    const interval = days <= 1 ? '5m' : days <= 7 ? '1h' : '1d';
    const url = `${
      this.baseUrl
    }/klines?symbol=${pair}&interval=${interval}&limit=${Math.min(
      days * 24,
      1000,
    )}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }

    const data = (await response.json()) as any[];

    return data.map((kline: any[]) => ({
      timestamp: kline[0],
      price: parseFloat(kline[4]), // Close price
      volume: parseFloat(kline[5]), // Volume
    }));
  }
}

// Price Service with caching and fallback
export class PriceService {
  private providers: PriceProvider[];
  private cacheTTL: number;

  constructor() {
    this.providers = [new CoinGeckoProvider(), new BinanceProvider()];
    this.cacheTTL = parseInt(process.env.PRICE_CACHE_TTL || '300', 10); // 5 minutes default
  }

  private getCacheKey(type: string, ...args: string[]): string {
    return `price:${type}:${args.join(':')}`;
  }

  async getCurrentPrice(symbol: string): Promise<CurrentPrice> {
    const cacheKey = this.getCacheKey('current', symbol.toUpperCase());

    // Try cache first
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const price = JSON.parse(cached) as CurrentPrice;
        return { ...price, cached: true } as any;
      }
    } catch (err) {
      console.warn('Cache read failed:', err);
    }

    // Try providers in order
    for (const provider of this.providers) {
      try {
        const price = await provider.getCurrentPrice(symbol);

        // Cache success
        try {
          await redis.setex(cacheKey, this.cacheTTL, JSON.stringify(price));
        } catch (err) {
          console.warn('Cache write failed:', err);
        }

        return price;
      } catch (err) {
        console.warn(`Provider ${provider.name} failed:`, err);
        continue;
      }
    }

    throw new Error(`All providers failed for symbol ${symbol}`);
  }

  async getBatchPrices(symbols: string[]): Promise<Map<string, CurrentPrice>> {
    const results = new Map<string, CurrentPrice>();
    const missingSymbols: string[] = [];

    // Check cache first
    for (const symbol of symbols) {
      const cacheKey = this.getCacheKey('current', symbol.toUpperCase());
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          const price = JSON.parse(cached) as CurrentPrice;
          results.set(symbol.toUpperCase(), { ...price, cached: true } as any);
        } else {
          missingSymbols.push(symbol);
        }
      } catch (err) {
        missingSymbols.push(symbol);
      }
    }

    // Fetch missing from providers
    if (missingSymbols.length > 0) {
      for (const provider of this.providers) {
        try {
          const providerResults = await provider.getBatchPrices(missingSymbols);

          // Cache and add to results
          for (const [symbol, price] of providerResults.entries()) {
            results.set(symbol, price);
            const cacheKey = this.getCacheKey('current', symbol);
            try {
              await redis.setex(cacheKey, this.cacheTTL, JSON.stringify(price));
            } catch (err) {
              console.warn('Cache write failed:', err);
            }
          }

          break; // Success, don't try other providers
        } catch (err) {
          console.warn(`Provider ${provider.name} batch failed:`, err);
          continue;
        }
      }
    }

    return results;
  }

  async getHistoricalPrices(
    symbol: string,
    days: number,
  ): Promise<PricePoint[]> {
    const cacheKey = this.getCacheKey(
      'historical',
      symbol.toUpperCase(),
      days.toString(),
    );

    // Try cache first (longer TTL for historical data)
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      console.warn('Cache read failed:', err);
    }

    // Try providers
    for (const provider of this.providers) {
      try {
        const data = await provider.getHistoricalPrices(symbol, days);

        // Cache with longer TTL (1 hour for historical)
        try {
          await redis.setex(cacheKey, 3600, JSON.stringify(data));
        } catch (err) {
          console.warn('Cache write failed:', err);
        }

        return data;
      } catch (err) {
        console.warn(`Provider ${provider.name} historical failed:`, err);
        continue;
      }
    }

    throw new Error(`All providers failed for historical data: ${symbol}`);
  }

  async getProviderStatus() {
    const status: Array<{ provider: string; status: string; error?: string }> =
      [];

    for (const provider of this.providers) {
      try {
        await provider.getCurrentPrice('BTC');
        status.push({ provider: provider.name, status: 'healthy' });
      } catch (err) {
        status.push({
          provider: provider.name,
          status: 'unhealthy',
          error: (err as Error).message,
        });
      }
    }

    return status;
  }

  async getCacheStats() {
    try {
      const keys = await redis.keys('price:*');
      const info = await redis.info('stats');

      return {
        cachedKeys: keys.length,
        redisInfo: info,
      };
    } catch (err) {
      return { error: 'Cache stats unavailable' };
    }
  }
}

// Singleton instance
export const priceService = new PriceService();
