import { 
  PublicKey, 
  LAMPORTS_PER_SOL,
  ConfirmedSignatureInfo,
  ParsedTransactionWithMeta,
  TransactionSignature,
  ParsedInstruction,
  ConfirmedTransactionMeta
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { ISolanaService, TokenInfo, WalletBalance, TradeInfo, TransactionInfo, TokenAccount } from './ISolanaService';
import { ISolanaRpcService } from './ISolanaRpcService';
import { ILogger } from '../../../shared/utils/logger';
import { generateId } from '../../../shared/utils/helpers';

// Known DEX program IDs for identifying swap transactions
const DEX_PROGRAM_IDS = {
  JUPITER: {
    id: 'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB'
  },
  ORCA: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
  RAYDIUM: 'RVKd61ztZW9GUwhRbbLoYVRE5Xf1B2tVscKqwZqXgEr'
};

/**
 * Implementation of ISolanaService for interacting with Solana blockchain
 */
export class SolanaService implements ISolanaService {
  private connected: boolean = false;
  private walletAddress: string | null = null;
  private walletPublicKey: PublicKey | null = null;
  private tokenMap: Map<string, TokenInfo> = new Map();
  private tokenAccountsCache: Map<string, TokenAccount[]> = new Map();
  private tokenMetadataCache: Map<string, Partial<TokenInfo>> = new Map();
  private logger: ILogger;
  private rpcService: ISolanaRpcService;
  private mockTokenData: TokenInfo[] | null = null;

  /**
   * Create a new SolanaService
   * @param logger Logger instance
   * @param rpcService RPC service for blockchain interaction
   * @param mockTokenData Optional mock token data for testing
   */
  constructor(
    logger: ILogger,
    rpcService: ISolanaRpcService,
    mockTokenData?: TokenInfo[]
  ) {
    this.logger = logger.child({ module: 'SolanaService' });
    this.rpcService = rpcService;
    
    if (mockTokenData) {
      this.mockTokenData = mockTokenData;
      this.logger.info('Mock token data provided');
    }
  }

  /**
   * Update the RPC endpoint
   * @param endpoint The RPC endpoint URL
   */
  setEndpoint(endpoint: string): void {
    // The actual RPC endpoint is managed by the RPC service
    // But we need to clear caches when endpoint changes
    this.clearCaches();
    this.logger.info(`Changed RPC endpoint to: ${endpoint}`);
  }
  
  /**
   * Clear all caches
   */
  private clearCaches(): void {
    this.tokenMap.clear();
    this.tokenAccountsCache.clear();
    this.tokenMetadataCache.clear();
    this.logger.info('Cleared token and account caches');
  }

  /**
   * Connect wallet with public key
   * @param publicKey Optional public key to connect to
   * @returns Promise with connection details
   */
  async connectWallet(publicKey?: string): Promise<{ success: boolean; address: string | null }> {
    try {
      if (!publicKey) {
        throw new Error('No public key provided');
      }

      this.walletAddress = publicKey;
      this.walletPublicKey = new PublicKey(publicKey);
      this.connected = true;

      // Check connection health before proceeding
      const health = await this.rpcService.getHealth();
      if (health !== 'ok') {
        this.logger.warn(`Solana network health check failed: ${health}`);
      }

      // Get SOL balance
      const lamports = await this.rpcService.getBalance(this.walletPublicKey.toString());
      const solBalance = lamports / LAMPORTS_PER_SOL;

      // Preload token list for future use
      this.getTokenList().catch(error => {
        this.logger.warn('Failed to preload token list', error);
      });

      this.logger.info(`Connected wallet with address: ${publicKey} (Balance: ${solBalance} SOL)`);
      return { success: true, address: this.walletAddress };
    } catch (error) {
      this.logger.error('Error connecting wallet', error);
      return { success: false, address: null };
    }
  }

  /**
   * Disconnect wallet
   * @returns Promise indicating success
   */
  async disconnectWallet(): Promise<boolean> {
    try {
      this.connected = false;
      this.walletAddress = null;
      this.walletPublicKey = null;
      
      // Clear token accounts cache for this wallet
      this.tokenAccountsCache.clear();

      this.logger.info('Wallet disconnected');
      return true;
    } catch (error) {
      this.logger.error('Error disconnecting wallet', error);
      return false;
    }
  }

  /**
   * Get token list
   * @returns Promise with token information
   */
  async getTokenList(): Promise<TokenInfo[]> {
    try {
      return await this.loadTokenList();
    } catch (error) {
      this.logger.error('Error fetching token list', error);
      return [];
    }
  }
  
  /**
   * Load token list from API or cache
   * @returns Promise with token list
   */
  private async loadTokenList(): Promise<TokenInfo[]> {
    // Check if we already have tokens loaded
    if (this.tokenMap.size > 0) {
      this.logger.info(`Using cached token list with ${this.tokenMap.size} tokens`);
      return Array.from(this.tokenMap.values());
    }
    
    try {
      // For testing: if mockTokenData is provided, use that
      if (this.mockTokenData) {
        this.logger.info(`Using ${this.mockTokenData.length} mock tokens for development`);
        
        // Update token map
        this.mockTokenData.forEach(token => {
          this.tokenMap.set(token.symbol, token);
          this.tokenMap.set(token.mint, token);
        });
        
        return this.mockTokenData;
      }
      
      // First, fetch the Solana token list for basic metadata
      const tokenListUrl = 'https://token-list-api.solana.cloud/v1/mints?limit=1000&page=1&order=marketcap';
      this.logger.info(`Fetching token list from ${tokenListUrl}`);
      
      const tokenListResponse = await fetch(tokenListUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!tokenListResponse.ok) {
        throw new Error(`Failed to fetch token list: ${tokenListResponse.statusText}`);
      }
      
      const tokenListData = await tokenListResponse.json();
      const tokenListItems = tokenListData.data || [];
      
      this.logger.info(`Retrieved ${tokenListItems.length} tokens from Solana token list`);
      
      // Get top tokens by market cap
      const topTokens = tokenListItems
        .filter((item: any) => 
          item.symbol && 
          item.name && 
          item.address && 
          item.decimals !== undefined &&
          item.marketCap
        )
        .sort((a: any, b: any) => (b.marketCap || 0) - (a.marketCap || 0))
        .slice(0, 100);
      
      // Transform to our TokenInfo format
      const tokens: TokenInfo[] = await Promise.all(topTokens.map(async (item: any) => {
        // Try to get price data from API
        let price = 0;
        let change24h = 0;
        let volume24h = 0;
        let marketCap = 0;
        
        try {
          // Attempt to get price data from a price API (e.g., CoinGecko)
          // For production, you'd want to use a proper API with a key
          if (['SOL', 'BTC', 'ETH', 'JUP', 'BONK'].includes(item.symbol)) {
            const priceData = await this.fetchTokenPrice(item.symbol);
            price = priceData.price || 0;
            change24h = priceData.change24h || 0;
            volume24h = priceData.volume || 0;
            marketCap = priceData.marketCap || item.marketCap || 0;
          }
        } catch (priceError) {
          this.logger.warn(`Failed to fetch price for ${item.symbol}`, priceError);
        }
        
        return {
          symbol: item.symbol,
          name: item.name,
          mint: item.address,
          decimals: item.decimals,
          price,
          change24h,
          volume24h,
          marketCap: marketCap || item.marketCap || 0,
          supply: item.supply?.circulating || 0,
          logoURI: item.logoURI || `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${item.address}/logo.png`,
        };
      }));
      
      // Add fallback tokens in case the API fails
      const fallbackTokens: TokenInfo[] = [
        {
          symbol: 'SOL',
          name: 'Solana',
          mint: 'So11111111111111111111111111111111111111112',
          decimals: 9,
          price: 142.78,
          change24h: 0,
          volume24h: 1523950000,
          marketCap: 65432100000,
          supply: 458267801,
          logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
        },
        {
          symbol: 'JUP',
          name: 'Jupiter',
          mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
          decimals: 6,
          price: 1.24,
          change24h: 0,
          volume24h: 89560000,
          marketCap: 1678000000,
          supply: 1350000000,
          logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN/logo.png',
        },
      ];
      
      // Use retrieved tokens or fallback to static list if empty
      const finalTokens = tokens.length > 0 ? tokens : fallbackTokens;
      
      // Update token map for future lookups
      finalTokens.forEach(token => {
        this.tokenMap.set(token.symbol, token);
        this.tokenMap.set(token.mint, token); // Also index by mint address
      });
      
      this.logger.info(`Retrieved and cached ${finalTokens.length} tokens`);
      return finalTokens;
    } catch (error) {
      this.logger.error('Error loading token list', error);
      
      // Fallback to basic tokens if API calls fail
      const fallbackTokens: TokenInfo[] = [
        {
          symbol: 'SOL',
          name: 'Solana',
          mint: 'So11111111111111111111111111111111111111112',
          decimals: 9,
          price: 142.78,
          change24h: 0,
          volume24h: 1523950000,
          marketCap: 65432100000,
          supply: 458267801,
          logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
        },
      ];
      
      fallbackTokens.forEach(token => {
        this.tokenMap.set(token.symbol, token);
        this.tokenMap.set(token.mint, token);
      });
      
      this.logger.warn('Using fallback token list due to API error');
      return fallbackTokens;
    }
  }
  
  /**
   * Fetch token price from an external API
   * In production, you would use a paid API with proper rate limits
   * @param symbol Token symbol 
   * @returns Token price data
   */
  private async fetchTokenPrice(symbol: string): Promise<{
    price: number;
    change24h: number;
    volume: number;
    marketCap: number;
  }> {
    // Production implementation would use a paid API like CoinGecko Pro or CryptoCompare
    // For this example, we'll use a simplified approach with sample data
    
    // Map of known token symbols to their IDs
    const tokenIdMap: Record<string, string> = {
      'SOL': 'solana',
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'JUP': 'jupiter-exchange',
      'BONK': 'bonk',
      'JTO': 'jito-governance'
    };
    
    try {
      const tokenId = tokenIdMap[symbol];
      if (!tokenId) {
        return { price: 0, change24h: 0, volume: 0, marketCap: 0 };
      }
      
      // For production, use proper API with key:
      // const url = `https://api.coingecko.com/api/v3/coins/${tokenId}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false`;
      
      // For this demo, we'll simulate API responses with realistic data
      const mockData: Record<string, any> = {
        'solana': {
          price: 142.78,
          change24h: 3.45,
          volume: 1523950000,
          marketCap: 65432100000
        },
        'bitcoin': {
          price: 62584.21,
          change24h: 1.2,
          volume: 28560000000,
          marketCap: 1234567000000
        },
        'ethereum': {
          price: 3187.59,
          change24h: -0.8,
          volume: 12785000000,
          marketCap: 385000000000
        },
        'jupiter-exchange': {
          price: 1.24,
          change24h: 3.21,
          volume: 89560000,
          marketCap: 1678000000
        },
        'bonk': {
          price: 0.00001547,
          change24h: 12.3,
          volume: 56780000,
          marketCap: 927000000
        },
        'jito-governance': {
          price: 2.87,
          change24h: -2.4,
          volume: 23450000,
          marketCap: 316000000
        }
      };
      
      // Simulate a slight delay to mimic API call
      await new Promise(resolve => setTimeout(resolve, 50));
      
      return mockData[tokenId] || { price: 0, change24h: 0, volume: 0, marketCap: 0 };
    } catch (error) {
      this.logger.error(`Error fetching price for ${symbol}`, error);
      return { price: 0, change24h: 0, volume: 0, marketCap: 0 };
    }
  }

  /**
   * Get wallet balances
   * @returns Promise with wallet balance information
   */
  async getWalletBalances(): Promise<WalletBalance[]> {
    if (!this.connected || !this.walletPublicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      // Get SOL balance
      const solBalance = await this.rpcService.getBalance(this.walletPublicKey.toString());
      const solBalanceParsed = solBalance / LAMPORTS_PER_SOL;

      // Get all token accounts
      const tokenAccountsKey = this.walletPublicKey.toString();
      let tokenAccounts: TokenAccount[] = [];
      
      // Check cache first
      if (this.tokenAccountsCache.has(tokenAccountsKey)) {
        tokenAccounts = this.tokenAccountsCache.get(tokenAccountsKey) || [];
        this.logger.info(`Using cached token accounts (${tokenAccounts.length})`);
      } else {
        // If not in cache, fetch from blockchain
        const accounts = await this.fetchTokenAccounts(this.walletPublicKey.toString());
        tokenAccounts = accounts;
        
        // Update cache
        this.tokenAccountsCache.set(tokenAccountsKey, accounts);
        this.logger.info(`Retrieved and cached ${accounts.length} token accounts`);
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
            this.logger.error(`Error processing token account ${account.mint}`, error);
          }
        }
      }

      this.logger.info(`Retrieved ${balances.length} token balances`);
      return balances;
    } catch (error) {
      this.logger.error('Error fetching wallet balances', error);
      
      // Return at least a SOL balance as fallback (using placeholder)
      return [
        {
          token: 'Solana',
          symbol: 'SOL',
          amount: 0,
          valueUsd: 0,
        }
      ];
    }
  }
  
  /**
   * Fetch token accounts for a wallet
   * @param owner Wallet address
   * @returns Promise with token account information
   */
  private async fetchTokenAccounts(owner: string): Promise<TokenAccount[]> {
    try {
      // Get parsed token accounts
      const response = await this.rpcService.getTokenAccountsByOwner(
        owner,
        { programId: TOKEN_PROGRAM_ID.toString() }
      ) as any;
      
      if (!response || !response.value) {
        return [];
      }
      
      // Transform account data to a more usable format
      return response.value.map((account: any) => {
        const parsedInfo = account.account.data.parsed.info;
        return {
          mint: parsedInfo.mint,
          owner: parsedInfo.owner,
          amount: parsedInfo.tokenAmount.amount,
          decimals: parsedInfo.tokenAmount.decimals,
        };
      });
    } catch (error) {
      this.logger.error('Error fetching token accounts', error);
      return [];
    }
  }

  /**
   * Execute a trade (buy/sell)
   * @param token Token symbol or address
   * @param type Trade type (buy/sell)
   * @param amount Amount to trade
   * @param price Price to trade at (slippage tolerance in percentage, e.g. 1.0 = 1% slippage)
   * @param simulationMode If true, just simulate the trade without execution
   * @returns Promise with trade execution details
   */
  async executeTrade(
    token: string,
    type: 'buy' | 'sell',
    amount: number,
    price: number = 1.0,
    simulationMode: boolean = false
  ): Promise<{ success: boolean; trade: TradeInfo; transactionId?: string }> {
    if (!this.connected || !this.walletPublicKey) {
      throw new Error('Wallet not connected');
    }

    // Resolve token info based on symbol or mint address
    const tokenInfo = await this.resolveTokenInfo(token);
    if (!tokenInfo) {
      throw new Error(`Token info not found for ${token}`);
    }

    this.logger.info(`Executing ${simulationMode ? 'simulated ' : ''}${type} trade for ${amount} ${tokenInfo.symbol}`);
    
    try {
      // For simulation or development mode, just return simulated trade
      if (simulationMode || process.env.NODE_ENV !== 'production') {
        const trade: TradeInfo = {
          id: generateId(),
          tokenSymbol: tokenInfo.symbol,
          tokenName: tokenInfo.name,
          type,
          amount,
          price: tokenInfo.price,
          timestamp: Date.now(),
          status: 'open',
          simulation: true
        };
        
        return { success: true, trade };
      }
      
      // In production, integrate with Jupiter or another DEX API
      // This is a placeholder for real integration
      const slippageBps = Math.round(price * 100); // Convert percentage to basis points
      const sourceToken = type === 'buy' ? 'SOL' : tokenInfo.symbol;
      const destinationToken = type === 'buy' ? tokenInfo.symbol : 'SOL';

      // In a real implementation, you'd make API calls to a DEX aggregator
      // For example, using Jupiter API:
      //
      // 1. Get the route quote
      // const quoteResponse = await fetch(
      //   `https://quote-api.jup.ag/v6/quote?inputMint=${sourceMint}&outputMint=${destinationMint}&amount=${amountInLamports}&slippageBps=${slippageBps}`
      // );
      // const quoteData = await quoteResponse.json();
      //
      // 2. Get serialized transactions
      // const transactionResponse = await fetch('https://quote-api.jup.ag/v6/swap', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     quoteResponse: quoteData,
      //     userPublicKey: this.walletPublicKey.toString(),
      //     wrapAndUnwrapSol: true,
      //   }),
      // });
      // const transactionData = await transactionResponse.json();
      //
      // 3. Execute the transaction
      // const transaction = await this.rpcService.decodeAndSendTransaction(
      //   transactionData.swapTransaction
      // );

      // For now, let's simulate a successful trade
      const trade: TradeInfo = {
        id: generateId(),
        tokenSymbol: tokenInfo.symbol,
        tokenName: tokenInfo.name,
        type,
        amount,
        price: tokenInfo.price,
        timestamp: Date.now(),
        status: 'closed', // Assuming it went through successfully
        simulation: false
      };

      // Invalidate token account cache after a trade
      if (this.walletPublicKey) {
        this.tokenAccountsCache.delete(this.walletPublicKey.toString());
      }

      return { 
        success: true, 
        trade,
        transactionId: `sim-tx-${generateId().substring(0, 8)}`
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown trade execution error';
      this.logger.error(`Failed to execute ${type} trade for ${amount} ${tokenInfo.symbol}`, error);
      
      // Create a failed trade record
      const failedTrade: TradeInfo = {
        id: generateId(),
        tokenSymbol: tokenInfo.symbol,
        tokenName: tokenInfo.name,
        type,
        amount,
        price: tokenInfo.price,
        timestamp: Date.now(),
        status: 'canceled',
        simulation: simulationMode,
        error: errorMessage
      };
      
      return { success: false, trade: failedTrade };
    }
  }
  
  /**
   * Resolve token info from symbol or mint address
   * @param tokenSymbolOrMint Token symbol or mint address
   * @returns Promise with resolved token info
   */
  private async resolveTokenInfo(tokenSymbolOrMint: string): Promise<TokenInfo | null> {
    try {
      // Check if we have this token in our map
      if (this.tokenMap.has(tokenSymbolOrMint)) {
        return this.tokenMap.get(tokenSymbolOrMint) || null;
      }
      
      // Check if we need to try case-insensitive match for symbol
      const upperSymbol = tokenSymbolOrMint.toUpperCase();
      if (upperSymbol !== tokenSymbolOrMint && this.tokenMap.has(upperSymbol)) {
        return this.tokenMap.get(upperSymbol) || null;
      }
      
      // If not found and it looks like a mint address, try to get metadata
      if (tokenSymbolOrMint.length > 30) {
        // Get token metadata
        const metadata = await this.getTokenMetadata(tokenSymbolOrMint);
        
        // If successful, create a basic TokenInfo object
        if (metadata.name && metadata.symbol) {
          const tokenInfo: TokenInfo = {
            symbol: metadata.symbol,
            name: metadata.name,
            mint: tokenSymbolOrMint,
            decimals: metadata.decimals || 9,
            price: 0,
            change24h: 0,
            volume24h: 0,
            marketCap: 0,
            supply: 0,
            logoURI: metadata.logoURI
          };
          
          // Add to token map
          this.tokenMap.set(tokenSymbolOrMint, tokenInfo);
          this.tokenMap.set(tokenInfo.symbol, tokenInfo);
          
          return tokenInfo;
        }
      }
      
      // If all else fails, try to load the full token list
      await this.loadTokenList();
      
      // Try one more time
      if (this.tokenMap.has(tokenSymbolOrMint)) {
        return this.tokenMap.get(tokenSymbolOrMint) || null;
      }
      
      if (upperSymbol !== tokenSymbolOrMint && this.tokenMap.has(upperSymbol)) {
        return this.tokenMap.get(upperSymbol) || null;
      }
      
      return null;
    } catch (error) {
      this.logger.error(`Error resolving token info for ${tokenSymbolOrMint}`, error);
      return null;
    }
  }
  
  /**
   * Resolve token name from symbol or mint address
   * @param tokenSymbolOrMint Token symbol or mint address
   * @returns Promise with resolved token name
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
   * Get transaction history
   * @returns Promise with transaction history
   */
  async getTransactionHistory(): Promise<TransactionInfo[]> {
    if (!this.connected || !this.walletPublicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      // Get recent transactions for the wallet
      const signatures = await this.rpcService.getSignaturesForAddress(
        this.walletPublicKey.toString(),
        { limit: 20 },
        'confirmed'
      ) as ConfirmedSignatureInfo[];
      
      if (!signatures || signatures.length === 0) {
        this.logger.info('No recent transactions found for wallet');
        return [];
      }
      
      this.logger.info(`Found ${signatures.length} recent transaction signatures`);
      
      // Process transactions in parallel with a limit to avoid rate limits
      const transactions: TransactionInfo[] = [];
      const chunkSize = 5; // Process 5 transactions at a time to avoid rate limits
      
      for (let i = 0; i < signatures.length; i += chunkSize) {
        const chunk = signatures.slice(i, i + chunkSize);
        const chunkPromises = chunk.map(async (sig) => {
          try {
            return await this.processTransaction(sig);
          } catch (error) {
            this.logger.error(`Error processing transaction ${sig.signature}`, error);
            return null;
          }
        });
        
        const results = await Promise.all(chunkPromises);
        transactions.push(...results.filter(tx => tx !== null) as TransactionInfo[]);
      }
      
      this.logger.info(`Successfully processed ${transactions.length} transactions`);
      return transactions;
    } catch (error) {
      this.logger.error('Error fetching transaction history', error);
      
      // If there's an error, return empty array instead of failing completely
      return [];
    }
  }
  
  /**
   * Process a transaction signature into a TransactionInfo object
   * @param signature Transaction signature info
   * @returns Processed transaction info or null if error
   */
  private async processTransaction(signature: ConfirmedSignatureInfo): Promise<TransactionInfo | null> {
    try {
      // Get the full transaction data
      const txData = await this.rpcService.getTransaction(
        signature.signature,
        { maxSupportedTransactionVersion: 0 }
      ) as ParsedTransactionWithMeta | null;
      
      if (!txData || !txData.meta) {
        this.logger.warn(`No transaction data found for signature ${signature.signature}`);
        return null;
      }
      
      // Determine transaction type
      const type = this.determineTransactionType(txData);
      
      // Create base transaction info
      const tx: TransactionInfo = {
        id: signature.signature,
        type,
        timestamp: signature.blockTime ? signature.blockTime * 1000 : Date.now(),
        status: signature.err ? 'failed' : 'confirmed',
      };
      
      // Add additional information based on transaction type
      if (type === 'swap') {
        try {
          // Extract tokens and amounts for swaps
          const { tokenIn, tokenOut, amountIn, amountOut } = this.extractSwapDetails(txData);
          
          if (tokenIn) tx.tokenIn = tokenIn;
          if (tokenOut) tx.tokenOut = tokenOut;
          if (amountIn !== undefined) tx.amountIn = amountIn;
          if (amountOut !== undefined) tx.amountOut = amountOut;
        } catch (error) {
          this.logger.warn(`Failed to extract swap details for ${signature.signature}`, error);
        }
      } else if (type === 'send' || type === 'receive') {
        try {
          // Extract token and amount for transfers
          const { token, amount, destination } = this.extractTransferDetails(txData);
          
          if (token) tx.token = token;
          if (amount !== undefined) tx.amount = amount;
          if (destination) tx.to = destination;
        } catch (error) {
          this.logger.warn(`Failed to extract transfer details for ${signature.signature}`, error);
        }
      }
      
      return tx;
    } catch (error) {
      this.logger.error(`Error processing transaction ${signature.signature}`, error);
      return null;
    }
  }
  
  /**
   * Determine the type of a transaction
   * @param txData Transaction data
   * @returns Transaction type
   */
  private determineTransactionType(txData: ParsedTransactionWithMeta): TransactionInfo['type'] {
    // Check for program IDs in the transaction
    const programIds = txData.transaction.message.instructions.map(
      (ix: any) => ix.programId
    );
    
    // Check if this is a token swap transaction
    if (programIds.includes(DEX_PROGRAM_IDS.JUPITER.id) || 
        programIds.includes(DEX_PROGRAM_IDS.ORCA) ||
        programIds.includes(DEX_PROGRAM_IDS.RAYDIUM)) {
      return 'swap';
    }
    
    // Check for token program transfers
    const hasTokenTransfer = txData.meta?.innerInstructions?.some(inner => 
      inner.instructions.some((ix: any) => {
        if ('parsed' in ix) {
          return ix.programId === TOKEN_PROGRAM_ID.toString() && 
            ix.parsed?.type === 'transfer';
        }
        return false;
      })
    );
    
    if (hasTokenTransfer) {
      // Determine if this is a send or receive based on wallet address
      // This is a simplified approach and would need to be more thorough in production
      const isReceive = txData.meta?.innerInstructions?.some(inner => 
        inner.instructions.some((ix: any) => {
          if ('parsed' in ix) {
            return ix.programId === TOKEN_PROGRAM_ID.toString() && 
              ix.parsed?.type === 'transfer' &&
              ix.parsed.info.destination === this.walletAddress;
          }
          return false;
        })
      );
      
      return isReceive ? 'receive' : 'send';
    }
    
    // Default to unknown if we can't determine the type
    return 'unknown';
  }
  
  /**
   * Extract swap details from a transaction
   * @param txData Transaction data
   * @returns Swap details
   */
  private extractSwapDetails(txData: ParsedTransactionWithMeta): {
    tokenIn?: string;
    tokenOut?: string;
    amountIn?: number;
    amountOut?: number;
  } {
    // This is a simplified implementation - in production you would need
    // more robust parsing logic for different DEXes
    
    // For simplicity, let's assume this is a token swap with pre/post token balances
    if (!txData.meta?.preTokenBalances || !txData.meta?.postTokenBalances) {
      return {};
    }
    
    const preBalances = txData.meta.preTokenBalances;
    const postBalances = txData.meta.postTokenBalances;
    
    // Find tokens where balances changed
    let tokenIn, tokenOut, amountIn, amountOut;
    
    // Identify decreased token (token in)
    for (const preBal of preBalances) {
      const postBal = postBalances.find(p => 
        p.accountIndex === preBal.accountIndex && p.mint === preBal.mint
      );
      
      if (postBal) {
        const preAmount = Number(preBal.uiTokenAmount.uiAmount || 0);
        const postAmount = Number(postBal.uiTokenAmount.uiAmount || 0);
        
        if (preAmount > postAmount) {
          tokenIn = preBal.mint;
          amountIn = preAmount - postAmount;
          break;
        }
      }
    }
    
    // Identify increased token (token out)
    for (const postBal of postBalances) {
      const preBal = preBalances.find(p => 
        p.accountIndex === postBal.accountIndex && p.mint === postBal.mint
      );
      
      if (preBal) {
        const preAmount = Number(preBal.uiTokenAmount.uiAmount || 0);
        const postAmount = Number(postBal.uiTokenAmount.uiAmount || 0);
        
        if (postAmount > preAmount) {
          tokenOut = postBal.mint;
          amountOut = postAmount - preAmount;
          break;
        }
      }
    }
    
    return { tokenIn, tokenOut, amountIn, amountOut };
  }
  
  /**
   * Extract transfer details from a transaction
   * @param txData Transaction data
   * @returns Transfer details
   */
  private extractTransferDetails(txData: ParsedTransactionWithMeta): {
    token?: string;
    amount?: number;
    destination?: string;
  } {
    // For token transfers, find the token program instruction
    const transferIx = txData.meta?.innerInstructions?.find(inner => 
      inner.instructions.some((ix: any) => {
        if ('parsed' in ix) {
          return ix.programId === TOKEN_PROGRAM_ID.toString() && 
            ix.parsed?.type === 'transfer';
        }
        return false;
      })
    );
    
    if (transferIx) {
      const transferDetails = transferIx.instructions.find((ix: any) => {
        if ('parsed' in ix) {
          return ix.programId === TOKEN_PROGRAM_ID.toString() && 
            ix.parsed?.type === 'transfer';
        }
        return false;
      });
      
      if (transferDetails && 'parsed' in transferDetails && transferDetails.parsed?.info) {
        const info = transferDetails.parsed.info;
        return {
          token: info.mint || 'unknown',
          amount: Number(info.amount) / Math.pow(10, 9), // Assuming 9 decimals, would need token metadata in production
          destination: info.destination
        };
      }
    }
    
    // Check if this is a SOL transfer
    const solTransfer = txData.meta?.innerInstructions?.find(inner => 
      inner.instructions.some((ix: any) => {
        if ('parsed' in ix) {
          return ix.programId === 'System' && 
            ix.parsed?.type === 'transfer';
        }
        return false;
      })
    );
    
    if (solTransfer) {
      const transferDetails = solTransfer.instructions.find((ix: any) => {
        if ('parsed' in ix) {
          return ix.programId === 'System' && 
            ix.parsed?.type === 'transfer';
        }
        return false;
      });
      
      if (transferDetails && 'parsed' in transferDetails && transferDetails.parsed?.info) {
        const info = transferDetails.parsed.info;
        return {
          token: 'SOL',
          amount: Number(info.lamports) / LAMPORTS_PER_SOL,
          destination: info.destination
        };
      }
    }
    
    return {};
  }

  /**
   * Helper method to get token price
   * @param symbolOrMint Token symbol or mint address
   * @returns Token price or 0 if not found
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
   * Get token metadata for a mint address
   * @param mintAddress Mint address
   * @returns Promise with token metadata
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
      this.logger.error(`Error getting token metadata for ${mintAddress}`, error);
      
      const fallbackMetadata = {
        name: `Unknown ${mintAddress.slice(0, 6)}`,
        symbol: 'UNKNOWN',
        mint: mintAddress,
      };
      
      this.tokenMetadataCache.set(mintAddress, fallbackMetadata);
      return fallbackMetadata;
    }
  }
}