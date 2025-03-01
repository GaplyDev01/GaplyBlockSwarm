'use client';

import { WalletContextProvider } from '@/lib/context/wallet-context';
import { UserProvider } from '@/lib/context/user-context';
import dynamic from 'next/dynamic';

function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (<UserProvider>    <WalletContextProvider>
        {children}
      </WalletContextProvider>
    </UserProvider>
  );
}

// Use dynamic import with no SSR to prevent prerendering issues with context
export default dynamic(() => Promise.resolve(DashboardLayout), { ssr: false });