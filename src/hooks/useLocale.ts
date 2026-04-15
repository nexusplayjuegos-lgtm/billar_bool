'use client';

import { useParams } from 'next/navigation';

export function useLocale() {
  const params = useParams();
  const locale = (params?.locale as string) || 'pt';

  return {
    locale,
    isPT: locale === 'pt',
    isEN: locale === 'en',
    isES: locale === 'es',
  };
}
