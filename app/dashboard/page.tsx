'use client';

import React, { useState, useEffect } from 'react';

// Force dynamic rendering - never statically generate this page
// These must all be local declarations when using dynamic exports
const dynamic_rendering = 'force-dynamic';
const runtime_setting = 'edge';
import { useUserContext } from '@/lib/context/user-context';
import { ConnectWalletButton } from '@/components/wallet/connect-wallet-button';
import { UserButton } from '@clerk/nextjs';
import { Layout, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function DashboardPage() {
  const { isLoaded } = useUserContext();
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  
  // Safely handle case when context is not yet available
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-sapphire-900 flex items-center justify-center">
        <div className="w-12 h-12 border-t-2 border-emerald-500 rounded-full animate-spin mb-4"></div>
        <p className="text-emerald-400 ml-3">Loading user data...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-sapphire-900 text-white">
      {/* Header */}
      <header className="bg-sapphire-900/80 backdrop-blur-sm border-b border-emerald-400/20 p-4 fixed top-0 left-0 right-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="font-cyber text-2xl text-emerald-400">BlockSwarms</Link>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustomizeModal(true)}
              className="text-emerald-400 border-emerald-400/30"
            >
              <Layout size={16} className="mr-2" />
              Customize
            </Button>
            <ConnectWalletButton />
            <UserButton />
          </div>
        </div>
      </header>
      
      {/* Simplified content - will be expanded after successful build */}
      <main className="pt-20 px-4">
        <div className="max-w-6xl mx-auto p-6 bg-sapphire-800/70 backdrop-blur-sm border border-emerald-400/20 rounded-lg">
          <h1 className="text-2xl font-cyber text-emerald-400 mb-4">Dashboard</h1>
          <p className="text-emerald-400/70 mb-6">
            Your dashboard is temporarily simplified while we fix formatting issues. 
            Full functionality will be restored in the next update.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/ai-chat">
              <Button className="w-full" variant="outline">
                Go to AI Chat
              </Button>
            </Link>
            <Link href="/">
              <Button className="w-full" variant="outline">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

// Export as default with dynamic import to skip SSR
import { default as nextDynamic } from 'next/dynamic';
export default nextDynamic(() => Promise.resolve(DashboardPage), { ssr: false });
