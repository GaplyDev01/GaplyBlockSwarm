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
  // Add error and demo states
  const [hasError, setHasError] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  
  // Safe context access
  let contextData;
  try {
    contextData = useWalletContext();
  } catch (error) {
    logger.error('Error accessing wallet context:', error);
    setHasError(true);
    contextData = { isConnected: false, walletAddress: null };
  }
  
  // Get wallet data with fallbacks
  const { isConnected = false, walletAddress = null } = contextData || {};
  
  const [tokenAccounts, setTokenAccounts] = useState<TokenAccountDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for demo mode
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const demoMode = urlParams.get('demo') === 'true';
        setIsDemo(demoMode);
        
        // If in demo mode, set sample token accounts
        if (demoMode) {
          setTokenAccounts([
            {
              mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              amount: 127.35,
              decimals: 6,
              displayMint: 'EPjF...Dt1v (USDC)'
            },
            {
              mint: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
              amount: 25.2,
              decimals: 8,
              displayMint: '7vfC...voxs (ETH)'
            },
            {
              mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
              amount: 15.75,
              decimals: 6,
              displayMint: 'Es9v...wNYB (USDT)'
            }
          ]);
        }
      }
    } catch (e) {
      logger.error("Failed to check for demo mode", e);
    }
  }, []);

  // Only fetch token accounts if not in demo mode
  useEffect(() => {
    if (!isDemo && isConnected && walletAddress) {
      fetchTokenAccounts();
    } else if (!isDemo) {
      setTokenAccounts([]);
    }
  }, [isConnected, walletAddress, isDemo]);

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
      
      if (!accountsData || !accountsData.value) {
        throw new Error('Invalid response from token accounts API');
      }
      
      const processedAccounts = accountsData.value
        .filter((account: any) => {
          try {
            const info = account?.account?.data?.parsed?.info;
            return info?.tokenAmount?.uiAmount > 0;
          } catch (e) {
            return false;
          }
        })
        .map((account: any) => {
          try {
            const info = account.account.data.parsed.info;
            return {
              mint: info.mint,
              amount: info.tokenAmount.uiAmount,
              decimals: info.tokenAmount.decimals,
              displayMint: `${info.mint.slice(0, 4)}...${info.mint.slice(-4)}`
            };
          } catch (e) {
            return null;
          }
        })
        .filter(Boolean); // Remove any null entries
      
      setTokenAccounts(processedAccounts);
      logger.info(`Found ${processedAccounts.length} token accounts with balances`);
    } catch (err) {
      logger.error('Error fetching token accounts:', err);
      setError('Failed to load token accounts');
      
      // Use fallback data on error
      setTokenAccounts([
        {
          mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          amount: 50.0,
          decimals: 6,
          displayMint: 'EPjF...Dt1v (USDC)'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Error fallback
  if (hasError) {
    return (    <div className={cn("p-4 border border-red-500/20 rounded bg-sapphire-900/50 backdrop-blur", className)}>    
        <h2 className="text-lg font-cyber text-red-400 mb-4">Wallet Dashboard (Error)</h2>    <p className="text-red-400/70 mb-2">There was an error loading the wallet dashboard.</p>    <a href="/dashboard?demo=true" className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
          Try Demo Mode
        </a>
      </div>
    );
  }

  // Demo mode content
  if (isDemo) {
    return (    <div className={cn("p-4 border border-amber-500/30 rounded bg-sapphire-900/50 backdrop-blur", className)}>    
        <div className="flex justify-between">    
        <h2 className="text-lg font-cyber text-amber-400 mb-4">Demo Wallet Dashboard</h2>    <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded-full">Demo Mode</span>
        </div>    <div className="mb-4">    
        <div className="text-amber-400/70 mb-1">Demo Address</div>    <div className="text-amber-400 font-mono text-sm break-all">
            3XtdRgHqGKnD91souCKp4Ys6CwDvPpvQc2kzwMPMAcrs
          </div>
        </div>    <div className="mb-4">    
        <div className="text-amber-400/70 mb-1">SOL Balance</div>    <div className="text-amber-400 text-2xl font-bold">5.23 SOL</div>
        </div>    <div>    
        <div className="flex justify-between items-center mb-2">    
        <div className="text-amber-400/70">Demo Token Balances</div>    <button 
              className="text-xs bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 px-2 py-1 rounded"
              disabled
            >
              Demo Data
            </button>
          </div>    <div className="space-y-2">
            {tokenAccounts.map((token, index) => (    <div key={index} className="flex justify-between py-1 border-b border-amber-400/10">    <span className="text-amber-400/70">{token.displayMint}</span>    <span className="text-amber-400">{token.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Not connected state
  if (!isConnected) {
    return (    <div className={cn("p-4 border border-emerald-400/20 rounded bg-sapphire-900/50 backdrop-blur", className)}>    
        <h2 className="text-lg font-cyber text-emerald-400 mb-4">Wallet Dashboard</h2>    <p className="text-emerald-400/70">Connect your wallet to view your balances and tokens</p>
      </div>
    );
  }

  // Connected state
  return (    <div className={cn("p-4 border border-emerald-400/20 rounded bg-sapphire-900/50 backdrop-blur", className)}>    
        <h2 className="text-lg font-cyber text-emerald-400 mb-4">Wallet Dashboard</h2>    <div className="mb-4">    
        <div className="text-emerald-400/70 mb-1">Connected Address</div>    <div className="text-emerald-400 font-mono text-sm break-all">
          {walletAddress}
        </div>
      </div>    <div className="mb-4">    
        <div className="text-emerald-400/70 mb-1">SOL Balance (Live)</div>    <LiveWalletBalance />
      </div>    <div>    
        <div className="flex justify-between items-center mb-2">    
        <div className="text-emerald-400/70">Token Balances</div>    <button 
            onClick={fetchTokenAccounts}
            disabled={isLoading}
            className="text-xs bg-emerald-400/10 hover:bg-emerald-400/20 text-emerald-400 px-2 py-1 rounded"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        
        {error && (    <div className="text-red-400 text-sm mb-2">{error}</div>
        )}
        
        {isLoading ? (    <div className="space-y-2">    
        <Skeleton className="h-8 w-full bg-emerald-400/5" />    
        <Skeleton className="h-8 w-full bg-emerald-400/5" />    
        <Skeleton className="h-8 w-full bg-emerald-400/5" />
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