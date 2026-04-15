'use client';

import { ReactNode } from 'react';
import { MobileScaffold } from '@/components/mobile';
import { useDeviceDetection } from '@/hooks';
import { DesktopLayout } from '@/components/desktop';

export default function MobileLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { isMobile } = useDeviceDetection();

  if (!isMobile) {
    return <DesktopLayout>{children}</DesktopLayout>;
  }

  return <MobileScaffold>{children}</MobileScaffold>;
}
