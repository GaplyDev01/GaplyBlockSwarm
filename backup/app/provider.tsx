'use client';

import React, { ReactNode } from 'react';
import { WalletContextProvider as WalletContext } from '@/lib/context/wallet-context';
import { UserProvider } from '@/lib/context/user-context';

export function Providers({ children }: { children: ReactNode }) {
  return (    <WalletContext>    
        <UserProvider>
        {children}
      </UserProvider>
    </WalletContext>
  );
}