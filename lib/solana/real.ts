import { 
  Connection, 
  PublicKey, 
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { logger } from '../logger';
import { generateId } from '../utils';
import { solanaRpc } from './rpc';
import { 
  SolanaService, 
  WalletBalance, 
  TradeInfo, 
  TransactionInfo 
} from './types';
import { TokenInfo, JupiterToken, CoinGeckoToken, SolanaInstruction } from '../types/tokens';

// External APIs for token data
import axios from 'axios';

/**
 * Service for interacting with Solana blockchain
 */
export class RealSolanaService implements SolanaService {
  private static instance: RealSolanaService;
  private connection: Connection;
  private connected: boolean = false;
  private walletAddress: string | null = null;
  private walletPublicKey: PublicKey | null = null;
  private tokenMap: Map<string, TokenInfo> = new Map();

  private constructor() {
    // Initialize connection with endpoint from env
    const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    
    this.connection = new Connection(endpoint, {
      commitment: 'confirmed',
      wsEndpoint: process.env.NEXT_PUBLIC_SOLANA_WSS_URL
    });
    logger.info(`Initialized RealSolanaService with endpoint: ${endpoint}`);
  }

  public static getInstance(): RealSolanaService {
    if (!RealSolanaService.instance) {
      RealSolanaService.instance = new RealSolanaService();
    }
    return RealSolanaService.instance;
  }

  /**
   * Update the RPC endpoint
   */
  public setEndpoint(endpoint: string): void {
    this.connection = new Connection(endpoint, {
      commitment: 'confirmed',
      wsEndpoint: process.env.NEXT_PUBLIC_SOLANA_WSS_URL
    });
    logger.info(`Changed RPC endpoint to: ${endpoint}`);
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

      // Get SOL balance
      const lamports = await solanaRpc.getBalance(this.walletPublicKey.toString());
      const solBalance = lamports / LAMPORTS_PER_SOL;

      logger.info(`Connected wallet with address: ${publicKey}`);
      return { success: true, address: this.walletAddress };
    } catch (error) {
      logger.error('Error connecting wallet:', error);
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

      logger.info('Wallet disconnected');
      return true;
    } catch (error) {
      logger.error('Error disconnecting wallet:', error);
      return false;
    }
  }

  /**
   * Get token list from real APIs
   */
  public async getTokenList(): Promise<TokenInfo[]> {
    try {
      // Try to fetch from Jupiter API (reliable Solana token list)
      const jupiterApiUrl = 'https://token.jup.ag/strict';
      const jupiterResponse = await axios.get(jupiterApiUrl, { timeout: 8000 });
      const jupiterTokens = jupiterResponse.data;
      
      logger.info(`Retrieved ${jupiterTokens.length} tokens from Jupiter API`);
      
      // Try to fetch prices from CoinGecko API if API key exists
      let tokenPrices: Record<string, any> = {};
      const apiKey = process.env.COINGECKO_API_KEY;
      
      if (apiKey) {
        try {
          // Get price data for top Solana tokens
          const cgApiUrl = 'https://api.coingecko.com/api/v3/coins/markets';
          const cgResponse = await axios.get(cgApiUrl, {
            params: {
              vs_currency: 'usd',
              category: 'solana-ecosystem',
              order: 'market_cap_desc',
              per_page: 50,
              page: 1,
              sparkline: false,
              price_change_percentage: '24h',
              x_cg_pro_api_key: apiKey
            },
            timeout: 5000
          });
          
          // Create a map of symbol -> price data
          cgResponse.data.forEach((token: CoinGeckoToken) => {
            tokenPrices[token.symbol.toUpperCase()] = {
              price: token.current_price,
              change24h: token.price_change_percentage_24h,
              volume: token.total_volume,
              marketCap: token.market_cap
            };
          });
          
          logger.info(`Retrieved price data for ${Object.keys(tokenPrices).length} tokens`);
        } catch (priceError) {
          logger.error('Error fetching token prices:', priceError);
        }
      }
      
      // Map Jupiter tokens to our TokenInfo format
      const tokens: TokenInfo[] = jupiterTokens
        .filter((token: JupiterToken) => token.tags && token.tags.includes('popular'))
        .map((token: JupiterToken) => {
          const priceData = tokenPrices[token.symbol] || {
            price: 0,
            change24h: 0,
            volume: 0,
            marketCap: 0
          };
          
          const tokenInfo: TokenInfo = {
            symbol: token.symbol,
            name: token.name ?? '',
            mint: token.address ?? '',
            decimals: token.decimals ?? 9,
            logoURI: token.logoURI ?? '',
            price: priceData.price,
            change24h: priceData.change24h,
            volume24h: priceData.volume,
            marketCap: priceData.marketCap,
            supply: 0,
            totalSupply: 0
          };
          
          // Update token map for price lookups
          this.tokenMap.set(token.symbol, tokenInfo);
          
          return tokenInfo;
        });
      
      return tokens;
    } catch (error) {
      logger.error('Error fetching token list:', error);
      return [];
    }
  }

  /**
   * Get wallet balances for connected wallet
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
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        this.walletPublicKey,
        { programId: TOKEN_PROGRAM_ID }
      );

      // Create array of token accounts with balance > 0
      const accounts = tokenAccounts.value
        .filter(account => {
          const parsedInfo = account.account.data.parsed.info;
          return parsedInfo.tokenAmount.uiAmount > 0;
        })
        .map(account => {
          const parsedInfo = account.account.data.parsed.info;
          return {
            mint: parsedInfo.mint,
            owner: parsedInfo.owner,
            amount: parsedInfo.tokenAmount.amount,
            decimals: parsedInfo.tokenAmount.decimals,
          };
        });

      // Get token info for each token
      const balances: WalletBalance[] = [];

      // Add SOL balance
      balances.push({
        token: 'Solana',
        symbol: 'SOL',
        amount: solBalanceParsed,
        valueUsd: solBalanceParsed * this.getTokenPrice('SOL'),
      });

      // Process token accounts
      if (accounts.length > 0) {
        for (const account of accounts) {
          try {
            // Get token metadata
            const tokenInfo = await this.getTokenMetadata(account.mint);
            
            // Calculate token amount with decimals
            const tokenAmount = Number(account.amount) / Math.pow(10, account.decimals);
            
            // Add to balances
            balances.push({
              token: tokenInfo.name || account.mint.slice(0, 10),
              symbol: tokenInfo.symbol || account.mint.slice(0, 4).toUpperCase(),
              amount: tokenAmount,
              valueUsd: tokenAmount * (tokenInfo.price || 0),
            });
          } catch (error) {
            logger.error(`Error processing token account ${account.mint}:`, error);
          }
        }
      }

      logger.info(`Retrieved ${balances.length} token balances`);
      return balances;
    } catch (error) {
      logger.error('Error fetching wallet balances:', error);
      
      // Return mock balances as fallback
      const mockBalances = await mockSolanaService.getWalletBalances();
      logger.warn(`Using ${mockBalances.length} mock wallet balances due to error`);
      return mockBalances;
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

    // Simulate a trade - in a real implementation, this would interact with DEXes
    logger.info(`Creating simulated ${type} trade for ${amount} ${token}`);
    
    const trade: TradeInfo = {
      id: generateId(),
      tokenSymbol: token,
      tokenName: token,
      type,
      amount,
      price,
      timestamp: Date.now(),
      status: 'open',
      simulation: true
    };

    return { success: true, trade };
  }

  /**
   * Get transaction history
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
        logger.info('No transactions found for this wallet');
        return [];
      }

      // Get transaction details
      const transactions = await Promise.all(
        signatures.map(async (sig) => {
          try {
            const tx = await this.connection.getParsedTransaction(
              sig.signature,
              { maxSupportedTransactionVersion: 0 }
            );

            // Basic transaction info
            const txInfo: TransactionInfo = {
              id: sig.signature,
              timestamp: sig.blockTime ? new Date(sig.blockTime * 1000).getTime() : Date.now(),
              status: tx?.meta?.err ? 'failed' : 'confirmed',
              type: 'unknown'
            };

            // Try to determine transaction type
            if (tx?.meta && tx.transaction.message.instructions) {
              const instructions = tx.transaction.message.instructions;
              
              if (this.isTokenTransfer(instructions)) {
                txInfo.type = 'transfer';
              } else if (this.isSwapTransaction(instructions)) {
                txInfo.type = 'swap';
              }
            }

            return txInfo;
          } catch (error) {
            logger.error(`Error processing transaction ${sig.signature}:`, error);
            return {
              id: sig.signature,
              timestamp: sig.blockTime ? new Date(sig.blockTime * 1000).getTime() : Date.now(),
              status: 'error',
              type: 'unknown',
              error: 'Failed to parse transaction',
            };
          }
        })
      );

      logger.info(`Retrieved ${transactions.length} transactions`);
      return transactions;
    } catch (error) {
      logger.error('Error fetching transaction history:', error);
      
      // Return mock transactions as fallback
      const mockTransactions = await mockSolanaService.getTransactionHistory();
      logger.warn(`Using ${mockTransactions.length} mock transactions due to error`);
      return mockTransactions;
    }
  }

  /**
   * Helper method to get token price
   */
  private getTokenPrice(symbol: string): number {
    const normalizedSymbol = symbol.toUpperCase();
    const tokenInfo = this.tokenMap.get(normalizedSymbol);
    return tokenInfo?.price || 0;
  }
  
  /**
   * Get token metadata for a mint address
   */
  private async getTokenMetadata(mintAddress: string): Promise<Partial<TokenInfo>> {
    try {
      // In a real implementation, fetch token metadata from a registry
      // For now, return minimal information
      return {
        name: `Token ${mintAddress.slice(0, 8)}`,
        symbol: mintAddress.slice(0, 4).toUpperCase(),
        mint: mintAddress,
        decimals: 9,
        price: 0,
      };
    } catch (error) {
      logger.error(`Error getting token metadata for ${mintAddress}:`, error);
      return {
        name: `Unknown ${mintAddress.slice(0, 6)}`,
        symbol: 'UNKNOWN',
        mint: mintAddress,
      };
    }
  }

  /**
   * Check if transaction instructions include a token transfer
   */
  private isTokenTransfer(instructions: SolanaInstruction[]): boolean {
    return instructions.some(instr => {
      const programId = typeof instr.programId === 'object' ? instr.programId.toString() : '';
      return programId === TOKEN_PROGRAM_ID.toString();
    });
  }

  /**
   * Check if transaction instructions include a token swap
   */
  private isSwapTransaction(instructions: SolanaInstruction[]): boolean {
    const dexProgramIds = ['Jupiter', 'Orca', 'Raydium'];
    
    return instructions.some(instr => {
      const programId = typeof instr.programId === 'object' ? instr.programId.toString() : '';
      return dexProgramIds.some(dex => programId.toLowerCase().includes(dex.toLowerCase()));
    });
  }
}

// Export singleton instance
export const realSolanaService = RealSolanaService.getInstance();