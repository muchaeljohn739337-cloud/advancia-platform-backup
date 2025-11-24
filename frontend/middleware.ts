import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-url', request.url);

  // Optional site lockdown: redirect all pages to /auth/login except allowlist
  const lockdown = process.env.NEXT_PUBLIC_LOCKDOWN === 'true';
  if (lockdown) {
    const { pathname } = request.nextUrl;
    const allow = ['/auth', '/landing', '/faq', '/status', '/news', '/_next', '/favicon.ico'];
    const isAllowed = allow.some((p) => pathname.startsWith(p));
    if (!isAllowed) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
