import { ClerkProvider } from '@clerk/nextjs';
import { Orbitron } from 'next/font/google';
import './globals.css';
import type { Metadata } from 'next';

const orbitron = Orbitron({ 
  subsets: ['latin'],
  variable: '--font-orbitron',
});

export const metadata: Metadata = {
  title: 'BlockSwarms - AI Powered Solana Trading',
  description: 'The ultimate platform for Solana token analysis, trading signals, and portfolio management.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <head>
          <link rel="stylesheet" href="/tailwind-fix.css" />
        </head>
        <body className={`${orbitron.variable} bg-sapphire-900 text-emerald-400 bg-tech-pattern bg-fixed`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}