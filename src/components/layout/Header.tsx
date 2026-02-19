'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface UserInfo {
  email?: string;
  role?: string;
}

export default function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload?.exp && Date.now() >= payload.exp * 1000) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
        return;
      }
      setUser(payload);
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  }, [pathname]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const links = [
    { href: '/', label: 'Home' },
    { href: '/map', label: 'Parking Map' },
    { href: '/bookings', label: 'My Bookings' },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            ParkEase
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <nav className="flex items-center gap-6">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`font-medium transition ${
                    pathname === link.href ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {user?.role === 'ADMIN' && (
                <Link href="/admin" className="font-medium text-gray-600 hover:text-blue-600">
                  Admin
                </Link>
              )}
            </nav>

            <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
              {user?.email ? (
                <span className="text-sm text-gray-600">{user.email}</span>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="text-sm font-medium text-gray-600 hover:text-blue-600"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition"
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-4 space-y-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block font-medium ${
                  pathname === link.href ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user?.role === 'ADMIN' && (
              <Link href="/admin" className="block font-medium text-gray-700 hover:text-blue-600">
                Admin
              </Link>
            )}

            <div className="pt-3 border-t border-gray-100">
              {user?.email ? (
                <span className="block text-sm text-gray-600">Signed in as {user.email}</span>
              ) : (
                <div className="flex items-center gap-4">
                  <Link href="/auth/login" className="text-sm font-medium text-gray-600">
                    Log In
                  </Link>
                  <Link href="/auth/signup" className="text-sm font-semibold text-blue-600">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
