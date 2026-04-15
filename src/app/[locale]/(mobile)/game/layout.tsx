'use client';

import { ReactNode } from 'react';
import { MobileScaffold } from '@/components/mobile';

export default function MobileGameLayout({
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
