/**
 * Secure fetch wrapper that:
 * 1. Attaches the access token to all requests
 * 2. Intercepts 401 responses and refreshes the token
 * 3. Retries the original request with the new token
 * 4. Fails after one refresh attempt to prevent infinite loops
 */

let accessToken: string | null = null;
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

async function refreshAccessToken(): Promise<string | null> {
  // Prevent multiple simultaneous refresh requests
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;

  refreshPromise = (async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
      });

      if (!response.ok) {
        // Refresh failed - let caller handle auth state
        setAccessToken(null);
        return null;
      }

      const data = (await response.json()) as { data?: { accessToken?: string } };
      const newToken = data.data?.accessToken;
      if (!newToken) {
        setAccessToken(null);
        return null;
      }
      setAccessToken(newToken);
      return newToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      setAccessToken(null);
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

interface SecureFetchOptions extends RequestInit {
  skipAuth?: boolean;
  retryOnUnauth?: boolean;
}

export async function secureFetch(
  url: string,
  options: SecureFetchOptions = {}
): Promise<Response> {
  const { skipAuth = false, retryOnUnauth = true, ...fetchOptions } = options;

  // Prepare headers
  const headers = new Headers(fetchOptions.headers);

  // If no token and auth is needed, try to refresh first
  if (!skipAuth && !accessToken && retryOnUnauth) {
    await refreshAccessToken();
    // If refresh succeeded, accessToken is now set
  }

  // Add authorization header if token exists and not skipped
  if (!skipAuth && accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  // Make the request
  let response = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: 'include', // Include cookies for refresh token
  });

  // If 401 and retry is enabled, try to refresh token
  if (response.status === 401 && retryOnUnauth && !skipAuth) {
    const newToken = await refreshAccessToken();

    if (newToken) {
      // Retry with new token
      const retryHeaders = new Headers(fetchOptions.headers);
      retryHeaders.set('Authorization', `Bearer ${newToken}`);

      response = await fetch(url, {
        ...fetchOptions,
        headers: retryHeaders,
        credentials: 'include',
      });
    }
  }

  return response;
}

export default secureFetch;
