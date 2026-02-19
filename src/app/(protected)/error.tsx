'use client';

export default function ProtectedError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
      <div className="text-5xl mb-4">⚠️</div>
      <h2 className="text-2xl font-bold text-red-900 mb-2">Something went wrong</h2>
      <p className="text-red-700 mb-6">{error.message || 'An unexpected error occurred'}</p>
      <div className="flex gap-4 justify-center">
        <button
          onClick={() => (window.location.href = '/map')}
          className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition"
        >
          Go to Map
        </button>
        <button
          onClick={reset}
          className="bg-gray-300 text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-400 transition"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
