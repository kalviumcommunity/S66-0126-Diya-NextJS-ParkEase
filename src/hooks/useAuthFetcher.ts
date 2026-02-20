'use client';

import { useCallback } from 'react';
import { secureFetch } from '@/lib/secureFetch';

export function useAuthFetcher() {
  return useCallback(
    async (url: string) => {
      const response = await secureFetch(url, {
        credentials: 'include',
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error?.message || 'Request failed');
      }

      return data;
    },
    []
  );
}
