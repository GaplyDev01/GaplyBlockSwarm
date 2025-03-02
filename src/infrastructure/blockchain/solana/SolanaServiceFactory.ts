import { ISolanaService } from '../../../core/blockchain/solana/ISolanaService';
import { ISolanaRpcService } from '../../../core/blockchain/solana/ISolanaRpcService';
import { SolanaService } from '../../../core/blockchain/solana/SolanaService';
import { SolanaRpcService } from './SolanaRpcService';
import { logger } from '../../../shared/utils/logger/PinoLogger';
import { ILogger } from '../../../shared/utils/logger/ILogger';

/**
 * Factory class for creating and managing Solana service instances
 */
export class SolanaServiceFactory {
  private static instance: SolanaServiceFactory;
  private solanaService: ISolanaService | null = null;
  private solanaRpcService: ISolanaRpcService | null = null;
  private logger: ILogger;
  
  private constructor() {
    this.logger = logger.child({ module: 'SolanaServiceFactory' });
  }
  
  /**
   * Create a new Solana service
   * @param useMock Whether to use mock data
   * @returns Promise resolving to a Solana service
   */
  public async createService(useMock: boolean = false): Promise<ISolanaService> {
    return this.getSolanaService(useMock);
  }
  
  /**
   * Get the singleton instance of the factory
   * @returns SolanaServiceFactory instance
   */
  public static getInstance(): SolanaServiceFactory {
    if (!SolanaServiceFactory.instance) {
      SolanaServiceFactory.instance = new SolanaServiceFactory();
    }
    return SolanaServiceFactory.instance;
  }
  
  /**
   * Get or create the SolanaRpcService
   * @param endpoint Optional RPC endpoint URL (defaults to environment variable)
   * @returns SolanaRpcService instance
   */
  public getSolanaRpcService(endpoint?: string): ISolanaRpcService {
    if (!this.solanaRpcService) {
      this.solanaRpcService = new SolanaRpcService(
        this.logger, 
        endpoint || process.env.NEXT_PUBLIC_SOLANA_RPC_URL
      );
      this.logger.info('Created SolanaRpcService');
    } else if (endpoint) {
      // If a different endpoint is requested, create a new instance
      this.solanaRpcService = new SolanaRpcService(this.logger, endpoint);
      this.logger.info(`Created new SolanaRpcService with endpoint: ${endpoint}`);
    }
    
    return this.solanaRpcService;
  }
  
  /**
   * Get or create the SolanaService
   * @param useMock Whether to use mock data (defaults to false)
   * @returns SolanaService instance
   */
  public getSolanaService(useMock: boolean = false): ISolanaService {
    if (!this.solanaService) {
      // Ensure RPC service exists
      const rpcService = this.getSolanaRpcService();
      
      // Create Solana service
      this.solanaService = new SolanaService(this.logger, rpcService);
      this.logger.info(`Created SolanaService (useMock: ${useMock})`);
    }
    
    return this.solanaService;
  }
  
  /**
   * Set a new RPC endpoint for the Solana services
   * @param endpoint The new RPC endpoint URL
   */
  public setEndpoint(endpoint: string): void {
    // Create a new RPC service with the new endpoint
    this.solanaRpcService = new SolanaRpcService(this.logger, endpoint);
    
    // Update the endpoint on the Solana service if it exists
    if (this.solanaService && typeof this.solanaService === 'object' && 'setEndpoint' in this.solanaService) {
      (this.solanaService as any).setEndpoint(endpoint);
    }
    
    this.logger.info(`Updated RPC endpoint to: ${endpoint}`);
  }
}

// Export a singleton instance for convenience
export const solanaServiceFactory = SolanaServiceFactory.getInstance();