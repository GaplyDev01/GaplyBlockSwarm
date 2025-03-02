import './globals.css';
import type { Metadata } from 'next';
import { Orbitron } from 'next/font/google';

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
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/tailwind-fix.css" />
        <link rel="stylesheet" href="/custom.css" />
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --primary: rgb(16, 185, 129);
            --background: rgb(2, 6, 23);
          }
          
          body {
            background-color: var(--background);
            color: var(--primary);
            font-family: system-ui, sans-serif;
            background-image: 
              radial-gradient(at 10% 10%, rgba(16, 185, 129, 0.05) 0px, transparent 50%),
              radial-gradient(at 90% 90%, rgba(16, 185, 129, 0.05) 0px, transparent 50%);
            background-attachment: fixed;
          }
          
          .dark {
            --background: rgb(2, 6, 23);
            --card: rgb(15, 23, 42);
            --foreground: rgb(203, 255, 239);
            --primary: rgb(16, 185, 129);
          }
        `}}/>
      </head>
      <body className={`${orbitron.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}