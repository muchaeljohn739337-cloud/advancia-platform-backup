'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function NotFound() {
  const pathname = usePathname();

  useEffect(() => {
    // Silent mode 404 logging - logs to console without user notification
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[404] Page not found: ${pathname}`);
    }

    // Optional: Send to analytics/monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: trackEvent('404', { path: pathname });
    }
  }, [pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="card bg-base-100 shadow-2xl w-full max-w-md">
        <div className="card-body text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-gradient-to-br from-error to-warning rounded-full mx-auto mb-6 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>

          {/* Description */}
          <p className="text-gray-600 mb-6">
            The page <code className="badge badge-ghost">{pathname}</code> doesn&apos;t exist or has
            been moved.
          </p>

          {/* Actions */}
          <div className="card-actions justify-center">
            <a href="/" className="btn btn-primary">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Go Home
            </a>
            <button onClick={() => window.history.back()} className="btn btn-ghost">
              Go Back
            </button>
          </div>

          {/* Debug Info (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="alert alert-info mt-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="stroke-current shrink-0 w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <span className="text-sm">Development Mode: 404 logged silently to console</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
