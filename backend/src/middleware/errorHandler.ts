import * as Sentry from '@sentry/node';
import { NextFunction, Request, Response } from 'express';

/**
 * Enhanced global error handler middleware with Sentry integration
 * Sanitizes error responses based on environment
 * - Production: Generic error messages to prevent information leakage, sends to Sentry
 * - Development: Detailed error messages with stack traces for debugging
 *
 * IMPORTANT: Must be registered AFTER all routes in index.ts
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  // Extract user context from authenticated requests
  const user = (req as any).user;
  const userId = user?.userId || user?.id;

  // Get client IP
  const clientIP =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    (req.headers['x-real-ip'] as string) ||
    req.ip ||
    'Unknown';

  // Comprehensive error context
  const errorContext = {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: clientIP,
    userAgent: req.get('user-agent'),
    userId: userId,
    query: req.query,
    body: sanitizeBody(req.body), // Remove sensitive fields
    timestamp: new Date().toISOString(),
    errorName: err.name,
    statusCode: err.status || err.statusCode || 500,
  };

  // Log full error details on backend (always)
  console.error('[ERROR]', errorContext);

  // Send to Sentry in production
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction && process.env.SENTRY_DSN) {
    Sentry.captureException(err, {
      user: userId ? { id: userId } : undefined,
      tags: {
        path: req.path,
        method: req.method,
        statusCode: errorContext.statusCode,
      },
      extra: {
        query: req.query,
        body: sanitizeBody(req.body),
        ip: clientIP,
      },
    });
  }

  const statusCode = err.status || err.statusCode || 500;

  if (isProduction) {
    // Generic error message for production
    res.status(statusCode).json({
      success: false,
      error: 'An error occurred. Please try again later.',
      timestamp: new Date().toISOString(),
    });
  } else {
    // Detailed error for development
    res.status(statusCode).json({
      success: false,
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      userId: userId,
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Sanitize request body to remove sensitive fields before logging
 */
function sanitizeBody(body: any): any {
  if (!body || typeof body !== 'object') return body;

  const sanitized = { ...body };
  const sensitiveFields = [
    'password',
    'passwordHash',
    'token',
    'apiKey',
    'secret',
    'totpSecret',
    'backupCodes',
    'cardNumber',
    'cvv',
    'pin',
  ];

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * 404 handler for undefined routes
 * Should be registered before the error handler
 * SILENT MODE: Logs 404s to console without verbose output
 */
export const notFoundHandler = (req: Request, res: Response) => {
  // Silent mode logging - minimal console output
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[404] ${req.method} ${req.path}`);
  }

  // Optional: Track in production analytics/monitoring
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry, DataDog, or custom analytics
    // trackEvent('404', { path: req.path, method: req.method });
  }

  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
};
