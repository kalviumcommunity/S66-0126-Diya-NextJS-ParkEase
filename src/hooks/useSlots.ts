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
  const { isLoading: authLoading } = useAuth();
  const fetcher = useAuthFetcher();
  const { data, error, isLoading, mutate } = useSWR('/api/slots', fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 3000, // Reduced from 15000 to allow faster updates after mutations
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
