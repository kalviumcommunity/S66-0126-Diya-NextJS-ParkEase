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
          <p className="text-gray-700 dark:text-gray-300">Loading parking spaces...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
        <h2 className="text-xl font-bold text-red-900 dark:text-red-400 mb-2">
          Error Loading Parking Spaces
        </h2>
        <p className="text-red-700 dark:text-red-300">
          {error instanceof Error ? error.message : 'An error occurred'}
        </p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-400 mb-2">
          No Parking Spaces Found
        </h2>
        <p className="text-blue-700 dark:text-blue-300">Please check back later.</p>
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
        return 'bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700 cursor-pointer';
      case 'OCCUPIED':
        return 'bg-red-500 dark:bg-red-600 cursor-not-allowed';
      case 'RESERVED':
        return 'bg-yellow-500 dark:bg-yellow-600 cursor-not-allowed';
      default:
        return 'bg-gray-400 dark:bg-gray-600';
    }
  };

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Parking Map
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
          Click on any available space to book it
        </p>
      </div>

      {/* Legend */}
      <div className="mb-6 sm:mb-8 flex flex-wrap gap-4 sm:gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-green-500 rounded"></div>
          <span className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-red-500 rounded"></div>
          <span className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">Occupied</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-yellow-500 rounded"></div>
          <span className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">Reserved</span>
        </div>
      </div>

      {/* Parking Grid - Responsive */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 sm:p-6 overflow-x-auto border border-gray-200 dark:border-gray-700">
        <div className="space-y-2 sm:space-y-4 inline-block min-w-full">
          {Object.keys(slotsByRow)
            .sort((a, b) => Number(a) - Number(b))
            .map((row) => (
              <div key={row} className="flex gap-1 sm:gap-2 md:gap-4 items-center">
                {/* Row Label - Hidden on very small screens */}
                <span className="text-gray-600 dark:text-gray-400 font-bold w-10 sm:w-12 text-xs sm:text-sm">
                  Row {row}
                </span>
                {/* Slots Grid */}
                <div className="flex gap-1 sm:gap-2 flex-wrap sm:flex-nowrap">
                  {slotsByRow[Number(row)]
                    .sort((a, b) => a.column - b.column)
                    .map((slot) => (
                      <div key={slot.id}>
                        {slot.status === 'AVAILABLE' ? (
                          <Link href={`/slots/${slot.id}`}>
                            <button
                              className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg font-bold text-white text-xs sm:text-sm transition ${getSlotColor(
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
                            className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg font-bold text-white text-xs sm:text-sm transition ${getSlotColor(
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

      {/* Stats - Responsive Grid */}
      <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 text-center border border-gray-200 dark:border-gray-700">
          <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
            {slots.filter((s) => s.status === 'AVAILABLE').length}
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Available Spaces</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 text-center border border-gray-200 dark:border-gray-700">
          <div className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
            {slots.filter((s) => s.status === 'OCCUPIED').length}
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Occupied</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 text-center border border-gray-200 dark:border-gray-700">
          <div className="text-2xl sm:text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
            {slots.filter((s) => s.status === 'RESERVED').length}
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Reserved</p>
        </div>
      </div>
    </div>
  );
}
