import { client, v2 } from '@datadog/datadog-api-client';
import * as Sentry from '@sentry/node';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { z } from 'zod';

// ✅ Initialize monitoring (Sentry + Datadog)
export function initMonitoring() {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 1.0,
    });
  }

  if (process.env.DATADOG_API_KEY) {
    const configuration = client.createConfiguration({
      authMethods: {
        apiKeyAuth: process.env.DATADOG_API_KEY,
      },
    });
    global.datadogMetricsApi = new v2.MetricsApi(configuration);
  }
}

// ✅ Security headers
export function securityHeaders(app) {
  app.use(
    helmet({
      contentSecurityPolicy: false, // adjust if serving frontend
      crossOriginResourcePolicy: { policy: 'same-origin' },
    }),
  );
}

// ✅ Request latency and metrics middleware
export function requestMetrics(app) {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const status = res.statusCode;

      // Send metrics to Datadog
      if (global.datadogMetricsApi) {
        const now = Math.floor(Date.now() / 1000);
        const series = [
          {
            metric: 'advancia.request.latency',
            type: 0, // gauge
            points: [{ timestamp: now, value: duration }],
            tags: [
              `method:${req.method}`,
              `status:${status}`,
              `endpoint:${req.path}`,
            ],
          },
          {
            metric: 'advancia.request.count',
            type: 1, // count
            points: [{ timestamp: now, value: 1 }],
            tags: [
              `method:${req.method}`,
              `status:${status}`,
              `endpoint:${req.path}`,
            ],
          },
        ];
        global.datadogMetricsApi
          .submitMetrics({ body: { series } })
          .catch(console.error);
      }
    });
    next();
  });
}

// ✅ Rate limiting (example: login endpoint)
export const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 requests/minute
  message: { error: 'Too many login attempts, try again later.' },
});

// ✅ Response sanitizer
export function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
    // exclude password_hash, tokens, etc.
  };
}

// ✅ Response validation schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  role: z.string(),
  created_at: z.string(),
});

// ✅ Global error handler with monitoring
export function errorHandler(err, req, res, next) {
  console.error(err); // log internally

  // Send error to Sentry if configured
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }

  // Send error metrics to Datadog
  if (global.datadogMetricsApi) {
    const now = Math.floor(Date.now() / 1000);
    const series = [
      {
        metric: 'advancia.error.count',
        type: 1, // count
        points: [{ timestamp: now, value: 1 }],
        tags: [`endpoint:${req.path}`, `status:${err.status || 500}`],
      },
    ];
    global.datadogMetricsApi
      .submitMetrics({ body: { series } })
      .catch(console.error);
  }

  res.status(err.status || 500).json({
    ok: false,
    error: err.message || 'Internal server error',
  });
}
