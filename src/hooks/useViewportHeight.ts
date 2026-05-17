'use client';

import { useEffect, useState } from 'react';

const APP_HEIGHT_PROPERTY = '--app-height';

export function useViewportHeight() {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const updateAppHeight = () => {
      const nextHeight = window.innerHeight;
      document.documentElement.style.setProperty(APP_HEIGHT_PROPERTY, `${nextHeight}px`);
      setHeight((current) => (current === nextHeight ? current : nextHeight));
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

  return height;
}
