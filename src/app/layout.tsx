import type { Metadata } from 'next';
import { Inter, Orbitron } from 'next/font/google';
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

export const metadata: Metadata = {
  title: 'Incubator Protocol',
  description: 'Unified multichain trading terminal, explorer, and analytics hub for Solana, Ethereum, Base, and Arbitrum.',
  keywords: ['crypto', 'trading', 'defi', 'multichain', 'solana', 'ethereum', 'base', 'arbitrum', 'dex', 'swap'],
  icons: {
    icon: 'https://i.imgur.com/8UIQt03.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={`${inter.variable} ${orbitron.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
