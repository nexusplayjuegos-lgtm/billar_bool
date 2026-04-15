'use client';

import { ReactNode } from 'react';

export default function ShopLayout({
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
