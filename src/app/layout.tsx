import './globals.css';
import type { Metadata } from 'next';
import { Orbitron } from 'next/font/google';

// Load Orbitron font
const orbitron = Orbitron({ 
  subsets: ['latin'],
  variable: '--font-orbitron',
});

export const metadata: Metadata = {
  title: 'BlockSwarms - Deployment Test',
  description: 'Deployment troubleshooting for BlockSwarms platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/tailwind-fix.css" />
        <link rel="stylesheet" href="/custom.css" />
      </head>
      <body className={`${orbitron.variable} antialiased bg-sapphire-900 text-emerald-400`}>
        {children}
      </body>
    </html>
  );
}