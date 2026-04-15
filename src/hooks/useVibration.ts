'use client';

import { useCallback } from 'react';

export function useVibration() {
  const vibrate = useCallback((pattern: number | number[] = 50) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }, []);

  const vibrateLight = useCallback(() => {
    vibrate(20);
  }, [vibrate]);

  const vibrateMedium = useCallback(() => {
    vibrate(50);
  }, [vibrate]);

  const vibrateHeavy = useCallback(() => {
    vibrate([50, 30, 50]);
  }, [vibrate]);

  return { vibrate, vibrateLight, vibrateMedium, vibrateHeavy };
}
