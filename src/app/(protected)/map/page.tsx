'use client';

import Link from 'next/link';
import { useSlots, type ParkingSlot } from '@/hooks/useSlots';

export default function MapPage() {
  const { slots, isLoading, error } = useSlots();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading parking spaces...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <h2 className="text-xl font-bold text-red-900 mb-2">Error Loading Parking Spaces</h2>
        <p className="text-red-700">
          {error instanceof Error ? error.message : 'An error occurred'}
        </p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-blue-900 mb-2">No Parking Spaces Found</h2>
        <p className="text-blue-700">Please check back later.</p>
      </div>
    );
  }

  // Group slots by row
  const slotsByRow = slots.reduce(
    (acc, slot) => {
      if (!acc[slot.row]) acc[slot.row] = [];
      acc[slot.row].push(slot);
      return acc;
    },
    {} as Record<number, ParkingSlot[]>
  );

  const getSlotColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-500 hover:bg-green-600 cursor-pointer';
      case 'OCCUPIED':
        return 'bg-red-500 cursor-not-allowed';
      case 'RESERVED':
        return 'bg-yellow-500 cursor-not-allowed';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Parking Map</h1>
        <p className="text-gray-600">Click on any available space to book it</p>
      </div>

      {/* Legend */}
      <div className="mb-8 flex gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-green-500 rounded"></div>
          <span className="text-gray-700">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-red-500 rounded"></div>
          <span className="text-gray-700">Occupied</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-yellow-500 rounded"></div>
          <span className="text-gray-700">Reserved</span>
        </div>
      </div>

      {/* Parking Grid */}
      <div className="bg-white rounded-lg shadow-lg p-8 overflow-x-auto">
        <div className="space-y-4 inline-block">
          {Object.keys(slotsByRow)
            .sort((a, b) => Number(a) - Number(b))
            .map((row) => (
              <div key={row} className="flex gap-4 items-center">
                <span className="text-gray-600 font-bold w-8">Row {row}</span>
                <div className="flex gap-2">
                  {slotsByRow[Number(row)]
                    .sort((a, b) => a.column - b.column)
                    .map((slot) => (
                      <div key={slot.id}>
                        {slot.status === 'AVAILABLE' ? (
                          <Link href={`/slots/${slot.id}`}>
                            <button
                              className={`w-12 h-12 rounded-lg font-bold text-white transition ${getSlotColor(
                                slot.status
                              )}`}
                              title={`Slot ${slot.row}-${slot.column}`}
                            >
                              {slot.column}
                            </button>
                          </Link>
                        ) : (
                          <button
                            disabled
                            className={`w-12 h-12 rounded-lg font-bold text-white transition ${getSlotColor(
                              slot.status
                            )}`}
                            title={`Slot ${slot.row}-${slot.column} - ${slot.status}`}
                          >
                            {slot.column}
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {slots.filter((s) => s.status === 'AVAILABLE').length}
          </div>
          <p className="text-gray-600">Available Spaces</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-red-600 mb-2">
            {slots.filter((s) => s.status === 'OCCUPIED').length}
          </div>
          <p className="text-gray-600">Occupied</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-yellow-600 mb-2">
            {slots.filter((s) => s.status === 'RESERVED').length}
          </div>
          <p className="text-gray-600">Reserved</p>
        </div>
      </div>
    </div>
  );
}
