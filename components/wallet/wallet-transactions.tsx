'use client';

import React, { useEffect, useState } from 'react';
import { useWalletContext } from '@/lib/context/wallet-context';
import { solanaRpc } from '@/lib/solana/rpc';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { formatTimestamp } from '@/lib/utils';
import { ArrowLeftRight, ArrowUp, ArrowDown } from 'lucide-react';
import { TransactionInfo } from '@/lib/solana/types';
import { getSolanaService } from '@/lib/solana';

interface WalletTransactionsProps {
  className?: string;
  maxItems?: number;
}

export function WalletTransactions({ 
  className,
  maxItems = 5 
}: WalletTransactionsProps) {
  const { isConnected, walletAddress } = useWalletContext();
  const [transactions, setTransactions] = useState<TransactionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Clear transactions when disconnected
    if (!isConnected || !walletAddress) {
      setTransactions([]);
      setError(null);
      return;
    }
    
    // Wait a moment after connection before fetching transactions
    // This gives time for other connection processes to complete
    const timer = setTimeout(() => {
      fetchTransactions();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [isConnected, walletAddress]);

  const fetchTransactions = async () => {
    if (!walletAddress || !isConnected) {
      setError('Please connect your wallet first');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Use our Solana service to get transaction history
      const solanaService = getSolanaService();
      
      // Check if the wallet is connected properly to the service
      try {
        // Connect wallet to service first
        await solanaService.connectWallet(walletAddress);
        
        // Then get transaction history
        const txHistory = await solanaService.getTransactionHistory();
        setTransactions(txHistory.slice(0, maxItems));
        logger.info(`Found ${txHistory.length} transactions, displaying ${maxItems}`);
      } catch (connectionError) {
        // Handle connection errors specifically
        logger.error('Error connecting wallet to service:', connectionError);
        setError('Please reconnect your wallet');
        setTransactions([]);
      }
    } catch (err) {
      logger.error('Error fetching transactions:', err);
      setError('Failed to load transaction history');
      setTransactions([]);
    } finally {
      setIsLoading(false);
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
      default:
        return <span className={`${baseClasses} bg-gray-500/20 text-gray-400`}>Unknown</span>;
    }
  };

  if (!isConnected) {
    return (<div className={cn("p-4 border border-emerald-400/20 rounded bg-sapphire-900/50 backdrop-blur", className)}>    <h2 className="text-lg font-cyber text-emerald-400 mb-4">Transaction History</h2>    <p className="text-emerald-400/70">Connect your wallet to view your transaction history</p>
      </div>
    );
  }

  return (<div className={cn("p-4 border border-emerald-400/20 rounded bg-sapphire-900/50 backdrop-blur", className)}>    <div className="flex justify-between items-center mb-4">    <h2 className="text-lg font-cyber text-emerald-400">Transaction History</h2>    <button 
          onClick={fetchTransactions}
          disabled={isLoading}
          className="text-xs bg-emerald-400/10 hover:bg-emerald-400/20 text-emerald-400 px-2 py-1 rounded"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      
      {error && (    <div className="text-red-400 text-sm mb-2">{error}</div>
      )}
      
      {isLoading ? (    <div className="space-y-2">    <Skeleton className="h-16 w-full bg-emerald-400/5" />    <Skeleton className="h-16 w-full bg-emerald-400/5" />    <Skeleton className="h-16 w-full bg-emerald-400/5" />
        </div>
      ) : transactions.length === 0 ? (    <div className="text-emerald-400/50 text-sm">No transactions found</div>
      ) : (    <div className="space-y-3">
          {transactions.map((tx, index) => (    <div key={index} className="p-3 bg-sapphire-800/30 rounded border border-emerald-400/10">    <div className="flex items-center gap-3">    <div className="p-2 bg-sapphire-800/80 rounded-full">
                  {getTransactionIcon(tx.type)}
                </div>    <div className="flex-1">    <div className="flex justify-between">    <span className="text-emerald-400 capitalize">{tx.type}</span>
                    {getStatusBadge(tx.status)}
                  </div>    <div className="flex justify-between mt-1">    <span className="text-xs text-gray-400">
                      {formatTimestamp(tx.timestamp)}
                    </span>    <a 
                      href={`https://solscan.io/tx/${tx.id}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-400/70 hover:text-emerald-400"
                    >
                      View on Explorer
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {transactions.length > 0 && (    <a 
              href={`https://solscan.io/account/${walletAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-emerald-400/70 hover:text-emerald-400 text-sm mt-4"
            >
              View All Transactions
            </a>
          )}
        </div>
      )}
    </div>
  );
}