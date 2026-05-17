'use client';

import { useEffect } from 'react';

const APP_HEIGHT_PROPERTY = '--app-height';

export function useViewportHeight() {
  useEffect(() => {
    const updateAppHeight = () => {
      document.documentElement.style.setProperty(APP_HEIGHT_PROPERTY, `${window.innerHeight}px`);
    };

    updateAppHeight();

    window.addEventListener('resize', updateAppHeight);
    window.addEventListener('orientationchange', updateAppHeight);
    window.visualViewport?.addEventListener('resize', updateAppHeight);
    window.visualViewport?.addEventListener('scroll', updateAppHeight);

    return () => {
      window.removeEventListener('resize', updateAppHeight);
      window.removeEventListener('orientationchange', updateAppHeight);
      window.visualViewport?.removeEventListener('resize', updateAppHeight);
      window.visualViewport?.removeEventListener('scroll', updateAppHeight);
    };
  }, []);
}
