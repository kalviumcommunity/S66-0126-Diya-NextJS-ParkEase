'use client';

export default function LoadingSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 sm:h-10 bg-gray-300 dark:bg-gray-700 rounded w-32 animate-pulse" />
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-48 animate-pulse" />
      </div>

      {/* Legend skeleton */}
      <div className="flex flex-wrap gap-4 sm:gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Grid skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 sm:p-6 border border-gray-200 dark:border-gray-700">
        <div className="space-y-2 sm:space-y-4 inline-block">
          {/* 5 rows of slots */}
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="flex gap-1 sm:gap-2 md:gap-4 items-center">
              {/* Row label skeleton */}
              <div className="h-4 sm:h-5 bg-gray-300 dark:bg-gray-700 rounded w-10 sm:w-12 animate-pulse" />
              {/* Slot buttons skeleton */}
              <div className="flex gap-1 sm:gap-2 flex-wrap sm:flex-nowrap">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((col) => (
                  <div
                    key={col}
                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gray-300 dark:bg-gray-700 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700 space-y-2"
          >
            <div className="h-8 sm:h-10 bg-gray-300 dark:bg-gray-700 rounded w-16 animate-pulse" />
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
