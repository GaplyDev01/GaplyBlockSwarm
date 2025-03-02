'use client';

import React, { useState, useEffect } from 'react';
import { useWalletContext } from '@/lib/context/wallet-context';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConnectWalletButtonProps {
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'subtle' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export function ConnectWalletButton({
  className,
  variant = 'primary',
  size = 'default',
}: ConnectWalletButtonProps) {
  const [hasError, setHasError] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  
  // Check for demo mode
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        setIsDemo(urlParams.get('demo') === 'true');
      }
    } catch (e) {
      console.error("Failed to check for demo mode", e);
    }
  }, []);
  
  // Safely access wallet context with error handling
  let contextData;
  try {
    contextData = useWalletContext();
  } catch (error) {
    console.error('Error accessing wallet context:', error);
    setHasError(true);
    contextData = {
      isConnected: false,
      walletAddress: null,
      connect: async () => {},
      disconnect: async () => {},
      isConnecting: false
    };
  }
  
  // Destructure with fallbacks
  const { 
    isConnected = false, 
    isConnecting = false, 
    walletAddress = null, 
    connect = async () => {}, 
    disconnect = async () => {} 
  } = contextData || {};

  // Format address for display
  const shortenAddress = (address: string) => {
    if (!address) return '...';
    try {
      return `${address.slice(0, 4)}...${address.slice(-4)}`;
    } catch (e) {
      return '...';
    }
  };

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setHasError(true);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      setHasError(true);
    }
  };
  
  // Error state
  if (hasError) {
    return (    <Button
        variant="outline"
        size={size}
        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
        onClick={() => window.location.href = "/?demo=true"}
      >
        Wallet Error
      </Button>
    );
  }
  
  // Demo mode
  if (isDemo) {
    return (    <div className="flex items-center space-x-2">    
        <div className={cn(
          'rounded-md px-3 py-1.5 text-xs font-mono',
          'glass-card backdrop-blur-sm bg-amber-500/10 text-amber-400'
        )}>
          Demo Wallet
        </div>
      </div>
    );
  }

  return isConnected ? (    <div className="flex items-center space-x-2">    
        <div className={cn(
        'rounded-md px-3 py-1.5 text-xs font-mono',
        'glass-card backdrop-blur-sm animate-pulse-glow'
      )}>
        {walletAddress ? shortenAddress(walletAddress) : '...'}
      </div>    <Button
        onClick={handleDisconnect}
        variant="outline"
        size="sm"
        className="border-neon-red/30 text-neon-red hover:bg-neon-red/10 hover:border-neon-red/60"
      >
        Disconnect
      </Button>
    </div>
  ) : (    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      variant={variant}
      size={size}
      className={className}
      isLoading={isConnecting}
    >
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
}