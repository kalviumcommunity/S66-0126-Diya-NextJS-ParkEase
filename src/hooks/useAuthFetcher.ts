'use client';

import { useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

export function useAuthFetcher() {
  const { token } = useAuth();

  return useCallback(
    async (url: string) => {
      if (!token) {
        throw new Error('Unauthorized');
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error?.message || 'Request failed');
      }

      return data;
    },
    [token]
  );
}
