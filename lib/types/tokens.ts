/**
 * Common token type definitions for BlockSwarms app
 */

// CoinGecko token interface
export interface CoinGeckoToken {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap?: number;
  total_volume?: number;
  circulating_supply?: number;
  total_supply?: number;
  max_supply?: number;
  ath?: number;
  ath_change_percentage?: number;
  ath_date?: string;
  atl?: number;
  atl_change_percentage?: number;
  atl_date?: string;
  platforms?: {
    solana?: string;
    ethereum?: string;
    [key: string]: string | undefined;
  };
  roi?: {
    times: number;
    currency: string;
    percentage: number;
  } | null;
  last_updated?: string;
}

// Jupiter token interface
export interface JupiterToken {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap?: number;
  total_volume?: number;
  circulating_supply?: number;
  total_supply?: number;
  address?: string;  // Jupiter uses address instead of id in many cases
  logoURI?: string;  // Jupiter often provides logoURI
  decimals?: number;  // Number of decimal places for the token
  tags?: string[];  // Tags array for filtering
  extensions?: Record<string, any>;
  is_jupiter_token?: boolean;
  searchNote?: string;
}

// Unified Token interface that our app uses
export interface Token {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap?: number;
  total_volume?: number;
  circulating_supply?: number;
  total_supply?: number;
  is_jupiter_token?: boolean;
  searchNote?: string;
  // Additional fields for our app
  tags?: string[];
  address?: string;
  // Enhanced fields
  allTimeHigh?: number;
  allTimeLow?: number;
}

// Enhanced token info with additional fields
export interface EnhancedTokenInfo {
  name: string;
  symbol: string;
  address: string;
  image: string;
  price: number;
  priceChange: number;
  marketCap: number;
  volume: number;
  totalSupply: number;
  circulatingSupply: number;
  allTimeHigh?: number;
  allTimeLow?: number;
}

// TokenInfo interface for the wallet dashboard
export interface TokenInfo {
  name: string;
  symbol: string;
  mint: string;  // Corresponds to id or address
  logoURI: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  supply: number;
  totalSupply: number;
  decimals: number;
}

// Solana instruction interface for use with transactions
export interface SolanaInstruction {
  programId: string | { toString(): string };
  data?: Buffer | Uint8Array | string;
  keys?: Array<{ pubkey: string | { toString(): string }; isSigner: boolean; isWritable: boolean }>;
  accounts?: string[];  // Alternative to keys for some instruction formats
}

// Token balance interface
export interface TokenBalance {
  mint: string;
  amount: number;
  decimals: number;
  uiAmount: number;
  tokenInfo?: TokenInfo;
}

// Solana transaction interfaces
export interface SolanaInnerTransaction {
  instructions: SolanaInstruction[];
}

export interface TransferDetails {
  from: string;
  to: string;
  amount: number;
  mint?: string;
}

// CoinGecko API Response
export interface CoinGeckoApiResponse {
  data: CoinGeckoToken[];
}

// Jupiter API Response
export interface JupiterApiResponse {
  tokens: JupiterToken[];
}
