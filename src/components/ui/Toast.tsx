'use client';

import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
  onDismiss: (id: string) => void;
}

const typeStyles: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

export default function Toast({ id, type, message, duration, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  return (
    <div
      className={`pointer-events-auto w-full sm:w-96 border rounded-lg px-4 py-3 shadow-lg flex items-start justify-between gap-3 ${
        typeStyles[type]
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="text-sm font-medium">{message}</div>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        className="text-xs font-semibold uppercase tracking-wide opacity-70 hover:opacity-100"
      >
        Close
      </button>
    </div>
  );
}
