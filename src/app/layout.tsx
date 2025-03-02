import './globals.css';
import type { Metadata } from 'next';
import { Orbitron } from 'next/font/google';
import { Providers } from '@/src/presentation/providers/Providers';
import { AIProvider } from '@/src/presentation/context/ai-context';

// Load Orbitron font
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
  return (    <html lang="en" className="dark" suppressHydrationWarning>    
        <head>    
        <link rel="stylesheet" href="/tailwind-fix.css" />    
        <link rel="stylesheet" href="/custom.css" />
      </head>    <body className={`${orbitron.variable} antialiased bg-sapphire-900 text-emerald-400 bg-tech-pattern bg-fixed`}>    
        <Providers>    
        <AIProvider>
            {children}
          </AIProvider>
        </Providers>
      </body>
    </html>
  );
}