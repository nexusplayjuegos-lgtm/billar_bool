import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LobbyPageClient } from './LobbyPageClient';

const LOCALES = ['en', 'es', 'pt'] as const;
type Locale = (typeof LOCALES)[number];

const localeMeta: Record<Locale, { title: string; description: string }> = {
  en: {
    title: 'Bool Sinuca Premiere - Play 8-Ball Pool Online Free',
    description:
      'Play free online 8-ball pool with premium visuals, competitive bot matches, achievements, victory boxes and Pool Pass.',
  },
  es: {
    title: 'Bool Sinuca Premiere - Juega 8-Ball Pool Online Gratis',
    description:
      'Juega al billar 8-ball online gratis con visual premium, bot competitivo, logros, cajas de victoria y Pool Pass.',
  },
  pt: {
    title: 'Bool Sinuca Premiere - Jogue 8-Ball Online Gratis',
    description:
      'Jogue sinuca 8-ball online gratis com visual premium, bot competitivo, conquistas, caixas de vitoria e Pool Pass.',
  },
};

function isLocale(value: string): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  if (!isLocale(params.locale)) notFound();

  const meta = localeMeta[params.locale];

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `/${params.locale}`,
      languages: {
        en: '/en',
        es: '/es',
        pt: '/pt',
        'x-default': '/pt',
      },
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `/${params.locale}`,
      locale: params.locale === 'pt' ? 'pt_BR' : params.locale,
      images: ['/og-image.jpg'],
      type: 'website',
    },
  };
}

export default function LobbyPage() {
  return <LobbyPageClient />;
}
