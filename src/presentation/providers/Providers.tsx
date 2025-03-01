'use client';

import React, { ReactNode } from 'react';
import { ThemeProvider } from '../../application/theme';
import { WalletProvider } from '../../application/wallet';
import { ClerkProvider } from '@clerk/nextjs';
import { AIProvider } from '../context/ai-context';

/**
 * Global providers wrapper
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <ThemeProvider>
        <WalletProvider>
          <AIProvider>
            {children}
          </AIProvider>
        </WalletProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}