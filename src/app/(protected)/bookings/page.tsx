'use client';

import { useEffect, useState } from 'react';

interface Booking {
  id: string;
  slotId: string;
  slot?: {
    row: number;
    column: number;
  };
  startTime: string;
  endTime: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'CONFIRMED' | 'PENDING';
  createdAt: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch('/api/bookings', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch bookings');
        const data = await response.json();
        setBookings(data.data?.items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, []);

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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading your bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <h2 className="text-xl font-bold text-red-900 mb-2">Error Loading Bookings</h2>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-blue-900 mb-2">No Bookings Yet</h2>
        <p className="text-blue-700 mb-6">You haven't made any parking reservations yet.</p>
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
      <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
      <p className="text-gray-600 mb-8">Manage and track your parking reservations</p>

      <div className="grid gap-4">
        {bookings.map((booking) => {
          const startDate = new Date(booking.startTime);
          const endDate = new Date(booking.endTime);
          const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
          const pricePerHour = 5; // Default pricing
          const totalPrice = durationHours * pricePerHour;

          return (
            <div
              key={booking.id}
              className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600"
            >
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Slot {booking.slot?.row}-{booking.slot?.column}
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-gray-600 text-sm">Start Time:</span>
                      <p className="text-gray-900 font-medium">
                        {formatDateTime(booking.startTime)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm">End Time:</span>
                      <p className="text-gray-900 font-medium">{formatDateTime(booking.endTime)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm">Duration:</span>
                      <p className="text-gray-900 font-medium">{durationHours.toFixed(1)} hours</p>
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
                  <div className="mb-4">
                    <p className="text-gray-600 text-sm">Total Price</p>
                    <p className="text-3xl font-bold text-gray-900">${totalPrice.toFixed(2)}</p>
                  </div>
                  <p className="text-gray-500 text-xs">
                    Booked on {new Date(booking.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
