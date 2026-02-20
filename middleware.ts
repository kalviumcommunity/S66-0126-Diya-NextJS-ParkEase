import { NextResponse, type NextRequest } from 'next/server';

const BASE_SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-DNS-Prefetch-Control': 'off',
};

const PROD_HSTS = 'max-age=31536000; includeSubDomains; preload';

const DEFAULT_CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self'",
  "connect-src 'self' https:",
].join('; ');

export function middleware(request: NextRequest) {
  const isProd = process.env.NODE_ENV === 'production';
  const requestHeaders = new Headers(request.headers);

  if (isProd && !requestHeaders.get('x-forwarded-proto')) {
    requestHeaders.set('x-forwarded-proto', 'https');
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const csp =
    !isProd && process.env.CSP_DEV ? process.env.CSP_DEV : DEFAULT_CSP;

  Object.entries(BASE_SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  if (isProd) {
    response.headers.set('Strict-Transport-Security', PROD_HSTS);
  }

  response.headers.set('Content-Security-Policy', csp);

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
