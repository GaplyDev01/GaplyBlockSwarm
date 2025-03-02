'use client';

import React, { ReactNode } from 'react';
import { WalletContextProvider as WalletContext } from '@/src/presentation/context/wallet-context';
import { UserProvider } from '@/src/presentation/context/user-context';

export function Providers({ children }: { children: ReactNode }) {
  return (    <WalletContext>    
        <UserProvider>
        {children}
      </UserProvider>
    </WalletContext>
  );
}