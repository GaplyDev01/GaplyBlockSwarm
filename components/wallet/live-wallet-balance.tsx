'use client';

import React, { useState, useEffect } from 'react';
import { useWalletContext } from '@/lib/context/wallet-context';
import { cn } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { solanaRpc } from '@/lib/solana/rpc';
import { logger } from '@/lib/logger';

interface LiveWalletBalanceProps {
  className?: string;
  showRefresh?: boolean;
  showLiveIndicator?: boolean;
  colorized?: boolean;
}

export function LiveWalletBalance({
  className,
  showRefresh = true,
  showLiveIndicator = true,
  colorized = true,
}: LiveWalletBalanceProps) {
  const { isConnected, walletAddress, balance } = useWalletContext();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [localBalance, setLocalBalance] = useState<number | null>(null);

  useEffect(() => {
    if (balance !== undefined) {
      setLocalBalance(balance);
    }
  }, [balance]);

  // Manual refresh function
  const handleRefresh = async () => {
    if (!isConnected || !walletAddress) return;
    
    setIsRefreshing(true);
    try {
      const lamports = await solanaRpc.getBalance(walletAddress);
      const solBalance = lamports / 1_000_000_000;
      setLocalBalance(solBalance);
      logger.info(`Balance refreshed manually: ${solBalance.toFixed(4)} SOL`);
    } catch (error) {
      logger.error('Error refreshing balance:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Format balance for display
  const getDisplayBalance = () => {
    if (!isConnected) {
      return 'Not connected';
    }
    
    if (localBalance === null) {
      return 'Loading...';
    }
    
    return `${formatNumber(localBalance, 4)} SOL`;
  };

  // Get balance text color
  const getBalanceColor = () => {
    if (!colorized) return '';
    
    if (!isConnected) {
      return 'text-gray-400';
    }
    
    if (localBalance === null) {
      return 'text-gray-400';
    }
    
    if (localBalance > 10) {
      return 'text-green-400';
    }
    
    if (localBalance > 1) {
      return 'text-emerald-400';
    }
    
    if (localBalance > 0.1) {
      return 'text-yellow-400';
    }
    
    return 'text-red-400';
  };
  
  return (<div className={cn('flex items-center gap-2', className)}>    <div className={cn('font-mono', getBalanceColor())}>
        {getDisplayBalance()}
      </div>
      
      {showRefresh && isConnected && (    <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-emerald-400/70 hover:text-emerald-400 transition-colors"
          title="Refresh balance"
        >    <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
      )}
      
      {showLiveIndicator && isConnected && isSubscribed && (    <div 
          className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" 
          title="Live updates active" 
        />
      )}
    </div>
  );
}