'use client';

import React, { useEffect, useState } from 'react';
import { useWalletContext } from '@/lib/context/wallet-context';
import { logger } from '@/lib/logger';
import { cn, formatTimestamp } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeftRight, ArrowUp, ArrowDown, ExternalLink, RefreshCw } from 'lucide-react';
import { TransactionInfo } from '@/lib/solana/types';
import { solanaServiceV2 } from '@/lib/solana/v2';

interface WalletTransactionsV2Props {
  className?: string;
  maxItems?: number;
}

export function WalletTransactionsV2({ 
  className,
  maxItems = 5 
}: WalletTransactionsV2Props) {
  const { isConnected, walletAddress } = useWalletContext();
  const [transactions, setTransactions] = useState<TransactionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [retryCount, setRetryCount] = useState(0);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  
  // Initial load and refresh when wallet changes
  useEffect(() => {
    // Clear state when disconnected
    if (!isConnected || !walletAddress) {
      setTransactions([]);
      setLastRefreshed(null);
      setError(null);
      return;
    }
    
    // Wait a moment after connection before fetching transactions
    // This gives time for wallet adapter to complete its connection
    const initialLoadTimer = setTimeout(() => {
      fetchTransactions();
    }, 1500);
    
    // Set up auto-refresh if enabled (for real-time updates)
    let refreshInterval: NodeJS.Timeout | null = null;
    if (autoRefreshEnabled) {
      refreshInterval = setInterval(() => {
        // Only refresh if still connected
        if (isConnected && walletAddress) {
          fetchTransactions(false); // Silent refresh
        }
      }, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      clearTimeout(initialLoadTimer);
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [isConnected, walletAddress, autoRefreshEnabled, retryCount]);
  
  // Retry logic for failed transactions
  useEffect(() => {
    let retryTimeout: NodeJS.Timeout;
    
    if (error && retryCount < 3) {
      // Exponential backoff for retries
      const retryDelay = Math.pow(2, retryCount) * 1000;
      retryTimeout = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        fetchTransactions();
      }, retryDelay);
      
      logger.info(`V2: Retrying transaction fetch (attempt ${retryCount + 1}) after ${retryDelay}ms`);
    }
    
    return () => {
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [error, retryCount]);

  const fetchTransactions = async (showLoadingState = true) => {
    if (!walletAddress || !isConnected) {
      setError('Please connect your wallet first');
      return;
    }
    
    if (showLoadingState) {
      setIsLoading(true);
    }
    setError(null);
    
    try {
      // Ensure wallet is connected to the service first
      try {
        // Connect to the wallet explicitly to ensure proper state
        await solanaServiceV2.connectWallet(walletAddress);
        
        // Fetch transactions after confirming wallet connection
        const txHistory = await solanaServiceV2.getTransactionHistory();
        
        // Filter out any invalid transactions
        const validTransactions = txHistory.filter(tx => 
          tx && tx.id && tx.type && tx.timestamp && tx.status
        );
        
        if (validTransactions.length === 0 && txHistory.length > 0) {
          // If we got transactions but none were valid, that's an error condition
          throw new Error('Received invalid transaction data');
        }
        
        setTransactions(validTransactions.slice(0, maxItems));
        setLastRefreshed(new Date());
        setRetryCount(0); // Reset retry count on success
        
        logger.info(`V2: Found ${txHistory.length} transactions, displaying ${Math.min(validTransactions.length, maxItems)}`);
      } catch (connectionError) {
        // Handle connection-specific errors
        const errorMessage = connectionError instanceof Error ? connectionError.message : 'Connection error';
        logger.error('V2: Error with wallet connection:', connectionError);
        setError(`Wallet connection issue: ${errorMessage}`);
        
        // Don't clear transactions on connection errors to maintain UI state
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('V2: Error fetching transactions:', err);
      setError(`Failed to load transaction history: ${errorMessage}`);
      
      // Keep old transactions visible instead of clearing them on error
      // This provides a better user experience
    } finally {
      if (showLoadingState) {
        setIsLoading(false);
      }
    }
  };

  // Transaction type icon
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'swap':
        return <ArrowLeftRight size={16} className="text-purple-400" />;
      case 'send':
        return <ArrowUp size={16} className="text-red-400" />;
      case 'receive':
        return <ArrowDown size={16} className="text-green-400" />;
      case 'transfer':
        return <ArrowLeftRight size={16} className="text-blue-400" />;
      default:
        return <ArrowLeftRight size={16} className="text-gray-400" />;
    }
  };

  // Transaction status badge
  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-0.5 text-xs rounded-full";
    
    switch (status) {
      case 'confirmed':
        return <span className={`${baseClasses} bg-green-500/20 text-green-400`}>Confirmed</span>;
      case 'failed':
        return <span className={`${baseClasses} bg-red-500/20 text-red-400`}>Failed</span>;
      case 'processing':
        return <span className={`${baseClasses} bg-yellow-500/20 text-yellow-400`}>Processing</span>;
      case 'error':
        return <span className={`${baseClasses} bg-red-500/20 text-red-400`}>Error</span>;
      default:
        return <span className={`${baseClasses} bg-gray-500/20 text-gray-400`}>Unknown</span>;
    }
  };

  // Format transaction details for display
  const getTransactionDetails = (tx: TransactionInfo) => {
    if (tx.type === 'swap' && 'tokenIn' in tx && 'tokenOut' in tx) {
      return `${tx.amountIn} ${tx.tokenIn} → ${tx.amountOut} ${tx.tokenOut}`;
    } else if ((tx.type === 'send' || tx.type === 'transfer') && 'amount' in tx && 'token' in tx) {
      return `${tx.amount} ${tx.token}`;
    } else if (tx.type === 'receive' && 'amount' in tx && 'token' in tx) {
      return `${tx.amount} ${tx.token}`;
    }
    return null;
  };

  if (!isConnected) {
    return (
      <div className={cn("p-4 border border-emerald-400/20 rounded bg-sapphire-900/50 backdrop-blur", className)}>
        <h2 className="text-lg font-cyber text-emerald-400 mb-4">Enhanced Transaction History</h2>
        <p className="text-emerald-400/70">Connect your wallet to view your transaction history</p>
      </div>
    );
  }

  // Format the last refreshed time
  const getLastRefreshedText = () => {
    if (!lastRefreshed) return null;
    
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - lastRefreshed.getTime()) / 1000);
    
    if (diffSeconds < 60) {
      return `${diffSeconds} seconds ago`;
    } else if (diffSeconds < 3600) {
      return `${Math.floor(diffSeconds / 60)} minutes ago`;
    } else {
      return lastRefreshed.toLocaleTimeString();
    }
  };

  return (
    <div className={cn("p-4 border border-emerald-400/20 rounded bg-sapphire-900/50 backdrop-blur", className)}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-cyber text-emerald-400">Enhanced Transaction History</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <label htmlFor="auto-refresh" className="text-xs text-emerald-400/70 mr-2">
              Auto
            </label>
            <div 
              className={cn(
                "w-8 h-4 rounded-full transition-colors cursor-pointer flex items-center px-0.5",
                autoRefreshEnabled ? "bg-emerald-500/30" : "bg-sapphire-700"
              )}
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
            >
              <div 
                className={cn(
                  "w-3 h-3 rounded-full bg-emerald-400 transition-transform",
                  autoRefreshEnabled ? "translate-x-4" : ""
                )}
              />
            </div>
          </div>
          <button 
            onClick={() => fetchTransactions()}
            disabled={isLoading}
            className="text-xs bg-emerald-400/10 hover:bg-emerald-400/20 text-emerald-400 px-2 py-1 rounded flex items-center gap-1"
          >
            {isLoading ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCw size={12} />
                Refresh
              </>
            )}
          </button>
        </div>
      </div>
      
      {lastRefreshed && (
        <div className="flex justify-end">
          <span className="text-xs text-emerald-400/50 mb-2">
            Last updated: {getLastRefreshedText()}
          </span>
        </div>
      )}
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-2 rounded mb-3">
          {error}
          {retryCount > 0 && retryCount < 3 && (
            <span className="block text-xs mt-1">
              Retrying... (Attempt {retryCount}/3)
            </span>
          )}
        </div>
      )}
      
      {isLoading && transactions.length === 0 ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full bg-emerald-400/5" />
          <Skeleton className="h-16 w-full bg-emerald-400/5" />
          <Skeleton className="h-16 w-full bg-emerald-400/5" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-emerald-400/50 text-sm p-4 text-center border border-dashed border-emerald-400/20 rounded-md">
          No transactions found for this wallet address
        </div>
      ) : (
        <div className="space-y-3">
          {isLoading && (
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center rounded z-10">
              <div className="w-8 h-8 border-t-2 border-emerald-500 rounded-full animate-spin"></div>
            </div>
          )}
          
          {transactions.map((tx, index) => {
            const txDetails = getTransactionDetails(tx);
            
            return (
              <div key={index} className="p-3 bg-sapphire-800/30 rounded border border-emerald-400/10 hover:border-emerald-400/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-sapphire-800/80 rounded-full">
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="text-emerald-400 capitalize">{tx.type}</span>
                      {getStatusBadge(tx.status)}
                    </div>
                    
                    {txDetails && (
                      <div className="text-xs text-emerald-400/70 mt-1">
                        {txDetails}
                      </div>
                    )}
                    
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-400">
                        {formatTimestamp(tx.timestamp)}
                      </span>
                      <a 
                        href={`https://solscan.io/tx/${tx.id}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-400/70 hover:text-emerald-400 flex items-center gap-1"
                      >
                        View <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {transactions.length > 0 && (
            <div className="mt-4 pt-2 border-t border-emerald-400/10">
              <div className="flex justify-between items-center">
                <span className="text-xs text-emerald-400/50">
                  Showing {transactions.length} of {maxItems} most recent transactions
                </span>
                <a 
                  href={`https://solscan.io/account/${walletAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400/70 hover:text-emerald-400 text-sm flex items-center gap-1 p-1"
                >
                  View All <ExternalLink size={12} />
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}