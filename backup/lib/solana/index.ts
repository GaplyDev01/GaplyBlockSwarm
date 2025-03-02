import { logger } from '../logger';
import { SolanaService } from './types';
import { realSolanaService } from './real';
import { mockSolanaService } from './mock';
import { solanaServiceV2 } from './v2';

export * from './types';
export * from './rpc';
export * from './v2';

// Singleton instance for Solana service
let solanaServiceInstance: SolanaService | null = null;

/**
 * Factory function to get the appropriate Solana service
 * based on environment configuration
 */
export function getSolanaService(): SolanaService {
  // If we already have an instance, return it
  if (solanaServiceInstance) {
    return solanaServiceInstance;
  }

  // Determine which implementation to use
  const useRealImplementation = process.env.NEXT_PUBLIC_USE_REAL_SOLANA === 'true';
  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const useV2Implementation = process.env.NEXT_PUBLIC_USE_SOLANA_V2 === 'true';
  
  // V2 implementation takes priority if enabled
  if (useV2Implementation) {
    logger.info('Using Solana V2 service implementation');
    solanaServiceInstance = solanaServiceV2;
  } else if (useRealImplementation && !useMockData) {
    logger.info('Using real Solana service implementation');
    solanaServiceInstance = realSolanaService;
  } else {
    logger.info('Using mock Solana service implementation');
    solanaServiceInstance = mockSolanaService;
  }

  return solanaServiceInstance;
}

// Export default getSolanaService function instead of the instance
// This way you can import getSolanaService and call it when needed
export default getSolanaService;