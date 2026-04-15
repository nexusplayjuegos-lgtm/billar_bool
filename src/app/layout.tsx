import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Bool Sinuca - Jogue 8-Ball e Sinuca Brasileira Online',
  description: 'O jogo de sinuca mais viciante do Brasil. Milhões de jogadores, torneios diários e prêmios reais!',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
