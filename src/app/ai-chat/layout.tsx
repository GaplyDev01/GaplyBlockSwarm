'use client';

import React, { useEffect, useState } from 'react';
import { UserProvider } from '@/src/presentation/context/user-context';
import dynamic from 'next/dynamic';

// Create a loading state component
function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-emerald-500">
      <div className="text-center space-y-4">
        <div className="text-2xl font-bold">Loading AI Chat...</div>
        <div className="text-sm text-slate-400">Initializing secure wallet connection</div>
      </div>
    </div>
  );
}

// The core layout component
function CoreAIChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Add client-side only initialization
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    
    // Log successful initialization for debugging
    console.log('AI Chat layout initialized on client side');
  }, []);
  
  // Show loading state until client-side code can take over
  if (!isClient) {
    return <LoadingState />;
  }
  
  return (
    <UserProvider>
      {children}
    </UserProvider>
  );
}

// Use dynamic import with no SSR to prevent prerendering issues with context
const AIChatLayout = dynamic(() => Promise.resolve(CoreAIChatLayout), { 
  ssr: false,
  loading: () => <LoadingState />
});

export default AIChatLayout;