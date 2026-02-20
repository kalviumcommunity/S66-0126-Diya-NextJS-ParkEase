# Refresh Token Rotation Implementation

## Overview
ParkEase has implemented a secure refresh token rotation system using JWT with HTTP-only cookies and in-memory token storage.

## Architecture

### Token Management
- **Access Token**: 15-minute expiry, stored in memory only (via `secureFetch` module)
- **Refresh Token**: 7-day expiry, stored as HTTP-only secure cookie
- **User Info**: Stored in localStorage for session persistence

### Key Files

#### 1. **[src/lib/secureFetch.ts]** - Secure Fetch Wrapper
- Manages in-memory access token storage
- Attaches Bearer token to all requests automatically
- Intercepts 401 responses and attempts token refresh
- Prevents simultaneous refresh requests using `isRefreshing` flag
- Retries original request after successful token refresh
- One-time refresh attempt prevents infinite loops

#### 2. **[src/app/api/auth/refresh/route.ts]** - Token Refresh Endpoint
- POST endpoint validates refresh token from HTTP-only cookie
- Verifies JWT with `REFRESH_TOKEN_SECRET`
- Fetches fresh user data from database
- Generates new access token (15m expiry)
- Rotates refresh token and sets as new cookie
- Returns new access token in response body
- Returns 401 on token expiration or user not found

#### 3. **[src/context/AuthContext.tsx]** - Auth State Management
- Uses `setAccessToken()` and `getAccessToken()` from secureFetch
- Login stores user info in localStorage and access token in memory
- Logout clears both in-memory token and user data
- Session restoration checks in-memory token on app load
- All auth API calls include `credentials: 'include'` for cookie access

#### 4. **[src/hooks/useAuthFetcher.ts]** - SWR-Compatible Fetcher
- Wraps secureFetch for use with SWR
- Automatically attached to Authorization header by secureFetch
- No longer depends on `useAuth().token` (eliminates stale closure)
- Includes `credentials: 'include'` for cookie access

### Protected Routes Using secureFetch
All authenticated API calls have been migrated to use `secureFetch`:
- ✅ [src/app/(protected)/slots/[id]/page.tsx] - Slot details & bookings
- ✅ [src/app/(protected)/bookings/page.tsx] - Booking cancellation
- ✅ [src/app/(protected)/admin/page.tsx] - Slot management

## Request Flow

### Initial Login
```
1. User submits credentials to /api/auth/login
2. Server validates and responds with:
   - accessToken (in JSON body)
   - refreshToken (in HTTP-only cookie)
3. Client stores:
   - accessToken in memory via setAccessToken()
   - User info in localStorage
```

### API Request with Automatic Refresh
```
1. secureFetch(url, options) called
2. Access token attached to Authorization header
3. Request sent with credentials: 'include' (includes refresh token cookie)
4. If 200: Return response
5. If 401:
   a. Call POST /api/auth/refresh
   b. Server validates refresh token cookie
   c. Server issues new access token
   d. Server rotates refresh token cookie
   e. Client stores new access token in memory
   f. Retry original request with new token
6. If refresh fails: Redirect to /auth/login
```

### Logout
```
1. Client calls /api/auth/logout
2. Server clears refresh token cookie
3. Client clears in-memory token via setAccessToken(null)
4. Client clears localStorage
5. Redirect to /auth/login
```

## Security Features

✅ **HTTP-Only Cookies**: Refresh token cannot be accessed from JavaScript
✅ **Token Rotation**: New refresh token issued on each refresh endpoint call
✅ **In-Memory Storage**: Access token cleared on page reload (no persistent storage)
✅ **CSRF Protection**: SameSite=Strict on refresh token cookie
✅ **Single Refresh Attempt**: Prevents infinite loops on token expiration
✅ **Simultaneous Request Prevention**: Uses `isRefreshing` flag and promise queuing

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Valid token | Request succeeds |
| Expired access token | Automatic refresh and retry |
| Expired refresh token | Redirect to login |
| Invalid credentials | Redirect to login |
| Network error | Request fails (no automatic retry) |
| Token revoked | Redirect to login on refresh failure |

## Testing Checklist

- [ ] User login stores access token in memory
- [ ] User login stores user info in localStorage
- [ ] API calls attach Bearer token automatically
- [ ] Page refresh restores session from localStorage
- [ ] Access token is NOT stored in localStorage (secure)
- [ ] 401 response triggers automatic token refresh
- [ ] Refresh endpoint validates refresh token cookie
- [ ] After refresh, original request is retried with new token
- [ ] User is redirected to login on refresh failure
- [ ] Multiple simultaneous requests don't trigger multiple refreshes
- [ ] Logout clears all stored data

## Environment Variables Required

```
JWT_SECRET=<your-jwt-secret-for-access-tokens>
REFRESH_TOKEN_SECRET=<your-refresh-token-secret>
```

## Migration Notes

All existing `fetch()` calls to protected API endpoints have been replaced with `secureFetch()`.
This eliminates the need for manual token management in components.

### Before:
```typescript
const response = await fetch('/api/slots', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

### After:
```typescript
const response = await secureFetch('/api/slots', {
  credentials: 'include',
});
```

No manual token handling needed - secureFetch handles everything.
