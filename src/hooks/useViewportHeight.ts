'use client';

import { useEffect, useState } from 'react';

const APP_HEIGHT_PROPERTY = '--app-height';

interface UseViewportHeightOptions {
  onChange?: (height: number) => void;
}

function getViewportHeight(): number {
  return Math.round(window.visualViewport?.height ?? window.innerHeight);
}

export function useViewportHeight(options: UseViewportHeightOptions = {}) {
  const [height, setHeight] = useState(0);
  const onChange = options.onChange;

  useEffect(() => {
    let frameId: number | null = null;

    const updateAppHeight = () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }

      frameId = window.requestAnimationFrame(() => {
        const nextHeight = getViewportHeight();
        document.documentElement.style.setProperty(APP_HEIGHT_PROPERTY, `${nextHeight}px`);
        document.body.style.setProperty(APP_HEIGHT_PROPERTY, `${nextHeight}px`);
        setHeight((current) => (current === nextHeight ? current : nextHeight));
        onChange?.(nextHeight);
        frameId = null;
      });
    };

    updateAppHeight();

    window.addEventListener('resize', updateAppHeight);
    window.addEventListener('orientationchange', updateAppHeight);
    window.visualViewport?.addEventListener('resize', updateAppHeight);
    window.visualViewport?.addEventListener('scroll', updateAppHeight);

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener('resize', updateAppHeight);
      window.removeEventListener('orientationchange', updateAppHeight);
      window.visualViewport?.removeEventListener('resize', updateAppHeight);
      window.visualViewport?.removeEventListener('scroll', updateAppHeight);
    };
  }, [onChange]);

  return height;
}
