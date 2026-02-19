'use client';

export default function BookingsLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="space-y-2 mb-6">
        <div className="h-8 sm:h-10 bg-gray-300 dark:bg-gray-700 rounded w-40 animate-pulse" />
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-56 animate-pulse" />
      </div>

      {/* Booking cards skeleton */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-blue-600 dark:border-blue-500"
        >
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left side */}
            <div>
              <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-32 mb-4 animate-pulse" />
              <div className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <div key={j}>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20 mb-1 animate-pulse" />
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-40 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>

            {/* Right side */}
            <div className="text-right space-y-3">
              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-24 ml-auto mb-4 animate-pulse" />
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-32 ml-auto animate-pulse" />
              <div className="space-y-1">
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-32 ml-auto animate-pulse" />
                <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-40 ml-auto animate-pulse" />
              </div>
              <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-48 ml-auto animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
