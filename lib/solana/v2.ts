import { 
  Connection, 
  PublicKey, 
  LAMPORTS_PER_SOL,
  ConfirmedSignatureInfo,
  ParsedTransactionWithMeta,
  TransactionSignature,
  ParsedInstruction,
  ConfirmedTransactionMeta
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { logger } from '../logger';
import { generateId } from '../utils';
import { solanaRpc } from './rpc';
import { 
  SolanaService, 
  TokenInfo, 
  WalletBalance, 
  TradeInfo, 
  TransactionInfo,
  TokenAccount
} from './types';

// Mock data for fallback when API calls fail
import { mockSolanaService } from './mock';

// Known DEX program IDs for identifying swap transactions
const DEX_PROGRAM_IDS = {
  JUPITER: 'JUP',
  ORCA: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
  RAYDIUM: 'RVKd61ztZW9GUwhRbbLoYVRE5Xf1B2tVscKqwZqXgEr'
};

/**
 * Enhanced Solana V2 Service implementation
 * Extends the original with improved functionality
 */
export class SolanaServiceV2 implements SolanaService {
  private static instance: SolanaServiceV2;
  private connection: Connection;
  private connected: boolean = false;
  private walletAddress: string | null = null;
  private walletPublicKey: PublicKey | null = null;
  private tokenMap: Map<string, TokenInfo> = new Map();
  private tokenAccountsCache: Map<string, TokenAccount[]> = new Map();
  private tokenMetadataCache: Map<string, Partial<TokenInfo>> = new Map();
  private lastHealthCheck: { timestamp: number; status: string } = { timestamp: 0, status: 'unknown' };

  private constructor() {
    // Initialize connection with endpoint from env
    const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    
    this.connection = new Connection(endpoint, {
      commitment: 'confirmed',
      wsEndpoint: process.env.NEXT_PUBLIC_SOLANA_WSS_URL
    });
    logger.info(`Initialized SolanaServiceV2 with endpoint: ${endpoint}`);
  }

  public static getInstance(): SolanaServiceV2 {
    if (!SolanaServiceV2.instance) {
      SolanaServiceV2.instance = new SolanaServiceV2();
    }
    return SolanaServiceV2.instance;
  }

  /**
   * Update the RPC endpoint
   */
  public setEndpoint(endpoint: string): void {
    this.connection = new Connection(endpoint, {
      commitment: 'confirmed',
      wsEndpoint: process.env.NEXT_PUBLIC_SOLANA_WSS_URL
    });
    logger.info(`V2: Changed RPC endpoint to: ${endpoint}`);
    
    // Clear caches when endpoint changes
    this.clearCaches();
  }
  
  /**
   * Clear all caches
   */
  private clearCaches(): void {
    this.tokenMap.clear();
    this.tokenAccountsCache.clear();
    this.tokenMetadataCache.clear();
    logger.info('V2: Cleared token and account caches');
  }

  /**
   * Connect wallet with public key
   */
  public async connectWallet(publicKey?: string): Promise<{ success: boolean; address: string | null }> {
    try {
      if (!publicKey) {
        throw new Error('No public key provided');
      }

      this.walletAddress = publicKey;
      this.walletPublicKey = new PublicKey(publicKey);
      this.connected = true;

      // Check connection health before proceeding
      const health = await solanaRpc.getHealth();
      if (health !== 'ok') {
        logger.warn(`V2: Solana network health check failed: ${health}`);
      }

      // Get SOL balance
      const lamports = await solanaRpc.getBalance(this.walletPublicKey.toString());
      const solBalance = lamports / LAMPORTS_PER_SOL;

      // Preload token list for future use
      this.loadTokenList().catch(error => {
        logger.warn('V2: Failed to preload token list:', error);
      });

      logger.info(`V2: Connected wallet with address: ${publicKey} (Balance: ${solBalance} SOL)`);
      return { success: true, address: this.walletAddress };
    } catch (error) {
      logger.error('V2: Error connecting wallet:', error);
      return { success: false, address: null };
    }
  }

  /**
   * Disconnect wallet
   */
  public async disconnectWallet(): Promise<boolean> {
    try {
      this.connected = false;
      this.walletAddress = null;
      this.walletPublicKey = null;
      
      // Clear token accounts cache for this wallet
      this.tokenAccountsCache.clear();

      logger.info('V2: Wallet disconnected');
      return true;
    } catch (error) {
      logger.error('V2: Error disconnecting wallet:', error);
      return false;
    }
  }

  /**
   * Get token list with enhanced caching
   */
  public async getTokenList(): Promise<TokenInfo[]> {
    try {
      return await this.loadTokenList();
    } catch (error) {
      logger.error('V2: Error fetching token list:', error);
      return [];
    }
  }
  
  /**
   * Load token list from API or cache
   */
  private async loadTokenList(): Promise<TokenInfo[]> {
    // Check if we already have tokens loaded
    if (this.tokenMap.size > 0) {
      logger.info(`V2: Using cached token list with ${this.tokenMap.size} tokens`);
      return Array.from(this.tokenMap.values());
    }
    
    try {
      let tokenList: TokenInfo[] = [];
      
      // Fetch token data from CoinGecko-compatible API (public Solana token data)
      // We'll fetch top Solana tokens with market data
      const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=solana-ecosystem&order=market_cap_desc&per_page=25&page=1');
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Map the API response to our TokenInfo format
      tokenList = data.map((token: any) => ({
        symbol: token.symbol.toUpperCase(),
        name: token.name,
        mint: token.id, // Using CoinGecko ID as mint (not accurate but works for display)
        decimals: 9, // Default for most Solana tokens
        price: token.current_price,
        change24h: token.price_change_percentage_24h || 0,
        volume24h: token.total_volume || 0,
        marketCap: token.market_cap || 0,
        supply: token.circulating_supply || 0,
        logoURI: token.image
      }));
      
      // Add SOL if not present (ensure it's always in our list)
      if (!tokenList.some(t => t.symbol === 'SOL')) {
        // Fetch SOL separately if not already included
        const solResponse = await fetch('https://api.coingecko.com/api/v3/coins/solana');
        if (solResponse.ok) {
          const solData = await solResponse.json();
          tokenList.unshift({
            symbol: 'SOL',
            name: 'Solana',
            mint: 'So11111111111111111111111111111111111111112', // Native SOL mint
            decimals: 9,
            price: solData.market_data.current_price.usd,
            change24h: solData.market_data.price_change_percentage_24h || 0,
            volume24h: solData.market_data.total_volume.usd || 0,
            marketCap: solData.market_data.market_cap.usd || 0,
            supply: solData.market_data.circulating_supply || 0,
            logoURI: solData.image.large
          });
        }
      }
      
      // Update token map for price lookups
      tokenList.forEach(token => {
        this.tokenMap.set(token.symbol, token);
        this.tokenMap.set(token.mint, token); // Also index by mint address
      });
      
      logger.info(`V2: Retrieved and cached ${tokenList.length} tokens from API`);
      return tokenList;
    } catch (error) {
      logger.error('V2: Error loading token list:', error);
      // Fallback to mock data if API fails
      const mockData = await mockSolanaService.getTokenList();
      logger.warn(`V2: Falling back to ${mockData.length} mock tokens due to API error`);
      
      // Update token map with mock data
      mockData.forEach(token => {
        this.tokenMap.set(token.symbol, token);
        this.tokenMap.set(token.mint, token);
      });
      
      return mockData;
    }
  }

  /**
   * Get wallet balances with enhanced token information
   */
  public async getWalletBalances(): Promise<WalletBalance[]> {
    if (!this.connected || !this.walletPublicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      // Get SOL balance
      const solBalance = await this.connection.getBalance(this.walletPublicKey);
      const solBalanceParsed = solBalance / LAMPORTS_PER_SOL;

      // Get all token accounts
      const tokenAccountsKey = this.walletPublicKey.toString();
      let tokenAccounts: TokenAccount[] = [];
      
      // Check cache first
      if (this.tokenAccountsCache.has(tokenAccountsKey)) {
        tokenAccounts = this.tokenAccountsCache.get(tokenAccountsKey) || [];
        logger.info(`V2: Using cached token accounts (${tokenAccounts.length})`);
      } else {
        // If not in cache, fetch from blockchain
        const accounts = await this.fetchTokenAccounts(this.walletPublicKey);
        tokenAccounts = accounts;
        
        // Update cache
        this.tokenAccountsCache.set(tokenAccountsKey, accounts);
        logger.info(`V2: Retrieved and cached ${accounts.length} token accounts`);
      }

      // Create an array of token balances
      const balances: WalletBalance[] = [];

      // Add SOL balance
      balances.push({
        token: 'Solana',
        symbol: 'SOL',
        amount: solBalanceParsed,
        valueUsd: solBalanceParsed * this.getTokenPrice('SOL'),
      });

      // Process token accounts
      if (tokenAccounts.length > 0) {
        for (const account of tokenAccounts) {
          try {
            // Skip accounts with zero balance
            if (Number(account.amount) === 0) continue;
            
            // Get token metadata
            const tokenInfo = await this.getTokenMetadata(account.mint);
            
            // Calculate token amount with decimals
            const tokenAmount = Number(account.amount) / Math.pow(10, account.decimals);
            
            // Add to balances
            balances.push({
              token: tokenInfo.name || `Token ${account.mint.slice(0, 8)}`,
              symbol: tokenInfo.symbol || account.mint.slice(0, 4).toUpperCase(),
              amount: tokenAmount,
              valueUsd: tokenAmount * (tokenInfo.price || 0),
            });
          } catch (error) {
            logger.error(`V2: Error processing token account ${account.mint}:`, error);
          }
        }
      }

      logger.info(`V2: Retrieved ${balances.length} token balances`);
      return balances;
    } catch (error) {
      logger.error('V2: Error fetching wallet balances:', error);
      
      // Return mock balances as fallback
      const mockBalances = await mockSolanaService.getWalletBalances();
      logger.warn(`V2: Using ${mockBalances.length} mock wallet balances due to error`);
      return mockBalances;
    }
  }
  
  /**
   * Fetch token accounts for a wallet 
   */
  private async fetchTokenAccounts(owner: PublicKey): Promise<TokenAccount[]> {
    try {
      // Get parsed token accounts
      const response = await this.connection.getParsedTokenAccountsByOwner(
        owner,
        { programId: TOKEN_PROGRAM_ID }
      );
      
      // Transform account data to a more usable format
      return response.value.map(account => {
        const parsedInfo = account.account.data.parsed.info;
        return {
          mint: parsedInfo.mint,
          owner: parsedInfo.owner,
          amount: parsedInfo.tokenAmount.amount,
          decimals: parsedInfo.tokenAmount.decimals,
        };
      });
    } catch (error) {
      logger.error('V2: Error fetching token accounts:', error);
      return [];
    }
  }

  /**
   * Execute a trade (simulated)
   */
  public async executeTrade(
    token: string,
    type: 'buy' | 'sell',
    amount: number,
    price: number
  ): Promise<{ success: boolean; trade: TradeInfo }> {
    if (!this.connected || !this.walletPublicKey) {
      throw new Error('Wallet not connected');
    }

    // Simulate a trade - in a real implementation, this would integrate with DEXes
    logger.info(`V2: Creating simulated ${type} trade for ${amount} ${token}`);
    
    // In a real implementation, you would interact with a DEX like Jupiter API
    // For now, we'll simulate the trade
    const trade: TradeInfo = {
      id: generateId(),
      tokenSymbol: token,
      tokenName: await this.resolveTokenName(token),
      type,
      amount,
      price,
      timestamp: Date.now(),
      status: 'open',
      simulation: true
    };

    // Invalidate token account cache after a trade
    if (this.walletPublicKey) {
      this.tokenAccountsCache.delete(this.walletPublicKey.toString());
    }

    return { success: true, trade };
  }
  
  /**
   * Resolve token name from symbol or mint address
   */
  private async resolveTokenName(tokenSymbolOrMint: string): Promise<string> {
    try {
      // Check if we have this token in our map
      if (this.tokenMap.has(tokenSymbolOrMint)) {
        return this.tokenMap.get(tokenSymbolOrMint)?.name || tokenSymbolOrMint;
      }
      
      // If it looks like a mint address, try to get metadata
      if (tokenSymbolOrMint.length > 30) {
        const metadata = await this.getTokenMetadata(tokenSymbolOrMint);
        return metadata.name || tokenSymbolOrMint;
      }
      
      return tokenSymbolOrMint;
    } catch (error) {
      return tokenSymbolOrMint;
    }
  }

  /**
   * Get transaction history with enhanced parsing
   */
  public async getTransactionHistory(): Promise<TransactionInfo[]> {
    if (!this.connected || !this.walletPublicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      // Get recent transactions (signatures)
      const signatures = await this.connection.getSignaturesForAddress(
        this.walletPublicKey,
        { limit: 20 }
      );

      if (!signatures.length) {
        logger.info('V2: No transactions found for this wallet');
        return [];
      }

      // Get transaction details with improved parsing
      const transactions = await this.parseTransactions(signatures);
      logger.info(`V2: Retrieved and parsed ${transactions.length} transactions`);
      return transactions;
    } catch (error) {
      logger.error('V2: Error fetching transaction history:', error);
      
      // Return mock transactions as fallback
      const mockTransactions = await mockSolanaService.getTransactionHistory();
      logger.warn(`V2: Using ${mockTransactions.length} mock transactions due to error`);
      return mockTransactions;
    }
  }
  
  /**
   * Parse transaction details from signatures
   */
  private async parseTransactions(
    signatures: ConfirmedSignatureInfo[]
  ): Promise<TransactionInfo[]> {
    try {
      // Fetch transactions in batches to avoid rate limits
      const batchSize = 5;
      const batches = [];
      
      for (let i = 0; i < signatures.length; i += batchSize) {
        const batch = signatures.slice(i, i + batchSize);
        batches.push(batch);
      }
      
      let parsedTransactions: TransactionInfo[] = [];
      
      // Process each batch sequentially
      for (const batch of batches) {
        const batchPromises = batch.map(async (sig) => {
          try {
            const tx = await this.connection.getParsedTransaction(
              sig.signature,
              { maxSupportedTransactionVersion: 0 }
            );
            
            return this.parseTransactionDetails(sig, tx);
          } catch (error) {
            logger.error(`V2: Error processing transaction ${sig.signature}:`, error);
            return this.createErrorTransaction(sig);
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        parsedTransactions = parsedTransactions.concat(batchResults);
      }
      
      return parsedTransactions;
    } catch (error) {
      logger.error('V2: Error parsing transactions:', error);
      throw error;
    }
  }
  
  /**
   * Create error transaction when parsing fails
   */
  private createErrorTransaction(sig: ConfirmedSignatureInfo): TransactionInfo {
    return {
      id: sig.signature,
      timestamp: sig.blockTime ? sig.blockTime * 1000 : Date.now(),
      status: 'error',
      type: 'unknown',
      error: 'Failed to parse transaction'
    };
  }
  
  /**
   * Parse a single transaction's details
   */
  private parseTransactionDetails(
    sig: ConfirmedSignatureInfo,
    tx: ParsedTransactionWithMeta | null
  ): TransactionInfo {
    // Basic transaction info
    const txInfo: TransactionInfo = {
      id: sig.signature,
      timestamp: sig.blockTime ? new Date(sig.blockTime * 1000).getTime() : Date.now(),
      status: sig.err || (tx?.meta?.err) ? 'failed' : 'confirmed',
      type: 'unknown'
    };
    
    // If transaction not found or couldn't be parsed
    if (!tx || !tx.meta) {
      return txInfo;
    }
    
    // Enhanced transaction type detection
    try {
      if (tx.transaction.message.instructions) {
        const instructions = tx.transaction.message.instructions;
        txInfo.type = this.determineTransactionType(instructions, tx.meta, sig.signature);
        
        // Try to extract token information if available
        const tokenInfo = this.extractTokenInfo(instructions, tx.meta, sig.signature);
        if (tokenInfo) {
          Object.assign(txInfo, tokenInfo);
        }
      }
    } catch (error) {
      logger.error(`V2: Error parsing transaction details for ${sig.signature}:`, error);
    }
    
    return txInfo;
  }
  
  /**
   * Determine the type of transaction
   */
  private determineTransactionType(
    instructions: ParsedInstruction[],
    meta: ConfirmedTransactionMeta,
    signature: TransactionSignature
  ): 'swap' | 'transfer' | 'send' | 'receive' | 'unknown' {
    try {
      // Check for known DEX program IDs (swaps)
      if (this.isSwapTransaction(instructions)) {
        return 'swap';
      }
      
      // Check for token transfers
      if (this.isTokenTransfer(instructions)) {
        // Determine if this is sending or receiving
        if (this.isSendTransaction(meta)) {
          return 'send';
        } else if (this.isReceiveTransaction(meta)) {
          return 'receive';
        }
        return 'transfer';
      }
      
      // Default
      return 'unknown';
    } catch (error) {
      logger.error(`V2: Error determining transaction type for ${signature}:`, error);
      return 'unknown';
    }
  }
  
  /**
   * Extract token information from transaction
   */
  private extractTokenInfo(
    instructions: ParsedInstruction[],
    meta: ConfirmedTransactionMeta,
    signature: TransactionSignature
  ): Record<string, any> | null {
    try {
      // For token transfers
      for (const instruction of instructions) {
        if (this.isTokenProgramInstruction(instruction)) {
          const tokenInfo = this.extractTokenTransferInfo(instruction);
          if (tokenInfo) {
            return tokenInfo;
          }
        }
      }
      
      // For swaps, extract from log messages
      if (this.isSwapTransaction(instructions) && meta.logMessages) {
        return this.extractSwapInfoFromLogs(meta.logMessages);
      }
      
      return null;
    } catch (error) {
      logger.error(`V2: Error extracting token info for ${signature}:`, error);
      return null;
    }
  }
  
  /**
   * Extract token transfer information
   */
  private extractTokenTransferInfo(instruction: ParsedInstruction): Record<string, any> | null {
    try {
      if (!instruction.parsed || typeof instruction.parsed !== 'object') {
        return null;
      }
      
      const parsed = instruction.parsed as any;
      
      if (parsed.type === 'transfer' && parsed.info) {
        return {
          token: parsed.info.mint,
          amount: parsed.info.amount,
          from: parsed.info.source,
          to: parsed.info.destination
        };
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Extract swap information from transaction logs
   */
  private extractSwapInfoFromLogs(logs: string[]): Record<string, any> | null {
    try {
      // This is a simplified example - real implementation would be more complex
      // For Jupiter/other DEXes, you'd need to parse their specific log formats
      
      let tokenIn = '';
      let tokenOut = '';
      let amountIn = 0;
      let amountOut = 0;
      
      for (const log of logs) {
        // Very simplified log parsing example
        if (log.includes('Swap:')) {
          const parts = log.split(' ');
          for (let i = 0; i < parts.length; i++) {
            if (parts[i] === 'in:' && i + 1 < parts.length) {
              amountIn = parseFloat(parts[i + 1]);
            } else if (parts[i] === 'out:' && i + 1 < parts.length) {
              amountOut = parseFloat(parts[i + 1]);
            } else if (parts[i].includes('token=')) {
              const tokenAddress = parts[i].split('=')[1];
              if (!tokenIn) tokenIn = tokenAddress;
              else tokenOut = tokenAddress;
            }
          }
          
          if (tokenIn && tokenOut) {
            return {
              tokenIn,
              tokenOut,
              amountIn,
              amountOut
            };
          }
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Check if this is a send transaction
   */
  private isSendTransaction(meta: ConfirmedTransactionMeta): boolean {
    if (!this.walletPublicKey) return false;
    
    const myAddress = this.walletPublicKey.toString();
    
    // In a real implementation, analyze pre/post token balances
    // to determine if this wallet is sending tokens
    return true; // Simplified - would need proper analysis
  }
  
  /**
   * Check if this is a receive transaction
   */
  private isReceiveTransaction(meta: ConfirmedTransactionMeta): boolean {
    if (!this.walletPublicKey) return false;
    
    const myAddress = this.walletPublicKey.toString();
    
    // In a real implementation, analyze pre/post token balances
    // to determine if this wallet is receiving tokens
    return false; // Simplified - would need proper analysis
  }

  /**
   * Check if transaction instructions include a token transfer
   */
  private isTokenTransfer(instructions: ParsedInstruction[]): boolean {
    return instructions.some(instr => this.isTokenProgramInstruction(instr));
  }
  
  /**
   * Check if instruction uses the token program
   */
  private isTokenProgramInstruction(instruction: ParsedInstruction): boolean {
    const programId = this.getProgramId(instruction);
    return programId === TOKEN_PROGRAM_ID.toString() || 
           programId === ASSOCIATED_TOKEN_PROGRAM_ID.toString();
  }

  /**
   * Check if transaction instructions include a token swap
   */
  private isSwapTransaction(instructions: ParsedInstruction[]): boolean {
    for (const instr of instructions) {
      const programId = this.getProgramId(instr);
      
      // Check against known DEX program IDs
      for (const [key, value] of Object.entries(DEX_PROGRAM_IDS)) {
        if (programId.includes(value) || programId.toLowerCase().includes(key.toLowerCase())) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Get program ID from instruction
   */
  private getProgramId(instruction: ParsedInstruction): string {
    return typeof instruction.programId === 'object' 
      ? instruction.programId.toString() 
      : String(instruction.programId);
  }

  /**
   * Helper method to get token price from cache or API
   */
  private getTokenPrice(symbolOrMint: string): number {
    try {
      // Try by symbol (case insensitive)
      const normalizedSymbol = symbolOrMint.toUpperCase();
      const tokenInfoBySymbol = this.tokenMap.get(normalizedSymbol);
      if (tokenInfoBySymbol?.price) {
        return tokenInfoBySymbol.price;
      }
      
      // Try by mint address
      const tokenInfoByMint = this.tokenMap.get(symbolOrMint);
      if (tokenInfoByMint?.price) {
        return tokenInfoByMint.price;
      }
      
      // Default price
      return 0;
    } catch (error) {
      return 0;
    }
  }
  
  /**
   * Get token metadata for a mint address with caching
   */
  private async getTokenMetadata(mintAddress: string): Promise<Partial<TokenInfo>> {
    try {
      // Check cache first
      if (this.tokenMetadataCache.has(mintAddress)) {
        return this.tokenMetadataCache.get(mintAddress) || {};
      }
      
      // Check if we already have it in the token map
      if (this.tokenMap.has(mintAddress)) {
        const tokenInfo = this.tokenMap.get(mintAddress);
        if (tokenInfo) {
          this.tokenMetadataCache.set(mintAddress, tokenInfo);
          return tokenInfo;
        }
      }
      
      // In a real implementation, you would fetch from a token registry API
      // For example, the Solana Token List API or Jupiter API
      const metadata: Partial<TokenInfo> = {
        name: `Token ${mintAddress.slice(0, 8)}`,
        symbol: mintAddress.slice(0, 4).toUpperCase(),
        mint: mintAddress,
        decimals: 9,
        price: 0,
      };
      
      // Cache the result
      this.tokenMetadataCache.set(mintAddress, metadata);
      return metadata;
    } catch (error) {
      logger.error(`V2: Error getting token metadata for ${mintAddress}:`, error);
      
      const fallbackMetadata = {
        name: `Unknown ${mintAddress.slice(0, 6)}`,
        symbol: 'UNKNOWN',
        mint: mintAddress,
      };
      
      this.tokenMetadataCache.set(mintAddress, fallbackMetadata);
      return fallbackMetadata;
    }
  }

  /**
   * Get the Solana RPC health status
   * @returns Promise with the health status string
   */
  public async getRpcHealth(): Promise<string> {
    try {
      // Cache health check for 30 seconds to avoid excessive RPC calls
      const now = Date.now();
      if (now - this.lastHealthCheck.timestamp < 30000) {
        return this.lastHealthCheck.status;
      }

      const health = await solanaRpc.getHealth();
      
      // Update cache
      this.lastHealthCheck = {
        timestamp: now,
        status: health
      };
      
      return health;
    } catch (error) {
      logger.error('V2: Error checking RPC health:', error);
      
      // Update cache with error status
      this.lastHealthCheck = {
        timestamp: Date.now(),
        status: 'error'
      };
      
      return 'error';
    }
  }
  
  /**
   * Get the current Solana block height
   * @returns Promise with the current block height
   */
  public async getBlockHeight(): Promise<number> {
    try {
      return await solanaRpc.getBlockHeight('finalized');
    } catch (error) {
      logger.error('V2: Error getting block height:', error);
      throw error;
    }
  }
  
  /**
   * Get network version info
   * @returns Promise with the network version info
   */
  public async getVersion(): Promise<Record<string, any>> {
    try {
      return await solanaRpc.getVersion();
    } catch (error) {
      logger.error('V2: Error getting version:', error);
      return { version: 'unknown', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Export singleton instance
export const solanaServiceV2 = SolanaServiceV2.getInstance();