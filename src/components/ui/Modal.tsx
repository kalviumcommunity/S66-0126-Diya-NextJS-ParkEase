'use client';

import { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  title?: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
}

export default function Modal({ isOpen, title, children, onClose, footer }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
        aria-label="Close modal"
      />
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          {title && <h2 className="text-xl font-bold text-gray-900">{title}</h2>}
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        <div className="text-gray-700">{children}</div>
        {footer && <div className="mt-6 flex gap-3 justify-end">{footer}</div>}
      </div>
    </div>
  );
}
