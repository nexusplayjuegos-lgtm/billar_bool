import type { Metadata } from 'next';
import Script from 'next/script';
import { Inter } from 'next/font/google';
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });
const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const metadata: Metadata = {
  title: 'Bool Sinuca Premiere - Jogue 8-Ball Online Gratis',
  description: 'Jogue sinuca 8-ball online gratis. Conquistas, torneios, passe de batalha e muito mais.',
  keywords: ['sinuca', 'bilhar', '8-ball', 'pool', 'jogo online'],
  manifest: '/manifest.json',
  openGraph: {
    title: 'Bool Sinuca Premiere - Jogue 8-Ball Online Gratis',
    description: 'Sinuca 8-ball online gratis com conquistas, passe de batalha, caixas e torneios em breve.',
    url: 'https://billar-bool.vercel.app',
    siteName: 'Bool Sinuca Premiere',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bool Sinuca Premiere',
    description: 'Jogue sinuca 8-ball online gratis.',
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no, maximum-scale=1"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="preload" href="/sounds/cue_hit.mp3" as="fetch" crossOrigin="anonymous" />
        <link rel="preload" href="/sounds/ball_collision.mp3" as="fetch" crossOrigin="anonymous" />
        <link rel="preload" href="/sounds/ball_pocket.mp3" as="fetch" crossOrigin="anonymous" />
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
        <AnalyticsProvider measurementId={gaMeasurementId} />
        {children}
      </body>
    </html>
  );
}
