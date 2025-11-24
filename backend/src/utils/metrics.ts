/**
 * Prometheus Metrics for Advancia Pay Ledger
 * Provides observability for HTTP requests, active users, and withdrawals
 */

import promClient from 'prom-client';

// Create a registry for all metrics
const register = new promClient.Registry();

// Enable default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({ register });

// ============= Custom Metrics =============

/**
 * HTTP Request Duration Histogram
 * Tracks the duration of HTTP requests by method, route, and status code
 */
export const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10], // Response time buckets in seconds
  registers: [register],
});

/**
 * HTTP Request Counter
 * Counts total HTTP requests by method, route, and status code
 */
export const httpRequestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

/**
 * Active Users Gauge
 * Tracks the number of currently active/logged-in users
 */
export const activeUsers = new promClient.Gauge({
  name: 'active_users_total',
  help: 'Number of active users',
  registers: [register],
});

/**
 * Withdrawal Counter
 * Counts total number of withdrawals by currency and status
 */
export const withdrawalTotal = new promClient.Counter({
  name: 'withdrawal_total',
  help: 'Total number of withdrawals',
  labelNames: ['currency', 'status'],
  registers: [register],
});

/**
 * Withdrawal Amount Summary
 * Tracks withdrawal amounts by currency
 */
export const withdrawalAmount = new promClient.Summary({
  name: 'withdrawal_amount',
  help: 'Amount of withdrawals',
  labelNames: ['currency'],
  percentiles: [0.5, 0.9, 0.99], // Median, 90th, 99th percentile
  registers: [register],
});

/**
 * Database Query Duration Histogram
 * Tracks Prisma query performance
 */
export const dbQueryDuration = new promClient.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'model'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
  registers: [register],
});

/**
 * Security Alert Counter
 * Counts security events (IP blocks, failed auth, etc.)
 */
export const securityAlerts = new promClient.Counter({
  name: 'security_alerts_total',
  help: 'Total number of security alerts',
  labelNames: ['type', 'severity'],
  registers: [register],
});

/**
 * Payment Processing Gauge
 * Tracks currently processing payments
 */
export const processingPayments = new promClient.Gauge({
  name: 'payments_processing',
  help: 'Number of payments currently being processed',
  labelNames: ['provider', 'currency'],
  registers: [register],
});

/**
 * WebSocket Connections Gauge
 * Tracks active WebSocket connections
 */
export const websocketConnections = new promClient.Gauge({
  name: 'websocket_connections_active',
  help: 'Number of active WebSocket connections',
  registers: [register],
});

/**
 * Error Counter
 * Counts application errors by type and route
 */
export const errorCounter = new promClient.Counter({
  name: 'errors_total',
  help: 'Total number of application errors',
  labelNames: ['type', 'route', 'status_code'],
  registers: [register],
});

// ============= Helper Functions =============

/**
 * Get metrics in Prometheus text format
 * Used by the /metrics endpoint
 */
export function getMetrics(): Promise<string> {
  return register.metrics();
}

/**
 * Get metrics as JSON
 * Used for debugging or custom monitoring dashboards
 */
export async function getMetricsJSON(): Promise<any> {
  const metrics = await register.getMetricsAsJSON();
  return metrics;
}

/**
 * Clear all metrics (useful for testing)
 */
export function clearMetrics(): void {
  register.clear();
}

/**
 * Express middleware to track HTTP request metrics
 * Usage: app.use(metricsMiddleware)
 */
export function metricsMiddleware(req: any, res: any, next: any) {
  const start = Date.now();

  // Track response finish
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // Convert to seconds
    const route = req.route?.path || req.path || 'unknown';
    const method = req.method;
    const statusCode = res.statusCode;

    // Record metrics
    httpRequestDuration
      .labels(method, route, statusCode.toString())
      .observe(duration);
    httpRequestCounter.labels(method, route, statusCode.toString()).inc();

    // Track errors (4xx and 5xx responses)
    if (statusCode >= 400) {
      errorCounter
        .labels(
          statusCode >= 500 ? 'server_error' : 'client_error',
          route,
          statusCode.toString(),
        )
        .inc();
    }
  });

  next();
}

/**
 * Track withdrawal metrics
 */
export function trackWithdrawal(
  currency: string,
  status: string,
  amount: number,
) {
  withdrawalTotal.labels(currency, status).inc();
  withdrawalAmount.labels(currency).observe(amount);
}

/**
 * Track security alert
 */
export function trackSecurityAlert(
  type: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
) {
  securityAlerts.labels(type, severity).inc();
}

/**
 * Track database query
 */
export function trackDbQuery(
  operation: string,
  model: string,
  durationMs: number,
) {
  dbQueryDuration.labels(operation, model).observe(durationMs / 1000); // Convert to seconds
}

/**
 * Update active users count
 */
export function updateActiveUsers(count: number) {
  activeUsers.set(count);
}

/**
 * Track payment processing
 */
export function trackPaymentProcessing(
  provider: string,
  currency: string,
  increment: boolean = true,
) {
  if (increment) {
    processingPayments.labels(provider, currency).inc();
  } else {
    processingPayments.labels(provider, currency).dec();
  }
}

/**
 * Track WebSocket connections
 */
export function trackWebSocketConnection(increment: boolean = true) {
  if (increment) {
    websocketConnections.inc();
  } else {
    websocketConnections.dec();
  }
}

export default {
  getMetrics,
  getMetricsJSON,
  clearMetrics,
  metricsMiddleware,
  trackWithdrawal,
  trackSecurityAlert,
  trackDbQuery,
  updateActiveUsers,
  trackPaymentProcessing,
  trackWebSocketConnection,
  httpRequestDuration,
  httpRequestCounter,
  activeUsers,
  withdrawalTotal,
  withdrawalAmount,
  dbQueryDuration,
  securityAlerts,
  processingPayments,
  websocketConnections,
  errorCounter,
};
