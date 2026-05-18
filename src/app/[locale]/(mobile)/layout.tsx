'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { MobileScaffold } from '@/components/mobile';
import { DesktopLayout } from '@/components/desktop';
import { useDeviceDetection } from '@/hooks';

export default function MobileLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { isMobile } = useDeviceDetection();
  const isGameRoute = pathname?.includes('/game/');

  if (isGameRoute) {
    return <>{children}</>;
  }

  if (!isMobile) {
    return <DesktopLayout>{children}</DesktopLayout>;
  }

  return <MobileScaffold>{children}</MobileScaffold>;
}
