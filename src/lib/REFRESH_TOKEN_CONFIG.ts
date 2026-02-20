/**
 * REFRESH TOKEN ROTATION IMPLEMENTATION
 *
 * This document explains the refresh token rotation flow implemented in ParkEase.
 *
 * FLOW:
 * 1. User logs in with email/password
 * 2. Server validates credentials and generates:
 *    - Access Token (15 min, in JWT payload)
 *    - Refresh Token (7 days, as HTTP-only cookie)
 * 3. Client stores:
 *    - Access Token in memory only (volatile)
 *    - User info in localStorage
 *    - Refresh Token automatically in cookie (server-set)
 *
 * 4. For API requests:
 *    - secureFetch() attaches Bearer token from memory
 *    - If request returns 401, automatic token refresh is attempted
 *    - POST /api/auth/refresh validates refresh token cookie
 *    - Server returns new access token
 *    - Request is retried with new token
 *    - If refresh fails, user is redirected to login
 *
 * 5. On logout:
 *    - Server clears refresh token cookie
 *    - Client clears memory token and user data
 *
 * SECURITY BENEFITS:
 * ✓ Access token in memory = no persistent storage, cleared on page refresh
 * ✓ Refresh token in HTTP-only cookie = not accessible from JavaScript
 * ✓ Refresh token never sent in Authorization header
 * ✓ Token rotation on each refresh = limited token lifetime
 * ✓ CSRF protection via SameSite=Strict
 *
 * FILES MODIFIED:
 * - src/app/api/auth/login/route.ts (already sets refresh cookie)
 * - src/app/api/auth/refresh/route.ts (NEW - validates and issues new tokens)
 * - src/lib/secureFetch.ts (NEW - handles token attachment and 401 interception)
 * - src/context/AuthContext.tsx (updated to use in-memory tokens)
 * - src/hooks/useAuthFetcher.ts (updated to use secureFetch)
 *
 * USAGE:
 * import { secureFetch } from '@/lib/secureFetch';
 *
 * const response = await secureFetch('/api/slots', {
 *   method: 'GET',
 *   retryOnUnauth: true, // default: true (automatically retries on 401)
 * });
 */

export const REFRESH_TOKEN_CONFIG = {
  // Tokens
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',

  // Storage
  ACCESS_TOKEN_STORAGE: 'memory',
  REFRESH_TOKEN_STORAGE: 'http-only-cookie',
  USER_INFO_STORAGE: 'localStorage',

  // Cookie settings
  COOKIE_NAME: 'refreshToken',
  COOKIE_SECURE: true, // HTTPS only in production
  COOKIE_SAME_SITE: 'strict',
  COOKIE_HTTP_ONLY: true,
  COOKIE_MAX_AGE: 7 * 24 * 60 * 60, // 7 days in seconds

  // Refresh behavior
  MAX_REFRESH_RETRIES: 1,
  PREVENT_SIMULTANEOUS_REFRESHES: true,
};

export default REFRESH_TOKEN_CONFIG;
