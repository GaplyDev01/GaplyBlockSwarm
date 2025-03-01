import { PublicKey } from '@solana/web3.js';

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

/**
 * SolanaRpc interface for RPC interactions
 */
export interface SolanaRpcInterface {
  getLatestBlockhash(commitment?: string): Promise<unknown>;
  getBlockHeight(commitment?: string): Promise<number>;
  getBalance(address: string, commitment?: string): Promise<number>;
  getHealth(): Promise<string>;
  getVersion(): Promise<Record<string, any>>;
  getTokenAccountsByOwner(
    owner: string, 
    options: { mint?: string; programId?: string },
    commitment?: string
  ): Promise<unknown>;
  getTransaction(signature: string, options: unknown): Promise<unknown>;
  getSignaturesForAddress(
    address: string,
    options?: { limit?: number; before?: string; until?: string }
  ): Promise<unknown>;
  subscribeToAccount(
    publicKey: string, 
    callback: (accountInfo: unknown) => void,
    commitment?: string
  ): Promise<number>;
  unsubscribe(subscriptionId: number): Promise<boolean>;
}

/**
 * Main Solana service interface 
 */
export interface SolanaService {
  connectWallet(publicKey?: string): Promise<{ success: boolean; address: string | null }>;
  disconnectWallet(): Promise<boolean>;
  getTokenList(): Promise<TokenInfo[]>;
  getWalletBalances(): Promise<WalletBalance[]>;
  executeTrade(
    token: string,
    type: 'buy' | 'sell',
    amount: number,
    price: number,
    simulationMode?: boolean
  ): Promise<{ success: boolean; trade: TradeInfo; transactionId?: string }>;
  getTransactionHistory(): Promise<TransactionInfo[]>;
  getRpcHealth?(): Promise<string>;
  getBlockHeight?(): Promise<number>;
  getVersion?(): Promise<Record<string, any>>;
  setEndpoint?(endpoint: string): void;
}