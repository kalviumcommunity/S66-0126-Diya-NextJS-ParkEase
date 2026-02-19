'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';
import Header from './Header';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideHeader = pathname.startsWith('/auth');

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      {!hideHeader && <Header />}
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
