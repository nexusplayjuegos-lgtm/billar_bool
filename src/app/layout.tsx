import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Inter } from 'next/font/google';
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider';
import { AppViewport } from '@/components/platform/AppViewport';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });
const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const siteUrl = 'https://www.8bollpool.com';
const ogImageUrl = `${siteUrl}/og-image.jpg`;
const siteDescription = 'Jogue sinuca 8-ball online gratis com visual premium, matchmaking rapido, conquistas, missoes, caixas de vitoria e Pool Pass.';

const videoGameSchema = {
  '@context': 'https://schema.org',
  '@type': 'VideoGame',
  name: 'Bool Sinuca Premiere',
  description: siteDescription,
  url: siteUrl,
  image: ogImageUrl,
  genre: ['Sports Game', 'Billiards', 'Pool'],
  gamePlatform: ['Web Browser', 'Mobile Web'],
  applicationCategory: 'GameApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'BRL',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '10000',
  },
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Bool Sinuca Premiere - Jogue 8-Ball Online Gratis',
  description: siteDescription,
  keywords: ['sinuca', 'bilhar', '8-ball', 'pool', 'jogo online'],
  manifest: '/manifest.json',
  openGraph: {
    title: 'Bool Sinuca Premiere - Jogue 8-Ball Online Gratis',
    description: siteDescription,
    url: siteUrl,
    siteName: 'Bool Sinuca Premiere',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Bool Sinuca Premiere - jogo online de sinuca 8-ball',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bool Sinuca Premiere',
    description: siteDescription,
    images: ['/og-image.jpg'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Bool Sinuca',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#020617',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/og-image.jpg" />
        <link
          rel="apple-touch-startup-image"
          href="/og-image.jpg"
          media="(orientation: landscape)"
        />
        <link rel="preload" href="/sounds/cue_hit.mp3" as="fetch" crossOrigin="anonymous" />
        <link rel="preload" href="/sounds/ball_collision.mp3" as="fetch" crossOrigin="anonymous" />
        <link rel="preload" href="/sounds/ball_pocket.mp3" as="fetch" crossOrigin="anonymous" />
        <Script
          id="schema-video-game"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(videoGameSchema) }}
        />
      </head>
      <body className={inter.className}>
        {gaMeasurementId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`} strategy="afterInteractive" />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('js', new Date());
                gtag('config', '${gaMeasurementId}', { send_page_view: false });
              `}
            </Script>
          </>
        )}
        <AppViewport />
        <AnalyticsProvider measurementId={gaMeasurementId} />
        {children}
      </body>
    </html>
  );
}
