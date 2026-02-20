'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    setIsLoggedIn(!!user);
    setIsLoading(false);
  }, [authLoading, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-800 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-white">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl font-bold mb-6">Smart Parking Made Simple</h1>
            <p className="text-xl mb-8 text-blue-100">
              Find, book, and manage parking spaces in seconds. No more circling around looking for
              a spot.
            </p>
            {isLoggedIn ? (
              <Link
                href="/map"
                className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
              >
                View Parking Map →
              </Link>
            ) : (
              <div className="flex gap-4">
                <button
                  onClick={() => router.push('/auth/signup')}
                  className="bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
                >
                  Get Started Free
                </button>
                <button
                  onClick={() => router.push('/auth/login')}
                  className="bg-blue-500 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-400 transition border-2 border-white"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>

          <div className="bg-white bg-opacity-10 rounded-lg p-8 backdrop-blur-sm">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white bg-opacity-10 p-6 rounded-lg">
                <div className="text-3xl font-bold mb-2">50+</div>
                <div className="text-blue-100">Parking Spaces</div>
              </div>
              <div className="bg-white bg-opacity-10 p-6 rounded-lg">
                <div className="text-3xl font-bold mb-2">24/7</div>
                <div className="text-blue-100">Available</div>
              </div>
              <div className="bg-white bg-opacity-10 p-6 rounded-lg">
                <div className="text-3xl font-bold mb-2">Real-time</div>
                <div className="text-blue-100">Updates</div>
              </div>
              <div className="bg-white bg-opacity-10 p-6 rounded-lg">
                <div className="text-3xl font-bold mb-2">Instant</div>
                <div className="text-blue-100">Booking</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose ParkEase?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Find Instantly</h3>
              <p className="text-gray-600">
                See all available parking spaces in real-time on our interactive map.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl mb-4">⏱️</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Book Quickly</h3>
              <p className="text-gray-600">
                Reserve your spot in seconds with our streamlined booking process.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Manage Easily</h3>
              <p className="text-gray-600">
                View and manage all your bookings from a single dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
