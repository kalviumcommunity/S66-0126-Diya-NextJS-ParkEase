'use client';

import { AuthProvider } from './AuthContext';
import { UIProvider } from './UIContext';
import { ToastProvider } from './ToastContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <UIProvider>
        <ToastProvider>{children}</ToastProvider>
      </UIProvider>
    </AuthProvider>
  );
}
