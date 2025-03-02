'use client';

import React, { useState, useEffect } from 'react';
import { useWalletContext } from '@/src/presentation/context/wallet-context';
import { cn } from '@/src/shared/utils/utils';
import { RefreshCw } from 'lucide-react';
import { formatNumber } from '@/src/shared/utils/utils';
import { solanaRpc } from '@/src/infrastructure/blockchain/solana/rpc';
import { logger } from '@/src/shared/utils/logger';

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
  const [hasError, setHasError] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  
  // Safe context access
  let contextData;
  try {
    contextData = useWalletContext();
  } catch (error) {
    logger.error('Error accessing wallet context:', error);
    setHasError(true);
    contextData = { isConnected: false, walletAddress: null, balance: 0 };
  }
  
  // Destructuring with fallbacks
  const { 
    isConnected = false, 
    walletAddress = null, 
    balance = 0 
  } = contextData || {};
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [localBalance, setLocalBalance] = useState<number | null>(null);

  // Check for demo mode
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const demoMode = urlParams.get('demo') === 'true';
        setIsDemo(demoMode);
        
        // Set a demo balance if in demo mode
        if (demoMode) {
          setLocalBalance(5.23);
        }
      }
    } catch (e) {
      logger.error("Failed to check for demo mode", e);
    }
  }, []);
  
  // Update local balance when context balance changes
  useEffect(() => {
    if (!isDemo && balance !== undefined) {
      setLocalBalance(balance);
    }
  }, [balance, isDemo]);

  // Manual refresh function
  const handleRefresh = async () => {
    if (!isConnected || !walletAddress || isDemo) return;
    
    setIsRefreshing(true);
    try {
      const lamports = await solanaRpc.getBalance(walletAddress);
      const solBalance = lamports / 1_000_000_000;
      setLocalBalance(solBalance);
      logger.info(`Balance refreshed manually: ${solBalance.toFixed(4)} SOL`);
    } catch (error) {
      logger.error('Error refreshing balance:', error);
      
      // Fallback in case of error
      setLocalBalance(prevBalance => prevBalance || 0.5);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Format balance for display
  const getDisplayBalance = () => {
    if (hasError) {
      return 'Error';
    }
    
    if (isDemo) {
      return '5.23 SOL';
    }
    
    if (!isConnected) {
      return 'Not connected';
    }
    
    if (localBalance === null) {
      return 'Loading...';
    }
    
    try {
      return `${formatNumber(localBalance, 4)} SOL`;
    } catch (e) {
      logger.error('Error formatting balance:', e);
      return `${localBalance.toFixed(4)} SOL`;
    }
  };

  // Get balance text color
  const getBalanceColor = () => {
    if (!colorized) return '';
    
    if (hasError) {
      return 'text-red-400';
    }
    
    if (isDemo) {
      return 'text-amber-400';
    }
    
    if (!isConnected) {
      return 'text-gray-400';
    }
    
    if (localBalance === null) {
      return 'text-gray-400';
    }
    
    try {
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
    } catch (e) {
      return 'text-gray-400';
    }
  };
  
  // Error state
  if (hasError) {
    return (    <div className={cn('flex items-center gap-2', className)}>    
        <div className="font-mono text-red-400">Error loading balance</div>
      </div>
    );
  }
  
  return (    <div className={cn('flex items-center gap-2', className)}>    
        <div className={cn('font-mono', getBalanceColor())}>
        {getDisplayBalance()}
      </div>
      
      {showRefresh && isConnected && !isDemo && (    <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-emerald-400/70 hover:text-emerald-400 transition-colors"
          title="Refresh balance"
        >    
        <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
      )}
      
      {isDemo && (    <span className="text-xs text-amber-400/70 italic">(Demo)</span>
      )}
      
      {showLiveIndicator && isConnected && isSubscribed && !isDemo && (    <div 
          className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" 
          title="Live updates active" 
        />
      )}
    </div>
  );
}