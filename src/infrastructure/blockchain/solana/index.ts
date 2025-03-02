import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';
import { logger } from '../../../shared/utils/logger';
import { SolanaServiceFactory, solanaServiceFactory } from './SolanaServiceFactory';
import { SolanaService } from '../../../core/blockchain/solana/SolanaService';
import { ISolanaService } from '../../../core/blockchain/solana/ISolanaService';

// Mock service for server-side rendering and client fallback
const mockSolanaService: ISolanaService = {
  connectWallet: async () => ({ success: true, address: '3XtdRgHqGKnD91souCKp4Ys6CwDvPpvQc2kzwMPMAcrs' }),
  disconnectWallet: async () => true,
  getWalletBalances: async () => ([{
    token: 'Solana',
    symbol: 'SOL',
    amount: 5.23,
    valueUsd: 700.82
  }]),
  getTokenList: async () => ([]),
  executeTrade: async () => ({ success: true, trade: { id: '123', type: 'buy', amount: 1, price: 100 } as any }),
  getTransactionHistory: async () => ([])
};

// Default export for the Solana service
export default function getSolanaService(): ISolanaService {
  // Safely try to get the service from the factory
  try {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      // On the client side, we can use the factory's getSolanaService method
      return solanaServiceFactory.getSolanaService();
    }
    
    // For server-side rendering, return the mock service
    return mockSolanaService;
  } catch (error) {
    // Log the error and return the mock service as a fallback
    logger.error('Error creating Solana service:', error);
    return mockSolanaService;
  }
}
