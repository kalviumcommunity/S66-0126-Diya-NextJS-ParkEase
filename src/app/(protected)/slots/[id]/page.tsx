'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, use } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { secureFetch } from '@/lib/secureFetch';

interface Slot {
  id: string;
  row: number;
  column: number;
  status: string;
  pricePerHour: number;
}

const bookingSchema = z
  .object({
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
  })
  .refine((values) => new Date(values.endTime).getTime() > new Date(values.startTime).getTime(), {
    path: ['endTime'],
    message: 'End time must be after start time',
  });

type BookingFormValues = z.infer<typeof bookingSchema>;

export default function SlotDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [slot, setSlot] = useState<Slot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      startTime: '',
      endTime: '',
    },
  });

  const startTime = watch('startTime');
  const endTime = watch('endTime');

  useEffect(() => {
    const fetchSlot = async () => {
      try {
        const response = await secureFetch(`/api/slots/${id}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error?.message || `Failed to fetch slot details (${response.status})`
          );
        }
        const data = await response.json();
        setSlot(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSlot();
  }, [id]);

  const { durationHours, totalPrice } = useMemo(() => {
    if (!startTime || !endTime || !slot) {
      return { durationHours: 0, totalPrice: 0 };
    }
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const hours = (end - start) / (1000 * 60 * 60);
    const pricePerHour = typeof slot?.pricePerHour === 'number' ? slot.pricePerHour : 5;
    return {
      durationHours: hours > 0 ? hours : 0,
      totalPrice: hours > 0 ? hours * pricePerHour : 0,
    };
  }, [startTime, endTime, slot]);

  const onSubmit = async (values: BookingFormValues) => {
    if (!user) {
      toastError('Please log in to book a slot.');
      router.push('/auth/login');
      return;
    }
    try {
      const startIso = new Date(values.startTime).toISOString();
      const endIso = new Date(values.endTime).toISOString();

      const response = await secureFetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slotId: id,
          startTime: startIso,
          endTime: endIso,
        }),
        credentials: 'include',
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create booking');
      }
      success('Booking created successfully!');
      router.push('/bookings');
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading slot details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <h2 className="text-xl font-bold text-red-900 mb-2">Error Loading Slot</h2>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!slot) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Slot Not Found</h2>
        <p className="text-gray-700">The parking slot you're looking for doesn't exist.</p>
      </div>
    );
  }

  if (slot.status !== 'AVAILABLE') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <h2 className="text-xl font-bold text-yellow-900 mb-2">Slot Not Available</h2>
        <p className="text-yellow-700 mb-6">
          This parking space is currently {slot.status.toLowerCase()}.
        </p>
        <a
          href="/map"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Browse Other Spaces
        </a>
      </div>
    );
  }

  return (
    <div>
      <a href="/map" className="text-blue-600 hover:text-blue-700 font-medium mb-6 inline-block">
        ← Back to Map
      </a>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Slot Info */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Parking Slot {slot.row}-{slot.column}
          </h1>

          <div className="space-y-4 mb-8">
            <div>
              <span className="text-gray-600 text-sm">Location</span>
              <p className="text-gray-900 font-bold text-lg">
                Row {slot.row}, Column {slot.column}
              </p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Status</span>
              <p className="text-green-600 font-bold text-lg">Available</p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Price per Hour</span>
              <p className="text-gray-900 font-bold text-lg">
                ${typeof slot?.pricePerHour === 'number' ? slot.pricePerHour.toFixed(2) : '0.00'}
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-700 text-sm">
              ✓ Real-time availability check
              <br />✓ Instant confirmation
              <br />✓ Flexible booking times
            </p>
          </div>
        </div>

        {/* Booking Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Make a Reservation</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
              <input
                type="datetime-local"
                {...register('startTime')}
                required
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
              {errors.startTime && (
                <p className="text-sm text-red-600 mt-1">{errors.startTime.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
              <input
                type="datetime-local"
                {...register('endTime')}
                required
                min={startTime || new Date().toISOString().slice(0, 16)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
              {errors.endTime && (
                <p className="text-sm text-red-600 mt-1">{errors.endTime.message}</p>
              )}
            </div>

            {startTime && endTime && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-bold text-gray-900">{durationHours.toFixed(1)} hours</span>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-300">
                  <span className="text-gray-600">Total Price</span>
                  <span className="text-2xl font-bold text-gray-900">${totalPrice.toFixed(2)}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !startTime || !endTime}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating Booking...' : 'Confirm Booking'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
