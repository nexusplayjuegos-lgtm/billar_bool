'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { markFirstSeenAndTrackRetention } from '@/lib/analytics/analytics';

interface AnalyticsProviderProps {
  measurementId?: string;
}

export function AnalyticsProvider({ measurementId }: AnalyticsProviderProps) {
  const pathname = usePathname();

  useEffect(() => {
    markFirstSeenAndTrackRetention();
  }, []);

  useEffect(() => {
    if (!measurementId || typeof window === 'undefined' || !window.gtag) return;
    const query = window.location.search.replace(/^\?/, '');
    window.gtag('config', measurementId, {
      page_path: query ? `${pathname}?${query}` : pathname,
    });
  }, [measurementId, pathname]);

  return null;
}
