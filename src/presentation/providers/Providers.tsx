'use client';

import React, { ReactNode } from 'react';
import { ThemeProvider } from '../../application/theme';
import { WalletProvider } from '../../application/wallet';
import { AIProvider } from '../context/ai-context';
import { UserProvider } from '@/lib/context/user-context';

/**
 * Global providers wrapper
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>    
      <WalletProvider>
        <UserProvider>
          <AIProvider>
            {children}
          </AIProvider>
        </UserProvider>
      </WalletProvider>
    </ThemeProvider>
  );
}