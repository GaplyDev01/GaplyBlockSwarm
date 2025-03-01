'use client';

import React from 'react';
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
  const { isConnected, isConnecting, walletAddress, connect, disconnect } = useWalletContext();

  // Format address for display
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  return isConnected ? (    <div className="flex items-center space-x-2">    <div className={cn(
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