'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ email?: string; role?: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload?.exp && Date.now() >= payload.exp * 1000) {
        localStorage.removeItem('accessToken');
        router.push('/auth/login');
        return;
      }
      setUser(payload);
    } catch {
      localStorage.removeItem('accessToken');
      router.push('/auth/login');
      return;
    }

    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            ParkEase
          </Link>
          <div className="flex gap-6 items-center">
            <Link href="/map" className="text-gray-600 hover:text-blue-600 font-medium">
              Parking Map
            </Link>
            <Link href="/bookings" className="text-gray-600 hover:text-blue-600 font-medium">
              My Bookings
            </Link>
            {user?.role === 'ADMIN' && (
              <Link href="/admin" className="text-gray-600 hover:text-blue-600 font-medium">
                Admin
              </Link>
            )}
            <div className="flex items-center gap-4 pl-6 border-l border-gray-200">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={() => {
                  localStorage.removeItem('accessToken');
                  localStorage.removeItem('refreshToken');
                  router.push('/');
                }}
                className="text-red-600 hover:text-red-700 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
