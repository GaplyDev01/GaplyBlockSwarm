'use client';

// Force dynamic rendering - never statically generate this page
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import React, { useState, useEffect } from 'react';
import { useWalletContext } from '@/lib/context/wallet-context';
import { ConnectWalletButton } from '@/components/wallet/connect-wallet-button';
import { Layout, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function DashboardPage() {
  const { isConnected, walletAddress } = useWalletContext();
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Short delay to ensure wallet context is loaded
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Safely handle loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-sapphire-900 flex items-center justify-center">
        <div className="w-12 h-12 border-t-2 border-emerald-500 rounded-full animate-spin mb-4"></div>
        <p className="text-emerald-400 ml-3">Loading dashboard...</p>
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
          </div>
        </div>
      </header>
      
      {/* Dashboard content */}
      <main className="pt-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Welcome section */}
          <div className="p-6 bg-sapphire-800/70 backdrop-blur-sm border border-emerald-400/20 rounded-lg mb-6">
            <h1 className="text-2xl font-cyber text-emerald-400 mb-4">Dashboard</h1>
            <p className="text-emerald-400/70 mb-4">
              Welcome to your BlockSwarms dashboard. Monitor your wallet and access platform features below.
            </p>
            
            {/* Wallet status */}
            <div className="mt-6 p-4 bg-sapphire-900/50 rounded-lg border border-emerald-400/10">
              <h2 className="text-lg font-cyber text-emerald-400 mb-3">Wallet Status</h2>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <p className="text-emerald-400/80">
                    <span className="text-emerald-400/60">Status:</span> {isConnected ? (
                      <span className="text-emerald-400">Connected</span>
                    ) : (
                      <span className="text-amber-400">Not Connected</span>
                    )}
                  </p>
                  {walletAddress && (
                    <p className="text-emerald-400/80 font-mono text-sm">
                      <span className="text-emerald-400/60">Address:</span> {walletAddress}
                    </p>
                  )}
                </div>
                <ConnectWalletButton />
              </div>
            </div>
          </div>
          
          {/* Quick access cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* AI Chat Card */}
            <div className="bg-sapphire-800/70 backdrop-blur-sm border border-emerald-400/20 rounded-lg p-6 hover:border-emerald-400/40 transition-all">
              <div className="bg-sapphire-900/50 p-4 rounded-full inline-block mb-5 text-emerald-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-lg font-cyber text-emerald-400 mb-3">AI Chat</h3>
              <p className="text-emerald-400/70 mb-4">
                Get AI analysis on Solana tokens, market trends, and trading recommendations.
              </p>
              <Link href="/ai-chat">
                <Button className="w-full" variant="outline">
                  Open AI Chat
                </Button>
              </Link>
            </div>
            
            {/* Portfolio Card */}
            <div className="bg-sapphire-800/70 backdrop-blur-sm border border-emerald-400/20 rounded-lg p-6 hover:border-emerald-400/40 transition-all">
              <div className="bg-sapphire-900/50 p-4 rounded-full inline-block mb-5 text-emerald-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <h3 className="text-lg font-cyber text-emerald-400 mb-3">Portfolio</h3>
              <p className="text-emerald-400/70 mb-4">
                View your token holdings and portfolio performance metrics.
              </p>
              <Button className="w-full" variant="outline" disabled>
                Coming Soon
              </Button>
            </div>
            
            {/* Trading Card */}
            <div className="bg-sapphire-800/70 backdrop-blur-sm border border-emerald-400/20 rounded-lg p-6 hover:border-emerald-400/40 transition-all">
              <div className="bg-sapphire-900/50 p-4 rounded-full inline-block mb-5 text-emerald-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-cyber text-emerald-400 mb-3">Trading</h3>
              <p className="text-emerald-400/70 mb-4">
                Get token analysis and trading signals powered by AI.
              </p>
              <Button className="w-full" variant="outline" disabled>
                Coming Soon
              </Button>
            </div>
          </div>
          
          {/* Bottom links */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <Link href="/ai-chat">
              <Button className="w-full" variant="outline">
                AI Chat
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

// Export as default
export default DashboardPage;
