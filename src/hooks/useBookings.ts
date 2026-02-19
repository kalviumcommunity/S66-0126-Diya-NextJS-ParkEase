'use client';

import { useMemo } from 'react';
import useSWR from 'swr';
import { useAuth } from '@/context/AuthContext';
import { useAuthFetcher } from './useAuthFetcher';

export interface Booking {
  id: string;
  slotId: string;
  slot?: {
    id?: string;
    row: number;
    column: number;
    status?: string;
  };
  startTime: string;
  endTime: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'CONFIRMED' | 'PENDING';
  createdAt: string;
}

export function useBookings() {
  const { token, isLoading: authLoading } = useAuth();
  const fetcher = useAuthFetcher();
  const { data, error, isLoading, mutate } = useSWR(token ? '/api/bookings' : null, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 15000,
    keepPreviousData: true,
  });

  const bookings = useMemo<Booking[]>(() => data?.data?.items || [], [data]);

  return {
    bookings,
    isLoading: authLoading || isLoading,
    error,
    mutate,
  };
}

export function useBooking(id?: string) {
  const { token, isLoading: authLoading } = useAuth();
  const fetcher = useAuthFetcher();
  const { data, error, isLoading, mutate } = useSWR(
    token && id ? `/api/bookings/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
    }
  );

  const booking = useMemo<Booking | null>(() => data?.data || null, [data]);

  return {
    booking,
    isLoading: authLoading || isLoading,
    error,
    mutate,
  };
}
