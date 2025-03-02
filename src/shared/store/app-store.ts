import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TokenInfo } from '../types/tokens';

// TradeInfo interface definition
interface TradeInfo {
  id: string;
  tokenSymbol: string;
  tokenAddress: string;
  amount: number;
  price: number;
  timestamp: number;
  type: 'buy' | 'sell';
}

interface GlobalStoreState {
  // Wallet state
  connected: boolean;
  walletAddress: string | null;
  balance: number;
  setWalletState: (connected: boolean, address: string | null, balance?: number) => void;
  
  // RPC endpoint
  rpcEndpoint: string;
  setRpcEndpoint: (endpoint: string) => void;
  
  // Selected token for analysis
  selectedToken: TokenInfo | null;
  setSelectedToken: (token: TokenInfo | null) => void;
  
  // Trades
  trades: TradeInfo[];
  addTrade: (trade: TradeInfo) => void;
  removeTrade: (tradeId: string) => void;
  
  // UI state
  darkMode: boolean;
  toggleDarkMode: () => void;
  
  // AI model preferences
  preferredModel: 'gpt-4' | 'claude' | 'llama3' | string;
  setPreferredModel: (model: string) => void;
}

// Create the store with persistence
export const useAppStore = create<GlobalStoreState>()(
  persist(
    (set) => ({
      // Wallet state
      connected: false,
      walletAddress: null,
      balance: 0,
      setWalletState: (connected, address, balance = 0) => set({ connected, walletAddress: address, balance }),
      
      // RPC endpoint
      rpcEndpoint: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
      setRpcEndpoint: (endpoint) => set({ rpcEndpoint: endpoint }),
      
      // Selected token
      selectedToken: null,
      setSelectedToken: (token) => set({ selectedToken: token }),
      
      // Trades
      trades: [],
      addTrade: (trade) => set((state) => ({ trades: [trade, ...state.trades] })),
      removeTrade: (tradeId) => set((state) => ({ 
        trades: state.trades.filter(trade => trade.id !== tradeId) 
      })),
      
      // UI state
      darkMode: true,
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      
      // AI model preferences
      preferredModel: 'claude',
      setPreferredModel: (model) => set({ preferredModel: model }),
    }),
    {
      name: 'blockswarms-storage',
      partialize: (state) => ({
        darkMode: state.darkMode,
        preferredModel: state.preferredModel,
        rpcEndpoint: state.rpcEndpoint,
        trades: state.trades.slice(0, 10), // Only persist the 10 most recent trades
      }),
    }
  )
);