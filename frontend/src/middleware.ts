/**
 * Next.js Middleware for Security Headers
 *
 * Implements CSP, clickjacking protection, and security headers
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Get current environment
  const isDev = process.env.NODE_ENV === 'development';
  const domain = request.nextUrl.hostname;

  // ============================================
  // 1. CONTENT SECURITY POLICY (CSP)
  // ============================================

  const cspDirectives = [
    // Default: only allow same origin
    "default-src 'self'",

    // Scripts: self + specific trusted CDNs
    isDev
      ? "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live"
      : "script-src 'self' 'unsafe-inline' https://vercel.live https://cdn.jsdelivr.net",

    // Styles: self + inline styles (for styled-components, etc.)
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

    // Images: self + data URIs + trusted CDNs
    "img-src 'self' data: https: blob:",

    // Fonts: self + Google Fonts
    "font-src 'self' https://fonts.gstatic.com data:",

    // AJAX, WebSocket: self + API domain
    `connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'} wss: ws:`,

    // Media: self + trusted sources
    "media-src 'self' https:",

    // Objects: none (block Flash, Java applets)
    "object-src 'none'",

    // Base URI: restrict to same origin
    "base-uri 'self'",

    // Forms: only submit to same origin
    "form-action 'self'",

    // Frame ancestors: prevent clickjacking
    "frame-ancestors 'none'",

    // Upgrade insecure requests in production
    !isDev ? 'upgrade-insecure-requests' : '',

    // Block mixed content
    'block-all-mixed-content',
  ]
    .filter(Boolean)
    .join('; ');

  response.headers.set('Content-Security-Policy', cspDirectives);

  // CSP Report-Only for testing (optional)
  if (isDev) {
    response.headers.set('Content-Security-Policy-Report-Only', cspDirectives);
  }

  // ============================================
  // 2. CLICKJACKING PROTECTION
  // ============================================

  // X-Frame-Options: Prevent page from being framed
  response.headers.set('X-Frame-Options', 'DENY');

  // ============================================
  // 3. XSS PROTECTION
  // ============================================

  // X-XSS-Protection: Enable browser XSS filtering
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // X-Content-Type-Options: Prevent MIME sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // ============================================
  // 4. REFERRER POLICY
  // ============================================

  // Referrer-Policy: Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // ============================================
  // 5. PERMISSIONS POLICY
  // ============================================

  const permissionsPolicy = [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()', // Disable FLoC
    'payment=(self)',
    'usb=()',
    'bluetooth=()',
  ].join(', ');

  response.headers.set('Permissions-Policy', permissionsPolicy);

  // ============================================
  // 6. STRICT TRANSPORT SECURITY (HSTS)
  // ============================================

  if (!isDev) {
    // HSTS: Force HTTPS for 2 years
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }

  // ============================================
  // 7. CROSS-ORIGIN POLICIES
  // ============================================

  // CORP: Protect against Spectre attacks
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  // COOP: Isolate browsing context
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');

  // COEP: Require explicit permission for cross-origin resources
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');

  // ============================================
  // 8. CACHE CONTROL FOR SENSITIVE PAGES
  // ============================================

  const sensitivePaths = ['/dashboard', '/admin', '/profile', '/settings'];
  const isSensitivePath = sensitivePaths.some((path) => request.nextUrl.pathname.startsWith(path));

  if (isSensitivePath) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  // ============================================
  // 9. CUSTOM SECURITY HEADERS
  // ============================================

  // Remove server information
  response.headers.delete('X-Powered-By');

  // Add custom security header
  response.headers.set('X-Content-Security-Policy', cspDirectives);

  return response;
}

// Configure matcher to run on all routes
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
