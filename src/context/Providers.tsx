'use client';

import { AuthProvider } from './AuthContext';
import { UIProvider } from './UIContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <UIProvider>{children}</UIProvider>
    </AuthProvider>
  );
}
