// Minimal alert service for rate limiter alerts
// Safe no-op: logs locally; optional Sentry capture if configured.

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

let sentryCapture: ((err: Error, ctx?: any) => void) | null = null;
try {
  const mod = require('../utils/sentry');
  sentryCapture =
    mod && typeof mod.captureError === 'function' ? mod.captureError : null;
} catch {}

export async function sendAlert(data: AlertData): Promise<void> {
  try {
    const sev = data.severity || 'medium';
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[ALERT] ${data.group} ${data.identifier} count=${data.count} sev=${sev}`,
      );
    }
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

export default { sendAlert };
