'use client';

import React from 'react';
import { useWalletContext } from '../../../application/wallet';
import { Loader2 } from 'lucide-react';
import { formatAddress } from '../../../shared/utils/helpers';

/**
 * Button variants
 */
type ButtonVariant = 'default' | 'outline' | 'subtle' | 'ghost';

/**
 * Button sizes
 */
type ButtonSize = 'default' | 'sm' | 'lg';

/**
 * Props for ConnectWalletButton
 */
interface ConnectWalletButtonProps {
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/**
 * Connect wallet button component
 */
export function ConnectWalletButton({
  className,
  variant = 'default',
  size = 'default',
}: ConnectWalletButtonProps) {
  const { 
    isConnected, 
    isConnecting, 
    walletAddress, 
    connect, 
    disconnect 
  } = useWalletContext();

  // Get CSS classes based on variant and size
  const getButtonClasses = () => {
    const baseClasses = 'font-medium rounded-md transition-all focus:outline-none';
    
    const variantClasses = {
      default: 'bg-emerald-400 text-sapphire-900 hover:bg-emerald-500',
      outline: 'bg-transparent border-2 border-emerald-400 text-emerald-400 hover:bg-emerald-400/10',
      subtle: 'bg-emerald-400/20 text-emerald-400 hover:bg-emerald-400/30',
      ghost: 'bg-transparent text-emerald-400 hover:bg-emerald-400/10',
    };
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs',
      default: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };
    
    return [
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      isConnecting ? 'opacity-75 cursor-not-allowed' : '',
      className || '',
    ].join(' ');
  };

  // Handle connect button click
  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  // Handle disconnect button click
  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  return isConnected ? (
    <div className="flex items-center space-x-2">
      <div className="rounded-md px-3 py-1.5 text-xs font-mono bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
        {walletAddress ? formatAddress(walletAddress) : '...'}
      </div>
      <button
        onClick={handleDisconnect}
        className="rounded-md px-3 py-1.5 text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
      >
        Disconnect
      </button>
    </div>
  ) : (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className={getButtonClasses()}
    >
      {isConnecting ? (
        <span className="flex items-center">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </span>
      ) : (
        'Connect Wallet'
      )}
    </button>
  );
}