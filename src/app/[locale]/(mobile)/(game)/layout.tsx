'use client';

import { ReactNode } from 'react';

export default function GameLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="h-full">
      {children}
    </div>
  );
}
