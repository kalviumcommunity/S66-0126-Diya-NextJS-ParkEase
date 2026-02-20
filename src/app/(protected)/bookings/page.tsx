'use client';

import { useState } from 'react';
import { useBookings } from '@/hooks/useBookings';
import { mutate as globalMutate } from 'swr';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { secureFetch } from '@/lib/secureFetch';
import Modal from '@/components/ui/Modal';
import BookingsLoadingSkeleton from '@/components/ui/BookingsLoadingSkeleton';
import ErrorFallback from '@/components/ui/ErrorFallback';

export default function BookingsPage() {
  const { bookings, isLoading, error, mutate } = useBookings();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'CONFIRMED':
      case 'PENDING':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const isBookingInPast = (endTime: string): boolean => {
    return new Date(endTime) < new Date();
  };

  const canCancel = (status: string) =>
    status === 'PENDING' || status === 'CONFIRMED' || status === 'ACTIVE';

  const handleCancelBooking = async () => {
    if (!selectedBookingId) return;
    if (!user) {
      toastError('Please log in to cancel a booking.');
      return;
    }
    setIsCancelling(true);
    try {
      const response = await secureFetch(`/api/bookings/${selectedBookingId}`, {
        method: 'DELETE',
        credentials: 'include',
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

  // Separate bookings into upcoming and past
  const upcomingBookings = bookings.filter((b) => !isBookingInPast(b.endTime));
  const pastBookings = bookings.filter((b) => isBookingInPast(b.endTime));

  const BookingCard = ({
    booking,
    isPast = false,
  }: {
    booking: typeof bookings[0];
    isPast?: boolean;
  }) => {
    try {
      const startDate = booking.startTime ? new Date(booking.startTime) : null;
      const endDate = booking.endTime ? new Date(booking.endTime) : null;

      let durationHours = 0;
      if (startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
      }

      const pricePerHour = 5;
      const totalPrice = typeof durationHours === 'number' ? durationHours * pricePerHour : 0;

      return (
        <div
          className={`rounded-lg shadow-md p-6 border-l-4 transition ${
            isPast
              ? 'bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 opacity-75'
              : 'bg-white dark:bg-gray-800 border-green-500 dark:border-green-600 hover:shadow-lg'
          }`}
        >
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Slot {booking.slot?.row || 'N/A'}-{booking.slot?.column || 'N/A'}
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Start Time:</span>
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
                    booking.status || 'COMPLETED'
                  )}`}
                >
                  {booking.status || 'COMPLETED'}
                </span>
              </div>
              {!isPast && canCancel(booking.status) && (
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => setSelectedBookingId(booking.id)}
                    className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Cancel Booking
                  </button>
                </div>
              )}
              <div>
                <span className="text-gray-600 dark:text-gray-400 text-sm">Total Price:</span>
                <p
                  className={`text-2xl font-bold ${
                    isPast ? 'text-gray-600 dark:text-gray-400' : 'text-green-600 dark:text-green-400'
                  }`}
                >
                  ${totalPrice.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    } catch {
      return null;
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Bookings</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Manage and track your parking reservations
      </p>

      {/* UPCOMING BOOKINGS SECTION */}
      {upcomingBookings.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
            Upcoming Bookings
          </h2>
          <div className="grid gap-4">
            {upcomingBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} isPast={false} />
            ))}
          </div>
        </div>
      )}

      {/* PAST BOOKINGS SECTION */}
      {pastBookings.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="w-2 h-2 bg-gray-400 rounded-full mr-3"></span>
            Past Bookings
          </h2>
          <div className="grid gap-4">
            {pastBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} isPast={true} />
            ))}
          </div>
        </div>
      )}

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
