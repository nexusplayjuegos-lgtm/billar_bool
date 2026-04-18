'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface ViewportDimensions {
  width: number;
  height: number;
}

export function useImmersiveMatch() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<ViewportDimensions>({
    width: 0,
    height: 0,
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const enteredRef = useRef(false);

  const updateDimensions = useCallback(() => {
    const vv = (window as unknown as { visualViewport?: { width: number; height: number } }).visualViewport;
    if (vv) {
      setDimensions({ width: vv.width, height: vv.height });
    } else {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    }
  }, []);

  const enterImmersive = useCallback(async () => {
    if (enteredRef.current) return;
    enteredRef.current = true;

    const el = containerRef.current;
    if (!el) return;

    try {
      const requestFS =
        (el as unknown as { requestFullscreen?: () => Promise<void> }).requestFullscreen ||
        (el as unknown as { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen ||
        (el as unknown as { msRequestFullscreen?: () => Promise<void> }).msRequestFullscreen;
      if (requestFS) {
        await requestFS.call(el);
      }
    } catch {
      // Fullscreen requer gesto do usuário em muitos browsers; ignoramos falha silenciosamente
    }

    try {
      const screenAny = window.screen as unknown as {
        orientation?: { lock?: (orientation: string) => Promise<void> };
      };
      if (screenAny.orientation && screenAny.orientation.lock) {
        await screenAny.orientation.lock('landscape');
      }
    } catch {
      // Orientation lock pode não ser suportado ou permitido; ignoramos falha
    }
  }, []);

  useEffect(() => {
    updateDimensions();

    window.addEventListener('resize', updateDimensions);
    window.addEventListener('orientationchange', updateDimensions);

    const vv = (window as unknown as { visualViewport?: EventTarget }).visualViewport;
    if (vv) {
      vv.addEventListener('resize', updateDimensions);
    }

    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      updateDimensions();
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);

    return () => {
      window.removeEventListener('resize', updateDimensions);
      window.removeEventListener('orientationchange', updateDimensions);
      if (vv) {
        vv.removeEventListener('resize', updateDimensions);
      }
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
    };
  }, [updateDimensions]);

  // Tenta imersão automática no mount (funciona em PWA ou contextos privilegiados)
  useEffect(() => {
    enterImmersive();
  }, [enterImmersive]);

  // Tenta imersão no primeiro gesto do usuário, caso o automático tenha falhado
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onFirstInteraction = () => {
      enterImmersive();
    };

    el.addEventListener('pointerdown', onFirstInteraction, { once: true });
    return () => {
      el.removeEventListener('pointerdown', onFirstInteraction);
    };
  }, [enterImmersive]);

  return { containerRef, dimensions, isFullscreen, enterImmersive };
}
