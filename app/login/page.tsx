'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Wallet, ExternalLink } from 'lucide-react';
import { useWalletContext } from '@/lib/context/wallet-context';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

export default function WalletLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get('redirect_url') || '/dashboard';
  
  const [loginStatus, setLoginStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Get wallet context safely
  let walletContext;
  try {
    walletContext = useWalletContext();
  } catch (error) {
    logger.error('Error accessing wallet context:', error);
    walletContext = {
      isConnected: false,
      walletAddress: null,
      connect: async () => {},
      disconnect: async () => {},
      isConnecting: false,
      balance: 0
    };
  }
  
  const { 
    isConnected = false, 
    walletAddress = null, 
    connect = async () => {}, 
    disconnect = async () => {}, 
    isConnecting = false, 
    balance = 0 
  } = walletContext || {};

  useEffect(() => {
    // Set cookie when wallet is connected
    if (isConnected && walletAddress) {
      // Set a simple cookie to indicate wallet connection
      document.cookie = `wallet_connected=${walletAddress}; path=/; max-age=86400`; // 24 hours
      
      // Set login status to success
      setLoginStatus('success');
      
      // Redirect after a short delay to show success message
      const timer = setTimeout(() => {
        router.push(redirectUrl);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isConnected, walletAddress, redirectUrl, router]);

  const handleConnectWallet = async () => {
    try {
      setLoginStatus('connecting');
      setErrorMessage(null);
      await connect();
    } catch (error) {
      logger.error('Failed to connect wallet:', error);
      setLoginStatus('error');
      setErrorMessage('Failed to connect wallet. Please try again.');
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (    <div className="min-h-screen bg-sapphire-900 overflow-hidden bg-tech-pattern">
        {/*         Background effect         */}    <div className="absolute inset-0 overflow-hidden">    <div className="absolute inset-0 bg-gradient-to-br from-sapphire-900 via-sapphire-900/90 to-sapphire-800/50" />    
        <div className="absolute w-full h-full">    
        <div className="absolute inset-0 bg-sapphire-900 opacity-90" /></div>
      </div>
        {/*         Decorative elements         */}    <div className="absolute inset-0 overflow-hidden pointer-events-none">    
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-emerald-400/0 via-emerald-400/20 to-emerald-400/0" />    
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-emerald-400/0 via-emerald-400/20 to-emerald-400/0" />    
        <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-emerald-400/0 via-emerald-400/20 to-emerald-400/0" /></div>
        {/*         Content         */}    <div className="relative flex flex-col items-center justify-center min-h-screen p-6">    
        <Link href="/" className="absolute top-6 left-6 text-emerald-400 hover:text-emerald-300 flex items-center gap-2">    
        <ArrowLeft size={20} />    
        <span>Back to Home</span>
        </Link>    <div className="w-full max-w-md">    
        <div className="text-center mb-8">    
        <h1 className="text-3xl font-cyber font-bold text-emerald-400">Connect Your Wallet</h1>    <p className="text-emerald-400/70 mt-2">
              Access BlockSwarms by connecting your Solana wallet
            </p>
          </div>    <div className="bg-sapphire-800/50 backdrop-blur-sm border border-emerald-400/20 rounded-lg p-8 shadow-xl">    
        <div className="flex justify-between mb-6">    
        <Link href="/dashboard?demo=true" className="text-xs bg-amber-500/30 hover:bg-amber-500/40 text-amber-100 px-3 py-1 rounded-md">
                Try Demo Mode
              </Link>    <Link href="/" className="text-xs bg-blue-500/30 hover:bg-blue-500/40 text-blue-100 px-3 py-1 rounded-md">
                Back to Home
              </Link>
            </div>
            
            {loginStatus === 'success' ? (    <div className="text-center py-6">    
        <div className="w-16 h-16 bg-emerald-400/20 rounded-full flex items-center justify-center mx-auto mb-4">    
        <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-emerald-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >    
        <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>    <h3 className="text-xl font-bold text-emerald-400 mb-2">Wallet Connected!</h3>    <p className="text-emerald-400/70 mb-2">
                  Address: {formatAddress(walletAddress || '')}
                </p>    <p className="text-emerald-400/70 mb-6">
                  Balance: {balance.toFixed(2)} SOL
                </p>    <p className="text-emerald-400/70 text-sm animate-pulse">
                  Redirecting to dashboard...
                </p>
              </div>
            ) : (    <div className="space-y-6">    
        <div className="bg-sapphire-900/50 p-4 rounded-lg border border-emerald-400/10">    
        <h3 className="font-medium text-emerald-400 mb-2 flex items-center">    
        <Wallet className="mr-2 h-5 w-5" />
                    Solana Wallet
                  </h3>    <p className="text-sm text-emerald-400/70 mb-4">
                    Connect with Phantom, Solflare or other Solana wallets to access your account.
                  </p>    <Button
                    onClick={handleConnectWallet}
                    disabled={isConnecting || loginStatus === 'connecting'}
                    className="w-full bg-emerald-400 hover:bg-emerald-500 text-sapphire-900 font-cyber"
                    isLoading={isConnecting || loginStatus === 'connecting'}
                  >
                    {isConnecting || loginStatus === 'connecting' 
                      ? 'Connecting...' 
                      : 'Connect Wallet'}
                  </Button>
                  
                  {loginStatus === 'error' && errorMessage && (    <div className="mt-3 text-red-400 text-sm bg-red-400/10 p-2 rounded border border-red-400/20">
                      {errorMessage}
                    </div>
                  )}
                </div>    <div className="border-t border-emerald-400/10 pt-4">    
        <p className="text-xs text-emerald-400/50 mb-2">Don't have a Solana wallet?</p>    <a 
                    href="https://phantom.app/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-400 flex items-center hover:underline"
                  >
                    Get Phantom Wallet <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}