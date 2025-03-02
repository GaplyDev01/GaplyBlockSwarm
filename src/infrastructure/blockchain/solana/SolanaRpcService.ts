import { Connection, PublicKey, Commitment, ConfirmedSignatureInfo } from '@solana/web3.js';
import { ISolanaRpcService } from '../../../core/blockchain/solana/ISolanaRpcService';
import { logger } from '../../../shared/utils/logger';
import { ILogger } from '../../../shared/utils/logger/ILogger';

/**
 * Implementation of ISolanaRpcService for interacting with Solana blockchain
 */
export class SolanaRpcService implements ISolanaRpcService {
  private connection: Connection;
  private logger: ILogger;

  /**
   * Create a new SolanaRpcService
   * @param endpoint RPC endpoint URL (defaults to environment variable or mainnet)
   * @param commitment Commitment level
   * @param logger Logger instance
   */
  constructor(
    endpoint: string = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    commitment: Commitment = 'confirmed',
    customLogger: ILogger = logger
  ) {
    this.connection = new Connection(endpoint, {
      commitment,
      wsEndpoint: process.env.NEXT_PUBLIC_SOLANA_WSS_URL,
    });
    
    this.logger = customLogger;
    this.logger.info(`SolanaRpcService initialized with endpoint: ${endpoint}`);
  }

  /**
   * Get the latest blockhash from the Solana network
   * @param commitment Optional commitment level
   * @returns Promise with blockhash details
   */
  async getLatestBlockhash(commitment?: string): Promise<unknown> {
    try {
      return await this.connection.getLatestBlockhash(commitment as Commitment);
    } catch (error) {
      this.logger.error('Error getting latest blockhash', error);
      throw error;
    }
  }

  /**
   * Get the current block height
   * @param commitment Optional commitment level
   * @returns Promise with the block height
   */
  async getBlockHeight(commitment?: string): Promise<number> {
    try {
      return await this.connection.getBlockHeight(commitment as Commitment);
    } catch (error) {
      this.logger.error('Error getting block height', error);
      throw error;
    }
  }

  /**
   * Get the SOL balance for a wallet address
   * @param address The wallet address
   * @param commitment Optional commitment level
   * @returns Promise with the balance in lamports
   */
  async getBalance(address: string, commitment?: string): Promise<number> {
    try {
      const pubkey = new PublicKey(address);
      return await this.connection.getBalance(pubkey, commitment as Commitment);
    } catch (error) {
      this.logger.error(`Error getting balance for address ${address}`, error);
      throw error;
    }
  }

  /**
   * Check if the connection to the Solana network is healthy
   * @returns Promise with health status
   */
  async getHealth(): Promise<string> {
    try {
      // Check health by getting the version
      await this.connection.getVersion();
      return 'ok';
    } catch (error) {
      this.logger.error('Error getting health', error);
      return 'unhealthy';
    }
  }

  /**
   * Get token accounts owned by an address
   * @param owner The owner's address
   * @param options Options for filtering token accounts
   * @param commitment Optional commitment level
   * @returns Promise with token account information
   */
  async getTokenAccountsByOwner(
    owner: string, 
    options: { mint?: string; programId?: string },
    commitment?: string
  ): Promise<unknown> {
    try {
      const pubkey = new PublicKey(owner);
      
      if (!options.mint && !options.programId) {
        throw new Error('Either mint or programId must be provided');
      }
      
      const filter = options.mint
        ? { mint: new PublicKey(options.mint) }
        : { programId: new PublicKey(options.programId!) };

      // Use `as any` for the options param to handle unsupported properties
      return await this.connection.getTokenAccountsByOwner(
        pubkey, 
        filter, 
        { commitment: commitment as Commitment } as any
      );
    } catch (error) {
      this.logger.error(`Error getting token accounts for owner ${owner}`, error);
      throw error;
    }
  }

  /**
   * Get transaction details by signature
   * @param signature The transaction signature
   * @param options Options for fetching transaction
   * @returns Promise with transaction details
   */
  async getTransaction(signature: string, options: unknown): Promise<unknown> {
    try {
      return await this.connection.getTransaction(signature, options as any);
    } catch (error) {
      this.logger.error(`Error getting transaction ${signature}`, error);
      throw error;
    }
  }
  
  /**
   * Get signatures for an address
   * @param address The address to get signatures for
   * @param options Options for fetching signatures
   * @returns Promise with signatures information
   */
  async getSignaturesForAddress(
    address: string,
    options?: { limit?: number; before?: string; until?: string },
    commitment?: string
  ): Promise<unknown> {
    try {
      const pubkey = new PublicKey(address);
      const configOptions = commitment ? { ...options, commitment: commitment as Commitment } : options;
      return await this.connection.getSignaturesForAddress(pubkey, configOptions) as ConfirmedSignatureInfo[];
    } catch (error) {
      this.logger.error(`Error getting signatures for address ${address}`, error);
      throw error;
    }
  }
  
  /**
   * Subscribe to account changes
   * @param publicKey The account public key
   * @param callback Callback to be invoked on account changes
   * @param commitment Optional commitment level
   * @returns Promise with subscription ID
   */
  async subscribeToAccount(
    publicKey: string, 
    callback: (accountInfo: unknown) => void,
    commitment?: string
  ): Promise<number> {
    try {
      const accountKey = new PublicKey(publicKey);
      const subscriptionId = this.connection.onAccountChange(
        accountKey,
        (accountInfo) => {
          this.logger.debug(`Account ${publicKey.slice(0, 8)}... changed`);
          callback(accountInfo);
        },
        commitment as Commitment
      );
      this.logger.info(`Subscribed to account ${publicKey.slice(0, 8)}... changes`);
      return subscriptionId;
    } catch (error) {
      this.logger.error(`Error subscribing to account ${publicKey}`, error);
      throw error;
    }
  }
  
  /**
   * Unsubscribe from account or program changes
   * @param subscriptionId The subscription ID to unsubscribe
   * @returns Promise indicating success
   */
  async unsubscribe(subscriptionId: number): Promise<boolean> {
    try {
      // The removeAccountChangeListener method returns void, not boolean
      this.connection.removeAccountChangeListener(subscriptionId);
      this.logger.info(`Unsubscribed from subscription ${subscriptionId}`);
      // Return true to indicate success
      return true;
    } catch (error) {
      this.logger.error(`Error unsubscribing from ${subscriptionId}`, error);
      throw error;
    }
  }

  /**
   * Get the underlying Connection object
   * @returns Solana web3.js Connection instance
   */
  getConnection(): Connection {
    return this.connection;
  }
  
  /**
   * Check if a wallet is connected
   * @returns True if a wallet is currently connected
   */
  isWalletConnected(): boolean {
    return true; // Placeholder implementation
  }
}