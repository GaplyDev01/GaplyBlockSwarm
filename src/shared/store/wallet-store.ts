import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { WalletBalance } from '../../core/blockchain/solana/ISolanaService';

/**
 * Wallet store state interface
 */
interface WalletState {
  isConnected: boolean;
  walletAddress: string | null;
  balance: number;
  balances: WalletBalance[];
  loading: boolean;
  error: string | null;
  
  // Actions
  setWalletState: (
    connected: boolean,
    address: string | null,
    balance: number
  ) => void;
  setBalances: (balances: WalletBalance[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  disconnect: () => void;
}

/**
 * Wallet store for managing wallet state
 */
export const useWalletStore = create<WalletState>()(
  devtools(
    persist(
      (set) => ({
        // State
        isConnected: false,
        walletAddress: null,
        balance: 0,
        balances: [],
        loading: false,
        error: null,
        
        // Actions
        setWalletState: (connected, address, balance) => set({
          isConnected: connected,
          walletAddress: address,
          balance,
          error: null,
        }),
        
        setBalances: (balances) => set({ balances }),
        
        setLoading: (loading) => set({ loading }),
        
        setError: (error) => set({ error }),
        
        disconnect: () => set({
          isConnected: false,
          walletAddress: null,
          balance: 0,
          balances: [],
        }),
      }),
      {
        name: 'wallet-store',
        // Don't actually store sensitive wallet data in localStorage
        partialize: (state) => ({ 
          balances: state.balances,
        }),
      }
    )
  )
);