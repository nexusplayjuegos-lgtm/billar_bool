'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { MobileScaffold } from '@/components/mobile';

export default function MobileLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isGameRoute = pathname?.includes('/game/');

  if (isGameRoute) {
    return <>{children}</>;
  }

  return <MobileScaffold>{children}</MobileScaffold>;
}
