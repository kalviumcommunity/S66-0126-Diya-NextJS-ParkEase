'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { setAccessToken, getAccessToken } from '@/lib/secureFetch';

export interface AuthUser {
  userId: string;
  email: string;
  role: 'USER' | 'ADMIN';
  name?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_KEY = 'authUser';

function normalizeStoredUser(raw: unknown): AuthUser | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const userId = (record.userId as string | undefined) || (record.id as string | undefined);
  const email = record.email as string | undefined;
  const role = record.role as 'USER' | 'ADMIN' | undefined;
  const name = record.name as string | undefined;

  if (!userId || !email || !role) return null;
  return { userId, email, role, name };
}

function decodeToken(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload?.userId || !payload?.email || !payload?.role) return null;
    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    } as AuthUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadFromStorage = useCallback(async () => {
    // Load user info from localStorage (access token is in-memory only)
    const storedUserRaw = localStorage.getItem(USER_KEY);
    const inMemoryToken = getAccessToken();
    let storedUser: AuthUser | null = null;
    if (storedUserRaw) {
      try {
        storedUser = normalizeStoredUser(JSON.parse(storedUserRaw));
      } catch {
        storedUser = null;
      }
    }

    if (!storedUser) {
      setToken(null);
      setUser(null);
      setIsLoading(false);
      return;
    }

    // Case 1: We have a token in memory and stored user - validate token
    if (inMemoryToken) {
      const decoded = decodeToken(inMemoryToken);
      if (!decoded) {
        localStorage.removeItem(USER_KEY);
        setAccessToken(null);
        setToken(null);
        setUser(null);
        setIsLoading(false);
        return;
      }

      const payload = JSON.parse(atob(inMemoryToken.split('.')[1]));
      if (payload?.exp && Date.now() >= payload.exp * 1000) {
        localStorage.removeItem(USER_KEY);
        setAccessToken(null);
        setToken(null);
        setUser(null);
        setIsLoading(false);
        return;
      }

      setUser({ ...decoded, name: storedUser.name });
      setToken(inMemoryToken);
      setIsLoading(false);
      return;
    }

    // Case 2: No in-memory token but stored user exists - must refresh
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = (await response.json()) as { data?: { accessToken?: string } };
        const newToken = data.data?.accessToken as string | undefined;
        if (newToken) {
          setAccessToken(newToken);
          const decoded = decodeToken(newToken);
          if (decoded) {
            setUser({ ...decoded, name: storedUser.name });
            setToken(newToken);
            setIsLoading(false);
            return;
          }
        }
      }
    } catch {
      // fall through to logout
    }

    // Refresh failed or token invalid
    localStorage.removeItem(USER_KEY);
    setAccessToken(null);
    setToken(null);
    setUser(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include', // Include cookies
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Login failed');
    }

    const accessToken = data.data?.accessToken as string | undefined;
    const userInfoRaw = data.data?.user as { id?: string; userId?: string; email?: string; role?: 'USER' | 'ADMIN'; name?: string } | undefined;
    const userInfo = userInfoRaw ? normalizeStoredUser(userInfoRaw) : null;

    if (!accessToken || !userInfo) {
      throw new Error('Login failed');
    }

    // Store token in memory and in secureFetch
    setAccessToken(accessToken);
    // Store user info in localStorage
    localStorage.setItem(USER_KEY, JSON.stringify(userInfo));
    setToken(accessToken);
    setUser(userInfo);
    setIsLoading(false);
  }, []);

  const signup = useCallback(
    async (email: string, password: string, name: string) => {
      setIsLoading(true);
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Signup failed');
      }

      await login(email, password);
    },
    [login]
  );

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // ignore
    }
    localStorage.removeItem(USER_KEY);
    setAccessToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      login,
      signup,
      logout,
    }),
    [user, token, isLoading, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
