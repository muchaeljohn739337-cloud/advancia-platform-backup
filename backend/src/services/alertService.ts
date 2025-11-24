// Minimal alert service - safe no-op implementation for production readiness
// Avoids optional dependencies; logs and optionally captures to Sentry.

type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface AlertData {
  identifier: string;
  group: string;
  count: number;
  path?: string;
  method?: string;
  timestamp?: number;
  userAgent?: string;
  severity?: Severity;
}

// Lazy import to avoid hard dependency during build
let sentryCapture: ((err: Error, ctx?: any) => void) | null = null;
try {
  const mod = require('../utils/sentry');
  sentryCapture =
    mod && typeof mod.captureError === 'function' ? mod.captureError : null;
} catch {
  sentryCapture = null;
}

export async function sendAlert(data: AlertData): Promise<void> {
  try {
    const sev = data.severity || 'medium';
    const msg = `[ALERT] group=${data.group} id=${data.identifier} count=${data.count} sev=${sev} path=${data.path} method=${data.method}`;
    if (process.env.NODE_ENV !== 'production') {
      console.warn(msg);
    }

    // Optionally capture to Sentry in production
    if (process.env.SENTRY_DSN && sentryCapture) {
      sentryCapture(new Error('rate-limit-alert'), {
        level: 'warning',
        tags: { component: 'alert-service', severity: sev, group: data.group },
        extra: data,
      });
    }
  } catch (err) {
    console.error('Alert dispatch failed:', err);
  }
}

// Stub for alert history - disabled to prevent redis dependency errors
export async function getAlertHistory(
  group: string,
  limit: number = 50,
): Promise<any[]> {
  console.warn('getAlertHistory called but disabled - returning empty array');
  return [];
}

export default { sendAlert, getAlertHistory };

// (File intentionally minimal to unblock production build)
// All database-backed alert functions removed to prevent compilation errors
