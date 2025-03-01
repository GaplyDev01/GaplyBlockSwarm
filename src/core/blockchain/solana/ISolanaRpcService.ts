/**
 * Interface for Solana RPC Service
 * Defines the contract for direct RPC interactions with Solana nodes
 */
export interface ISolanaRpcService {
  /**
   * Get the latest blockhash from the Solana network
   * @param commitment Optional commitment level
   * @returns Promise with blockhash details
   */
  getLatestBlockhash(commitment?: string): Promise<unknown>;
  
  /**
   * Get the current block height
   * @param commitment Optional commitment level
   * @returns Promise with the block height
   */
  getBlockHeight(commitment?: string): Promise<number>;
  
  /**
   * Get the SOL balance for a wallet address
   * @param address The wallet address
   * @param commitment Optional commitment level
   * @returns Promise with the balance in lamports
   */
  getBalance(address: string, commitment?: string): Promise<number>;
  
  /**
   * Check if the connection to the Solana network is healthy
   * @returns Promise with health status
   */
  getHealth(): Promise<string>;
  
  /**
   * Get token accounts owned by an address
   * @param owner The owner's address
   * @param options Options for filtering token accounts
   * @param commitment Optional commitment level
   * @returns Promise with token account information
   */
  getTokenAccountsByOwner(
    owner: string, 
    options: { mint?: string; programId?: string },
    commitment?: string
  ): Promise<unknown>;
  
  /**
   * Get transaction details by signature
   * @param signature The transaction signature
   * @param options Options for fetching transaction
   * @returns Promise with transaction details
   */
  getTransaction(signature: string, options: unknown): Promise<unknown>;
  
  /**
   * Subscribe to account changes
   * @param publicKey The account public key
   * @param callback Callback to be invoked on account changes
   * @param commitment Optional commitment level
   * @returns Promise with subscription ID
   */
  subscribeToAccount(
    publicKey: string, 
    callback: (accountInfo: unknown) => void,
    commitment?: string
  ): Promise<number>;
  
  /**
   * Unsubscribe from account or program changes
   * @param subscriptionId The subscription ID to unsubscribe
   * @returns Promise indicating success
   */
  unsubscribe(subscriptionId: number): Promise<boolean>;
}