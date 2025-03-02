'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useWalletStore } from '../../../shared/store';
import { ISolanaService, WalletBalance, TransactionInfo } from '../../../core/blockchain/solana/ISolanaService';
import { solanaServiceFactory } from '../../../infrastructure/blockchain/solana/SolanaServiceFactory';
import { logger } from '../../../shared/utils/logger/PinoLogger';
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
  useWallet,
} from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork, WalletReadyState } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

// Define the proper type for our wallet adapters
type WalletAdapter = PhantomWalletAdapter | SolflareWalletAdapter;

/**
 * Wallet context interface
 */
interface WalletContextType {
  isConnected: boolean;
  isConnecting: boolean;
  walletAddress: string | null;
  balance: number;
  balances: WalletBalance[];
  isLoadingBalances: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshBalances: () => Promise<WalletBalance[]>;
  getTransactions: () => Promise<TransactionInfo[]>;
}

// Create context with default values
const WalletContext = createContext<WalletContextType>({
  isConnected: false,
  isConnecting: false,
  walletAddress: null,
  balance: 0,
  balances: [],
  isLoadingBalances: false,
  error: null,
  connect: async () => {},
  disconnect: async () => {},
  refreshBalances: async () => [],
  getTransactions: async () => [],
});

// Export context hook
export const useWalletContext = () => useContext(WalletContext);

/**
 * Inner wallet provider that uses the adapter
 */
const InnerWalletProvider = ({
  children,
  wallets,
}: {
  children: ReactNode;
  wallets: WalletAdapter[];
}) => {
  // Get wallet adapter from Solana
  const {
    select,
    connect: connectWallet,
    disconnect: disconnectWallet,
    connected,
    publicKey,
    connecting,
  } = useWallet();
  
  const [isLoadingBalances, setIsLoadingBalances] = useState<boolean>(false);
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Get wallet store
  const { 
    setWalletState, 
    setBalances: setStoreBalances,
    setLoading,
    setError: setStoreError,
  } = useWalletStore();
  
  // Get Solana service
  const solanaService = solanaServiceFactory.getSolanaService();

  // Connect to Solana service when wallet connects
  useEffect(() => {
    let isMounted = true;

    async function syncWallet() {
      if (!publicKey || !connected) {
        if (isMounted) {
          setWalletState(false, null, 0);
          setBalances([]);
          setStoreBalances([]);
        }
        return;
      }

      try {
        // Connect to Solana service
        const { success, address } = await solanaService.connectWallet(publicKey.toString());
        
        if (success && address) {
          // Fetch initial balances
          setIsLoadingBalances(true);
          setLoading(true);
          setStoreError(null);
          setError(null);
          
          const walletBalances = await solanaService.getWalletBalances();
          
          if (isMounted) {
            setBalances(walletBalances);
            setStoreBalances(walletBalances);
            
            // Find SOL balance
            const solBalance = walletBalances.find(b => b.symbol === 'SOL')?.amount || 0;
            
            // Update wallet state
            setWalletState(connected, address, solBalance);
          }
        } else {
          if (isMounted) {
            setStoreError('Failed to connect to Solana service');
            setError('Failed to connect to Solana service');
          }
        }
      } catch (error) {
        if (isMounted) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          setStoreError(errorMessage);
          setError(errorMessage);
          logger.error('Error syncing wallet with Solana service', error);
        }
      } finally {
        if (isMounted) {
          setIsLoadingBalances(false);
          setLoading(false);
        }
      }
    }

    syncWallet();

    return () => {
      isMounted = false;
    };
  }, [connected, publicKey, setWalletState, setStoreBalances, setLoading, setStoreError, solanaService]);

  // Connect wallet function
  const connect = async () => {
    try {
      logger.info('WalletContext: Connecting wallet');
      setError(null);
      setStoreError(null);

      // Check if already connecting to avoid multiple connection attempts
      if (connecting) {
        logger.info('WalletContext: Already connecting to wallet');
        return;
      }

      // Find available wallets (installed or loadable)
      const availableWallets = wallets.filter(
        adapter =>
          adapter.readyState === WalletReadyState.Installed ||
          adapter.readyState === WalletReadyState.Loadable
      );

      // If no wallets available, prompt user to install one
      if (availableWallets.length === 0) {
        const detectedWallets = wallets.filter(
          adapter => adapter.readyState === WalletReadyState.NotDetected
        );
        
        if (detectedWallets.length > 0) {
          // There are wallets supported but not installed
          const walletNames = detectedWallets.map(w => w.name).join(', ');
          throw new Error(`No wallet detected. Please install one of these wallets: ${walletNames}`);
        } else {
          throw new Error('No compatible wallet adapters available');
        }
      }

      // Prioritize wallet selection:
      // 1. Phantom (most commonly used)
      // 2. Solflare (second most popular)
      // 3. First available wallet
      const phantomWallet = availableWallets.find(adapter =>
        adapter.name.toLowerCase().includes('phantom')
      );
      
      const solflareWallet = availableWallets.find(adapter =>
        adapter.name.toLowerCase().includes('solflare')
      );
      
      // Safe wallet selection with fallbacks
      const walletToSelect = phantomWallet || solflareWallet || (availableWallets.length > 0 ? availableWallets[0] : null);
      
      // Only proceed if we have a wallet to select
      if (walletToSelect) {
        logger.info('WalletContext: Selecting wallet:', walletToSelect.name);
        
        // Select the wallet if name property exists
        if (typeof walletToSelect.name === 'string') {
          select(walletToSelect.name);
        } else {
          logger.error('WalletContext: Selected wallet has no name property');
          setError('Invalid wallet configuration');
          setStoreError('Invalid wallet configuration');
          return;
        }
      } else {
        logger.error('WalletContext: No wallets available for selection');
        setError('No wallets available');
        setStoreError('No wallets available');
        return;
      }

      // Allow time for selection to register
      await new Promise(resolve => setTimeout(resolve, 300));

      // Set a connection timeout
      const connectionTimeout = setTimeout(() => {
        if (!connected) {
          logger.warn('WalletContext: Wallet connection timed out');
          setError('Wallet connection timed out. Please try again.');
          setStoreError('Wallet connection timed out. Please try again.');
        }
      }, 30000); // 30 second timeout

      try {
        // Connect the wallet
        await connectWallet();
        logger.info('WalletContext: Wallet connected successfully');
        clearTimeout(connectionTimeout);
      } catch (connectError) {
        clearTimeout(connectionTimeout);
        
        // Handle connection errors
        if (connectError instanceof Error) {
          if (connectError.message.includes('User rejected')) {
            throw new Error('Connection rejected by user');
          } else if (connectError.message.includes('timeout')) {
            throw new Error('Connection timed out. Please try again.');
          }
        }
        throw connectError;
      }
    } catch (error) {
      // Format error message for user display
      let errorMessage = 'Failed to connect wallet';
      
      if (error instanceof Error) {
        // Categorize common errors with user-friendly messages
        if (error.message.includes('rejected')) {
          errorMessage = 'Connection rejected. Please approve the connection request.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Connection timed out. Please try again.';
        } else if (error.message.includes('install')) {
          errorMessage = error.message; // Keep installation instructions
        } else {
          errorMessage = `Connection error: ${error.message}`;
        }
      }
      
      setError(errorMessage);
      setStoreError(errorMessage);
      logger.error('Failed to connect wallet:', error);
      throw new Error(errorMessage);
    }
  };

  // Disconnect wallet function
  const disconnect = async () => {
    try {
      logger.info('WalletContext: Disconnecting wallet');
      
      // Even if we encounter errors, we want to clean up local state
      let encounteredError = false;
      let errorDetails = '';
      
      // First disconnect from Solana service
      try {
        await solanaService.disconnectWallet();
      } catch (serviceError) {
        encounteredError = true;
        errorDetails = serviceError instanceof Error ? serviceError.message : 'Unknown service error';
        logger.error('WalletContext: Error disconnecting from Solana service:', serviceError);
      }
      
      // Then disconnect wallet adapter
      try {
        await disconnectWallet();
      } catch (adapterError) {
        if (!encounteredError) {
          encounteredError = true;
          errorDetails = adapterError instanceof Error ? adapterError.message : 'Unknown adapter error';
        }
        logger.error('WalletContext: Error disconnecting wallet adapter:', adapterError);
      }
      
      // Update states regardless of errors to ensure clean disconnection
      setWalletState(false, null, 0);
      setBalances([]);
      setStoreBalances([]);
      
      // Clear any cached data
      if (encounteredError) {
        // Report error but don't throw since we've already cleaned up state
        const errorMessage = `Warning: Encountered issues during disconnect: ${errorDetails}`;
        setError(errorMessage);
        setStoreError(errorMessage);
        logger.warn(errorMessage);
      } else {
        // Clear any errors if disconnection was successful
        setError(null);
        setStoreError(null);
        logger.info('WalletContext: Wallet disconnected successfully');
      }
    } catch (error) {
      // This catch should only trigger for unexpected errors in our cleanup logic
      const errorMessage = error instanceof Error ? error.message : 'Failed to disconnect wallet';
      setError(errorMessage);
      setStoreError(errorMessage);
      logger.error('WalletContext: Critical error during wallet disconnection:', error);
      
      // Still attempt to reset wallet state
      setWalletState(false, null, 0);
      setBalances([]);
      setStoreBalances([]);
    }
  };
  
  // Function to refresh balances
  const refreshBalances = async (): Promise<WalletBalance[]> => {
    if (!connected || !publicKey) {
      return [];
    }
    
    try {
      setIsLoadingBalances(true);
      setLoading(true);
      setError(null);
      setStoreError(null);
      
      const walletBalances = await solanaService.getWalletBalances();
      
      setBalances(walletBalances);
      setStoreBalances(walletBalances);
      
      // Find SOL balance
      const solBalance = walletBalances.find(b => b.symbol === 'SOL')?.amount || 0;
      
      // Update wallet state with new SOL balance
      setWalletState(connected, publicKey.toString(), solBalance);
      
      return walletBalances;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh balances';
      setError(errorMessage);
      setStoreError(errorMessage);
      logger.error('Error refreshing balances:', error);
      return [];
    } finally {
      setIsLoadingBalances(false);
      setLoading(false);
    }
  };
  
  // Function to get transaction history
  const getTransactions = async (): Promise<TransactionInfo[]> => {
    if (!connected || !publicKey) {
      return [];
    }
    
    try {
      return await solanaService.getTransactionHistory();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get transactions';
      setError(errorMessage);
      setStoreError(errorMessage);
      logger.error('Error getting transactions:', error);
      return [];
    }
  };

  // Provide the context values
  const contextValue: WalletContextType = {
    isConnected: connected,
    isConnecting: connecting,
    walletAddress: publicKey ? publicKey.toString() : null,
    balance: balances.find(b => b.symbol === 'SOL')?.amount || 0,
    balances,
    isLoadingBalances,
    error,
    connect,
    disconnect,
    refreshBalances,
    getTransactions,
  };

  return <WalletContext.Provider value={contextValue}>{children}</WalletContext.Provider>;
};

/**
 * Wallet provider component
 */
export function WalletProvider({ children }: { children: ReactNode }) {
  // Get RPC endpoint from environment
  const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 
    (process.env.NODE_ENV === 'production' 
      ? 'https://api.mainnet-beta.solana.com' 
      : 'https://api.devnet.solana.com');

  // Define supported wallets
  const wallets = React.useMemo(() => [
    new PhantomWalletAdapter(), 
    new SolflareWalletAdapter()
  ], []);

  // Return provider with Solana wallet adapters
  return (<ConnectionProvider endpoint={endpoint}>    <SolanaWalletProvider wallets={wallets} autoConnect>    <WalletModalProvider>    <InnerWalletProvider wallets={wallets}>
            {children}
          </InnerWalletProvider>
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}