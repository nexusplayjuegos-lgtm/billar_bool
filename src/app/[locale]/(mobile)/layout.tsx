'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { MobileScaffold } from '@/components/mobile';
import { useDeviceDetection } from '@/hooks';
import { DesktopLayout } from '@/components/desktop';

export default function MobileLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { isMobile } = useDeviceDetection();
  const pathname = usePathname();

  // Detectar se está em uma rota de jogo (/game/[mode])
  const isGameRoute = pathname?.includes('/game/');

  if (!isMobile) {
    return <DesktopLayout>{children}</DesktopLayout>;
  }

  // Em rotas de jogo, não renderizar o scaffold (o layout do game já faz isso)
  if (isGameRoute) {
    return <>{children}</>;
  }

  return <MobileScaffold>{children}</MobileScaffold>;
}
