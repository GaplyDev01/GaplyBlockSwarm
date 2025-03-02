import { Connection, PublicKey, Commitment } from '@solana/web3.js';
import { logger } from '../logger';
import { SolanaRpcInterface } from './types';

/**
 * SolanaRpc implementation for interacting with Solana blockchain
 */
export class SolanaRpc implements SolanaRpcInterface {
  private connection: Connection;

  constructor(
    endpoint: string = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    commitment: Commitment = 'confirmed'
  ) {
    this.connection = new Connection(endpoint, {
      commitment,
      wsEndpoint: process.env.NEXT_PUBLIC_SOLANA_WSS_URL,
    });
    logger.info(`SolanaRpc initialized with endpoint: ${endpoint}`);
  }

  /**
   * Get the latest blockhash from the Solana network
   */
  async getLatestBlockhash(commitment?: string): Promise<unknown> {
    try {
      return await this.connection.getLatestBlockhash(commitment as Commitment);
    } catch (error) {
      logger.error('Error getting latest blockhash:', error);
      throw error;
    }
  }

  /**
   * Get the current block height
   */
  async getBlockHeight(commitment?: string): Promise<number> {
    try {
      return await this.connection.getBlockHeight(commitment as Commitment);
    } catch (error) {
      logger.error('Error getting block height:', error);
      throw error;
    }
  }

  /**
   * Get the SOL balance for a wallet address
   */
  async getBalance(address: string, commitment?: string): Promise<number> {
    try {
      const pubkey = new PublicKey(address);
      return await this.connection.getBalance(pubkey, commitment as Commitment);
    } catch (error) {
      logger.error('Error getting balance:', error);
      throw error;
    }
  }

  /**
   * Check if the connection to the Solana network is healthy
   */
  async getHealth(): Promise<string> {
    try {
      // Check health by getting the version
      await this.connection.getVersion();
      return 'ok';
    } catch (error) {
      logger.error('Error getting health:', error);
      return 'unhealthy';
    }
  }

  /**
   * Get token accounts owned by an address
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

      // TypeScript workaround - explicitly specify the required parameters
      // and use 'as any' for the options which has additional properties
      return await this.connection.getTokenAccountsByOwner(
        pubkey, 
        filter, 
        { commitment: commitment as Commitment } as any
      );
    } catch (error) {
      logger.error('Error getting token accounts:', error);
      throw error;
    }
  }

  /**
   * Get transaction details by signature
   */
  async getTransaction(signature: string, options: unknown): Promise<unknown> {
    try {
      return await this.connection.getTransaction(signature, options as any);
    } catch (error) {
      logger.error('Error getting transaction:', error);
      throw error;
    }
  }
  
  /**
   * Subscribe to account changes
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
          logger.info(`Account ${publicKey.slice(0, 8)}... changed`);
          callback(accountInfo);
        },
        commitment as Commitment
      );
      logger.info(`Subscribed to account ${publicKey.slice(0, 8)}... changes`);
      return subscriptionId;
    } catch (error) {
      logger.error(`Error subscribing to account ${publicKey}:`, error);
      throw error;
    }
  }
  
  /**
   * Unsubscribe from account or program changes
   */
  async unsubscribe(subscriptionId: number): Promise<boolean> {
    try {
      await this.connection.removeAccountChangeListener(subscriptionId);
      logger.info(`Unsubscribed from subscription ${subscriptionId}`);
      return true; // Return a boolean instead of the void result from removeAccountChangeListener
    } catch (error) {
      logger.error(`Error unsubscribing from ${subscriptionId}:`, error);
      throw error;
    }
  }

  /**
   * Get Solana network version information
   */
  async getVersion(): Promise<Record<string, any>> {
    try {
      const version = await this.connection.getVersion();
      return version;
    } catch (error) {
      logger.error('Error getting Solana version:', error);
      throw error;
    }
  }

  /**
   * Get signatures for an address
   */
  async getSignaturesForAddress(
    address: string,
    options?: { limit?: number; before?: string; until?: string }
  ): Promise<unknown> {
    try {
      const pubkey = new PublicKey(address);
      return await this.connection.getSignaturesForAddress(pubkey, options);
    } catch (error) {
      logger.error(`Error getting signatures for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get the underlying Connection object
   */
  getConnection(): Connection {
    return this.connection;
  }
}

// Create and export default instance
export const solanaRpc = new SolanaRpc();

/**
 * Create a new SolanaRpc instance with a custom endpoint
 */
export function createSolanaRpc(endpoint?: string): SolanaRpcInterface {
  return new SolanaRpc(endpoint);
}