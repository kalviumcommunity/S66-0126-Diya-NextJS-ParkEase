'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';
import Header from './Header';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideHeader = pathname.startsWith('/auth');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {!hideHeader && <Header />}
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
