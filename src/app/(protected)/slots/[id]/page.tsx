'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Slot {
  id: string;
  row: number;
  column: number;
  status: string;
  pricePerHour: number;
}

export default function SlotDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [slot, setSlot] = useState<Slot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSlot = async () => {
      try {
        const response = await fetch(`/api/slots/${params.id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch slot details');
        const data = await response.json();
        setSlot(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSlot();
  }, [params.id]);

  const calculatePrice = () => {
    if (!startTime || !endTime || !slot) return 0;
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const hours = (end - start) / (1000 * 60 * 60);
    return hours > 0 ? hours * slot.pricePerHour : 0;
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);

    if (!startTime || !endTime) {
      setBookingError('Please select both start and end times');
      return;
    }

    if (new Date(startTime) >= new Date(endTime)) {
      setBookingError('End time must be after start time');
      return;
    }

    setIsBooking(true);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          slotId: params.id,
          startTime,
          endTime,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create booking');
      }

      router.push('/bookings?success=Booking created successfully!');
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsBooking(false);
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
              <p className="text-gray-900 font-bold text-lg">${slot.pricePerHour.toFixed(2)}</p>
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

          <form onSubmit={handleBooking} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                min={startTime || new Date().toISOString().slice(0, 16)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            {startTime && endTime && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-bold text-gray-900">
                    {(
                      (new Date(endTime).getTime() - new Date(startTime).getTime()) /
                      (1000 * 60 * 60)
                    ).toFixed(1)}{' '}
                    hours
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-300">
                  <span className="text-gray-600">Total Price</span>
                  <span className="text-2xl font-bold text-gray-900">
                    ${calculatePrice().toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {bookingError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                {bookingError}
              </div>
            )}

            <button
              type="submit"
              disabled={isBooking || !startTime || !endTime}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isBooking ? 'Creating Booking...' : 'Confirm Booking'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
