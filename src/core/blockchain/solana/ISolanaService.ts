/**
 * Interface for Solana blockchain services
 * Defines the contract for interacting with the Solana blockchain
 */
export interface ISolanaService {
  /**
   * Connect to a wallet
   * @param publicKey Optional public key to connect to
   * @returns Promise with connection details
   */
  connectWallet(publicKey?: string): Promise<{ success: boolean; address: string | null }>;

  /**
   * Disconnect the current wallet
   * @returns Promise indicating success
   */
  disconnectWallet(): Promise<boolean>;

  /**
   * Get list of tokens from the Solana ecosystem
   * @returns Promise with token information
   */
  getTokenList(): Promise<TokenInfo[]>;

  /**
   * Get balances for the connected wallet
   * @returns Promise with wallet balance information
   */
  getWalletBalances(): Promise<WalletBalance[]>;

  /**
   * Execute a trade (buy/sell)
   * @param token Token symbol or address
   * @param type Trade type (buy/sell)
   * @param amount Amount to trade
   * @param price Price to trade at
   * @returns Promise with trade execution details
   */
  executeTrade(
    token: string,
    type: 'buy' | 'sell',
    amount: number,
    price: number
  ): Promise<{ success: boolean; trade: TradeInfo }>;

  /**
   * Get transaction history for the connected wallet
   * @returns Promise with transaction history
   */
  getTransactionHistory(): Promise<TransactionInfo[]>;

  /**
   * Set the RPC endpoint (optional)
   * @param endpoint The RPC endpoint URL
   */
  setEndpoint?(endpoint: string): void;
}

/**
 * Token information interface
 */
export interface TokenInfo {
  symbol: string;
  name: string;
  mint: string;
  decimals: number;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  supply: number;
  logoURI?: string;
}

/**
 * Wallet balance for a specific token
 */
export interface WalletBalance {
  token: string;
  symbol: string;
  amount: number;
  valueUsd: number;
}

/**
 * Token account information
 */
export interface TokenAccount {
  mint: string;
  owner: string;
  amount: string;
  decimals: number;
}

/**
 * Transaction information
 */
export interface TransactionInfo {
  id: string;
  type: 'swap' | 'transfer' | 'send' | 'receive' | 'unknown';
  timestamp: number;
  status: 'confirmed' | 'failed' | 'processing' | 'error';
  [key: string]: unknown;
}

/**
 * Trade information
 */
export interface TradeInfo {
  id: string;
  tokenSymbol: string;
  tokenName: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  timestamp: number;
  status: 'open' | 'closed' | 'canceled';
  simulation?: boolean;
}

/**
 * Trading Signal information
 */
export interface TradingSignal {
  token: string;
  tokenSymbol: string;
  direction: 'buy' | 'sell' | 'hold';
  price: number;
  targetPrice: number;
  stopLoss: number;
  timestamp: string;
  confidence: number;
  timeframe: string;
}