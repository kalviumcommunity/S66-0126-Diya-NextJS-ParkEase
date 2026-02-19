'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

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

const TOKEN_KEY = 'accessToken';
const USER_KEY = 'authUser';

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

  const loadFromStorage = useCallback(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    const decoded = decodeToken(token);
    if (!decoded) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('refreshToken');
      localStorage.removeItem(USER_KEY);
      setToken(null);
      setUser(null);
      setIsLoading(false);
      return;
    }

    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload?.exp && Date.now() >= payload.exp * 1000) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('refreshToken');
      localStorage.removeItem(USER_KEY);
      setToken(null);
      setUser(null);
      setIsLoading(false);
      return;
    }

    const storedUser = localStorage.getItem(USER_KEY);
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as AuthUser;
        setUser({ ...decoded, name: parsed.name });
      } catch {
        setUser(decoded);
      }
    } else {
      setUser(decoded);
    }
    setToken(token);
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
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Login failed');
    }

    const accessToken = data.data?.accessToken as string | undefined;
    const userInfo = data.data?.user as AuthUser | undefined;

    if (!accessToken || !userInfo) {
      throw new Error('Login failed');
    }

    localStorage.setItem(TOKEN_KEY, accessToken);
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
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('refreshToken');
    localStorage.removeItem(USER_KEY);
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
