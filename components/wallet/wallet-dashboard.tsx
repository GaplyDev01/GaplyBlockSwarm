'use client';

import React, { useEffect, useState } from 'react';
import { useWalletContext } from '@/lib/context/wallet-context';
import { LiveWalletBalance } from './live-wallet-balance';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { solanaRpc } from '@/lib/solana/rpc';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface TokenAccountDisplay {
  mint: string;
  amount: number;
  decimals: number;
  displayMint: string;
}

interface WalletDashboardProps {
  className?: string;
}

export function WalletDashboard({ className }: WalletDashboardProps) {
  const { isConnected, walletAddress } = useWalletContext();
  const [tokenAccounts, setTokenAccounts] = useState<TokenAccountDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && walletAddress) {
      fetchTokenAccounts();
    } else {
      setTokenAccounts([]);
    }
  }, [isConnected, walletAddress]);

  const fetchTokenAccounts = async () => {
    if (!walletAddress) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get token accounts using SolanaRpc service
      const tokenProgramId = TOKEN_PROGRAM_ID.toString();
      const accounts = await solanaRpc.getTokenAccountsByOwner(
        walletAddress,
        { programId: tokenProgramId }
      );
      
      // Process and filter token accounts (only show non-zero balances)
      // This is a type assertion since we know the structure from solana
      const accountsData = accounts as any;
      const processedAccounts = accountsData.value
        .filter((account: any) => {
          const info = account.account.data.parsed.info;
          return info.tokenAmount.uiAmount > 0;
        })
        .map((account: any) => {
          const info = account.account.data.parsed.info;
          return {
            mint: info.mint,
            amount: info.tokenAmount.uiAmount,
            decimals: info.tokenAmount.decimals,
            displayMint: `${info.mint.slice(0, 4)}...${info.mint.slice(-4)}`
          };
        });
      
      setTokenAccounts(processedAccounts);
      logger.info(`Found ${processedAccounts.length} token accounts with balances`);
    } catch (err) {
      logger.error('Error fetching token accounts:', err);
      setError('Failed to load token accounts');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (<div className={cn("p-4 border border-emerald-400/20 rounded bg-sapphire-900/50 backdrop-blur", className)}>    <h2 className="text-lg font-cyber text-emerald-400 mb-4">Wallet Dashboard</h2>    <p className="text-emerald-400/70">Connect your wallet to view your balances and tokens</p>
      </div>
    );
  }

  return (<div className={cn("p-4 border border-emerald-400/20 rounded bg-sapphire-900/50 backdrop-blur", className)}>    <h2 className="text-lg font-cyber text-emerald-400 mb-4">Wallet Dashboard</h2>    <div className="mb-4">    <div className="text-emerald-400/70 mb-1">Connected Address</div>    <div className="text-emerald-400 font-mono text-sm break-all">
          {walletAddress}
        </div>
      </div>    <div className="mb-4">    <div className="text-emerald-400/70 mb-1">SOL Balance (Live)</div>    <LiveWalletBalance />
      </div>    <div>    <div className="flex justify-between items-center mb-2">    <div className="text-emerald-400/70">Token Balances</div>    <button 
            onClick={fetchTokenAccounts}
            disabled={isLoading}
            className="text-xs bg-emerald-400/10 hover:bg-emerald-400/20 text-emerald-400 px-2 py-1 rounded"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        
        {error && (    <div className="text-red-400 text-sm mb-2">{error}</div>
        )}
        
        {isLoading ? (    <div className="space-y-2">    <Skeleton className="h-8 w-full bg-emerald-400/5" />    <Skeleton className="h-8 w-full bg-emerald-400/5" />    <Skeleton className="h-8 w-full bg-emerald-400/5" />
          </div>
        ) : tokenAccounts.length === 0 ? (    <div className="text-emerald-400/50 text-sm">No tokens found</div>
        ) : (    <div className="space-y-2">
            {tokenAccounts.map((token, index) => (    <div key={index} className="flex justify-between py-1 border-b border-emerald-400/10">    <span className="text-emerald-400/70">{token.displayMint}</span>    <span className="text-emerald-400">{token.amount}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}