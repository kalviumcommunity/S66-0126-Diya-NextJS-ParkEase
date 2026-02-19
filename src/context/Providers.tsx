'use client';

import { AuthProvider } from './AuthContext';
import { UIProvider } from './UIContext';
import { ToastProvider } from './ToastContext';
import { ThemeProvider } from './ThemeContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UIProvider>
          <ToastProvider>{children}</ToastProvider>
        </UIProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
