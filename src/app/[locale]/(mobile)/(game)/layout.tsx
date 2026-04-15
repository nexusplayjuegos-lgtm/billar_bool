'use client';

import { ReactNode } from 'react';
import { MobileScaffold } from '@/components/mobile';

export default function GameLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <MobileScaffold hideHeader hideBottomNav className="h-screen overflow-hidden">
      {children}
    </MobileScaffold>
  );
}
