import './globals.css';
import type { Metadata } from 'next';
import { Orbitron } from 'next/font/google';
import { Providers } from './provider';
 
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
  return (    <html lang="en" suppressHydrationWarning>    
        <head>    
        <link rel="stylesheet" href="/tailwind-fix.css" />    
        <link rel="stylesheet" href="/custom.css" />
        {/*         Add error handling script         */}    <script dangerouslySetInnerHTML={{
          __html: `
            window.addEventListener('error', function(event) {
              console.error('Global error caught:', event.error);
              
              // If there's a client-side error that prevents rendering
              if (document.body && !document.body.children.length) {
                document.body.innerHTML = '<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #0f172a; color: #4ade80; font-family: sans-serif; padding: 20px; text-align: center;">' +
                  '<h2 style="margin-bottom: 20px; font-size: 24px;">Application Error</h2>' +
                  '<p style="margin-bottom: 30px;">Sorry, there was an error loading the application. Please try again or use the links below.</p>' +
                  '<div style="display: flex; flex-direction: column; gap: 10px;">' +
                  '<a href="/" style="color: #4ade80; border: 1px solid #4ade80; padding: 10px 20px; border-radius: 4px; text-decoration: none;">Return Home</a>' +
                  '<a href="/?demo=true" style="color: #4ade80; border: 1px solid #4ade80; padding: 10px 20px; border-radius: 4px; text-decoration: none;">Try Demo Mode</a>' +
                  '</div>' +
                  '</div>';
              }
            });
          `
        }} />
      </head>    <body className={`${orbitron.variable} antialiased bg-sapphire-900 text-emerald-400 bg-tech-pattern bg-fixed`}>    
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}