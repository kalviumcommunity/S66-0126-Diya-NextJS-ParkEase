'use client';

interface ErrorFallbackProps {
  error?: string | Error;
  onRetry?: () => void;
  title?: string;
  description?: string;
}

export default function ErrorFallback({
  error,
  onRetry,
  title = 'Something Went Wrong',
  description = 'An error occurred while loading the data. Please try again.',
}: ErrorFallbackProps) {
  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'Unknown error occurred';

  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 sm:p-8">
      <div className="flex gap-4">
        {/* Error icon */}
        <div className="flex-shrink-0">
          <svg
            className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 dark:text-red-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        {/* Error content */}
        <div className="flex-1">
          <h2 className="text-lg sm:text-xl font-bold text-red-900 dark:text-red-400 mb-2">
            {title}
          </h2>
          <p className="text-red-700 dark:text-red-300 text-sm sm:text-base mb-4">{description}</p>

          {/* Error details */}
          {errorMessage && (
            <details className="mb-4 cursor-pointer">
              <summary className="text-sm font-medium text-red-800 dark:text-red-200 hover:underline">
                Error Details
              </summary>
              <pre className="mt-2 text-xs text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40 p-2 rounded overflow-auto max-h-40">
                {errorMessage}
              </pre>
            </details>
          )}

          {/* Retry button */}
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 dark:bg-red-600 hover:bg-red-700 dark:hover:bg-red-700 text-white rounded-lg font-medium transition"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4 2a1 1 0 011 1v2.101a7 7 0 0111.601 2.566 1 1 0 11-1.885.666A5 5 0 005.999 5V3a1 1 0 01-1-1zm12 12a1 1 0 01-1 1h-2.101a7 7 0 01-11.601-2.566 1 1 0 11 1.885-.666A5 5 0 0014.001 15v2a1 1 0 001 1z"
                  clipRule="evenodd"
                />
              </svg>
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
