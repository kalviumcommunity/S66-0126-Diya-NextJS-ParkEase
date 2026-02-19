'use client';

import { useMemo } from 'react';
import useSWR from 'swr';
import { useAuth } from '@/context/AuthContext';
import { useAuthFetcher } from './useAuthFetcher';

export interface ParkingSlot {
  id: string;
  row: number;
  column: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
  pricePerHour?: number;
}

export function useSlots() {
  const { token, isLoading: authLoading } = useAuth();
  const fetcher = useAuthFetcher();
  const { data, error, isLoading, mutate } = useSWR(token ? '/api/slots' : null, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 15000,
    keepPreviousData: true,
  });

  const slots = useMemo<ParkingSlot[]>(() => data?.data?.items || [], [data]);

  return {
    slots,
    isLoading: authLoading || isLoading,
    error,
    mutate,
  };
}
