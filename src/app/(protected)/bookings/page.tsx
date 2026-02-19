'use client';

import { useState } from 'react';
import { useBookings } from '@/hooks/useBookings';
import { mutate as globalMutate } from 'swr';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Modal from '@/components/ui/Modal';
import BookingsLoadingSkeleton from '@/components/ui/BookingsLoadingSkeleton';
import ErrorFallback from '@/components/ui/ErrorFallback';

export default function BookingsPage() {
  const { bookings, isLoading, error, mutate } = useBookings();
  const { token } = useAuth();
  const { success, error: toastError } = useToast();
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const canCancel = (status: string) =>
    status === 'PENDING' || status === 'CONFIRMED' || status === 'ACTIVE';

  const handleCancelBooking = async () => {
    if (!selectedBookingId) return;
    if (!token) {
      toastError('Please log in to cancel a booking.');
      return;
    }
    setIsCancelling(true);
    try {
      const response = await fetch(`/api/bookings/${selectedBookingId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 401) {
          toastError('Session expired. Please log in again.');
          return;
        }
        throw new Error(data.error?.message || 'Failed to cancel booking');
      }

      success('Booking cancelled successfully.');
      setSelectedBookingId(null);
      mutate();
      // Force immediate refetch of slots by setting revalidate: true
      globalMutate('/api/slots', undefined, { revalidate: true });
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to cancel booking');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return <BookingsLoadingSkeleton />;
  }

  if (error) {
    return (
      <ErrorFallback
        error={error}
        onRetry={() => mutate()}
        title="Error Loading Bookings"
        description="Failed to load your bookings. Please try again."
      />
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-400 mb-2">
          No Bookings Yet
        </h2>
        <p className="text-blue-700 dark:text-blue-300 mb-6">
          You haven't made any parking reservations yet.
        </p>
        <a
          href="/map"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Browse Available Spaces
        </a>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Bookings</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Manage and track your parking reservations
      </p>

      <div className="grid gap-4">
        {bookings.map((booking) => {
          try {
            // Safely parse dates
            const startDate = booking.startTime ? new Date(booking.startTime) : null;
            const endDate = booking.endTime ? new Date(booking.endTime) : null;

            // Calculate duration with safety check
            let durationHours = 0;
            if (startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
              durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
            }

            const pricePerHour = 5; // Default pricing
            const totalPrice = typeof durationHours === 'number' ? durationHours * pricePerHour : 0;

            return (
              <div
                key={booking.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-blue-600 dark:border-blue-500"
              >
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                      Slot {booking.slot?.row || 'N/A'}-{booking.slot?.column || 'N/A'}
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400 text-sm">
                          Start Time:
                        </span>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {booking.startTime ? formatDateTime(booking.startTime) : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400 text-sm">End Time:</span>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {booking.endTime ? formatDateTime(booking.endTime) : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400 text-sm">Duration:</span>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {typeof durationHours === 'number' ? durationHours.toFixed(1) : '0'} hours
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="mb-4">
                      <span
                        className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {booking.status}
                      </span>
                    </div>
                    {canCancel(booking.status) && (
                      <div className="mb-4">
                        <button
                          type="button"
                          onClick={() => setSelectedBookingId(booking.id)}
                          className="text-sm font-medium text-red-600 hover:text-red-700"
                        >
                          Cancel Booking
                        </button>
                      </div>
                    )}
                    <div className="mb-4">
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Total Price</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        ${typeof totalPrice === 'number' ? totalPrice.toFixed(2) : '0.00'}
                      </p>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                      Booked on{' '}
                      {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            );
          } catch (err) {
            console.error('Error rendering booking:', err, booking);
            return (
              <div key={booking.id} className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-red-700">Error displaying booking. Please try again.</p>
              </div>
            );
          }
        })}
      </div>
      <Modal
        isOpen={!!selectedBookingId}
        title="Cancel booking?"
        onClose={() => setSelectedBookingId(null)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setSelectedBookingId(null)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Keep Booking
            </button>
            <button
              type="button"
              onClick={handleCancelBooking}
              disabled={isCancelling}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:bg-gray-400"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Booking'}
            </button>
          </>
        }
      >
        <p>Are you sure you want to cancel this booking? This action cannot be undone.</p>
      </Modal>
    </div>
  );
}
