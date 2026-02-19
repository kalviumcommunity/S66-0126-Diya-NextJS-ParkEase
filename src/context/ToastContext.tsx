'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import Toast, { ToastType } from '@/components/ui/Toast';

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

interface ToastContextValue {
  addToast: (type: ToastType, message: string, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const DEFAULT_DURATION = 3500;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string, duration = DEFAULT_DURATION) => {
    setToasts((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, type, message, duration },
    ]);
  }, []);

  const value = useMemo(
    () => ({
      addToast,
      success: (message: string, duration?: number) => addToast('success', message, duration),
      error: (message: string, duration?: number) => addToast('error', message, duration),
      info: (message: string, duration?: number) => addToast('info', message, duration),
    }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[60] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onDismiss={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
