'use client';

import { UserProvider } from '@/lib/context/user-context';
import dynamic from 'next/dynamic';

function AIChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (    <UserProvider>
      {children}
    </UserProvider>
  );
}

// Use dynamic import with no SSR to prevent prerendering issues with context
export default dynamic(() => Promise.resolve(AIChatLayout), { ssr: false });