'use client';

import React, { ReactNode } from 'react';
import ErrorFallback from './ErrorFallback';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: { componentStack: string }) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    this.props.onError?.(error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback ? (
        this.props.fallback(this.state.error, this.retry)
      ) : (
        <ErrorFallback error={this.state.error} onRetry={this.retry} />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
