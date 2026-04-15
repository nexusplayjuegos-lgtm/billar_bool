'use client';

import { ReactNode } from 'react';
import { DesktopLayout } from '@/components/desktop';

export default function DesktopGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <DesktopLayout>{children}</DesktopLayout>;
}
