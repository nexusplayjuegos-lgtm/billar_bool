'use client';

import { useCallback } from 'react';
import { useViewportHeight } from '@/hooks';

function isStandaloneDisplay(): boolean {
  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || navigatorWithStandalone.standalone === true;
}

function isLowEndDevice(): boolean {
  const cores = window.navigator.hardwareConcurrency ?? 4;
  const deviceMemory = (window.navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  return cores <= 4 || deviceMemory <= 2;
}

export function AppViewport() {
  const handleViewportChange = useCallback(() => {
      document.documentElement.dataset.pwaStandalone = isStandaloneDisplay() ? 'true' : 'false';
      document.documentElement.dataset.lowEndDevice = isLowEndDevice() ? 'true' : 'false';
  }, []);

  useViewportHeight({ onChange: handleViewportChange });

  return null;
}
