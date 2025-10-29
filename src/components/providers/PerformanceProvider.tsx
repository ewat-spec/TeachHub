"use client";

import { useEffect } from 'react';
import { initializePerformanceTracking } from '@/lib/performance';

interface PerformanceProviderProps {
  children: React.ReactNode;
}

export function PerformanceProvider({ children }: PerformanceProviderProps) {
  useEffect(() => {
    // Only initialize performance tracking in production
    if (process.env.NODE_ENV === 'production') {
      const cleanup = initializePerformanceTracking();
      return cleanup;
    }
  }, []);

  return <>{children}</>;
}