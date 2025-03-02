import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';
import { logger } from '@/src/shared/utils/logger';
import { SolanaServiceFactory } from './SolanaServiceFactory';
import { SolanaService } from '@/src/core/blockchain/solana/SolanaService';

// Create and export a Solana service instance
const solanaFactory = new SolanaServiceFactory();
const solanaService = solanaFactory.createSolanaService();

// Default export for the Solana service
export default function getSolanaService(): SolanaService {
  return solanaService;
}
