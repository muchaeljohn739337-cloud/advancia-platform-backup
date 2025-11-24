/**
 * Frontend Tracing Configuration (Optional)
 *
 * This module provides basic client-side tracing for the Next.js frontend.
 * For full observability, consider using:
 * - Sentry Browser SDK (already installed)
 * - Google Analytics 4
 * - PostHog
 * - LogRocket
 */

/**
 * Track API calls with basic timing
 */
export function traceAPICall<T>(
  operationName: string,
  apiCall: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const startTime = performance.now();

  console.log(`[Trace] Starting: ${operationName}`, metadata);

  return apiCall()
    .then((result) => {
      const duration = performance.now() - startTime;
      console.log(`[Trace] Success: ${operationName} (${duration.toFixed(2)}ms)`, {
        ...metadata,
        duration,
        status: 'success',
      });
      return result;
    })
    .catch((error) => {
      const duration = performance.now() - startTime;
      console.error(`[Trace] Error: ${operationName} (${duration.toFixed(2)}ms)`, {
        ...metadata,
        duration,
        status: 'error',
        error: error.message,
      });
      throw error;
    });
}

/**
 * Track user interactions
 */
export function traceUserAction(action: string, details?: Record<string, any>): void {
  console.log(`[Trace] User Action: ${action}`, {
    timestamp: new Date().toISOString(),
    ...details,
  });

  // You can send this to your backend analytics endpoint
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: action,
        eventProperties: details,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    }).catch(() => {
      // Silently fail - don't break UX for analytics
    });
  }
}

/**
 * Track page views
 */
export function tracePageView(pageName: string, metadata?: Record<string, any>): void {
  console.log(`[Trace] Page View: ${pageName}`, metadata);

  traceUserAction('page_view', {
    page: pageName,
    ...metadata,
  });
}

/**
 * Measure component render time
 */
export function measureRenderTime(componentName: string): () => void {
  const startTime = performance.now();

  return () => {
    const duration = performance.now() - startTime;
    console.log(`[Trace] Render: ${componentName} (${duration.toFixed(2)}ms)`);
  };
}

// Example usage in components:
/*
// In a React component
import { traceAPICall, traceUserAction, measureRenderTime } from '@/lib/tracing';

export default function UserDashboard() {
  useEffect(() => {
    const endRenderTrace = measureRenderTime('UserDashboard');
    
    traceAPICall('fetchUserData', async () => {
      const response = await fetch('/api/user');
      return response.json();
    }).then((data) => {
      setUserData(data);
    });

    return endRenderTrace;
  }, []);

  const handleButtonClick = () => {
    traceUserAction('button_click', { 
      button: 'upgrade_account',
      page: 'dashboard' 
    });
    // ... rest of handler
  };

  return <div>...</div>;
}
*/

export default {
  traceAPICall,
  traceUserAction,
  tracePageView,
  measureRenderTime,
};
