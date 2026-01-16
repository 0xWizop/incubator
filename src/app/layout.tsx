import type { Metadata } from 'next';
import { Inter, Orbitron, Roboto_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  weight: ['400', '500', '600', '700'],
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-roboto-mono',
});

const baseUrl = 'https://incubatorprotocol-c31de.web.app';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Incubator Protocol - Trade Crypto Across All Chains',
    template: '%s | Incubator Protocol',
  },
  description: 'Trade crypto across Solana, Ethereum, Base & Arbitrum in one terminal. Real-time charts, instant swaps, portfolio tracking & price alerts. The #1 multichain DeFi trading app.',
  keywords: [
    'crypto trading',
    'defi',
    'multichain',
    'solana trading',
    'ethereum trading',
    'base chain',
    'arbitrum',
    'dex aggregator',
    'crypto swap',
    'trading terminal',
    'crypto charts',
    'portfolio tracker',
    'price alerts',
    'token screener',
  ],
  authors: [{ name: 'Incubator Protocol' }],
  creator: 'Incubator Protocol',
  publisher: 'Incubator Protocol',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    siteName: 'Incubator Protocol',
    title: 'Incubator Protocol - Trade Crypto Across All Chains',
    description: 'Trade crypto across Solana, Ethereum, Base & Arbitrum in one terminal. Real-time charts, instant swaps, portfolio tracking & price alerts.',
    images: [
      {
        url: 'https://i.imgur.com/8UIQt03.png',
        width: 1200,
        height: 630,
        alt: 'Incubator Protocol - Multichain Trading Terminal',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Incubator Protocol - Trade Crypto Across All Chains',
    description: 'Trade crypto across Solana, Ethereum, Base & Arbitrum in one terminal. Real-time charts, instant swaps, portfolio tracking.',
    images: ['https://i.imgur.com/8UIQt03.png'],
    creator: '@IncubatorProto',
  },
  verification: {
    // Add these when you have them
    // google: 'google-site-verification-code',
    // yandex: 'yandex-verification-code',
  },
  category: 'finance',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={`${inter.variable} ${orbitron.variable} ${robotoMono.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
