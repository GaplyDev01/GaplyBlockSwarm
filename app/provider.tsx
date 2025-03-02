'use client';

import React, { ReactNode } from 'react';
import { WalletContextProvider as WalletContext } from '@/lib/context/wallet-context';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WalletContext>
      {children}
    </WalletContext>
  );
}