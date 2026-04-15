'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { MobileHeader } from './MobileHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { ForceLandscapeOverlay } from './ForceLandscapeOverlay';
import { useDeviceDetection } from '@/hooks';
import { cn } from '@/lib/utils';

interface MobileScaffoldProps {
  children: ReactNode;
  className?: string;
  hideHeader?: boolean;
  hideBottomNav?: boolean;
}

export function MobileScaffold({
  children,
  className,
  hideHeader = false,
  hideBottomNav = false,
}: MobileScaffoldProps) {
  const { isPortrait } = useDeviceDetection();

  return (
    <>
      <ForceLandscapeOverlay isPortrait={isPortrait} />

      <div className={cn('flex flex-col h-screen bg-slate-950', className)}>
        {!hideHeader && <MobileHeader />}

        <motion.main
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="flex-1 overflow-hidden relative"
        >
          {children}
        </motion.main>

        {!hideBottomNav && <MobileBottomNav />}
      </div>
    </>
  );
}
