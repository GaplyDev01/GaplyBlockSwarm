import { TokenInfo } from './types';
import { getSolanaService } from './index';
import { Connection } from '@solana/web3.js';
import { getJupiterClient } from './v2';
import { solanaServiceV2 } from './v2';
import { 
  getTokenInfoFromCoinGecko, 
  getTokenPriceHistory, 
  searchTokensFromCoinGecko 
} from '../real-api-integration';

// Enhanced TokenInfo type with additional fields
export interface EnhancedTokenInfo {
  symbol: string;
  name: string;
  mintAddress: string;  // Matches mint in TokenInfo
  decimals: number;
  logo?: string;        // Matches logoURI in TokenInfo
  price?: number;
  volume?: number;
  priceChange?: number;
  marketCap?: number;
  allTimeHigh?: number;
  allTimeLow?: number;
  circulatingSupply?: number;
  maxSupply?: number;
  fullyDilutedValuation?: number;
}

// Interface for token price and analytics data
export interface TokenAnalytics {
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  allTimeHigh: number;
  allTimeLow: number;
  liquidityDepth: number;
  tradingVolume7d: number;
  priceVolatility30d: number;
}

// Interface for trading signals
export interface TradingSignal {
  token: string;
  recommendation: 'buy' | 'sell' | 'hold';
  confidence: number; // 0-100
  timeframe: 'short' | 'medium' | 'long';
  entryPrice?: number;
  targetPrice?: number;
  stopLoss?: number;
  reasoning: string;
}

// Interface for swap parameters and result
export interface SwapParams {
  fromToken: string; // Token mint address
  toToken: string; // Token mint address
  amount: number;
  slippageBps: number; // Basis points (e.g. 50 = 0.5%)
}

export interface SwapResult {
  success: boolean;
  fromAmount: number;
  toAmount: number;
  price: number;
  txId?: string;
  error?: string;
  priceImpact?: number;
  estimatedFees?: number;
  route?: {
    marketName: string;
    inAmount: number;
    outAmount: number;
  };
}

/**
 * Solana Tools class that provides functions for token analytics, trading signals, and token swaps
 */
export class SolanaTools {
  public solanaService = getSolanaService();
  private connection: Connection;
  
  constructor() {
    this.connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
  }

  /**
   * Get token information by mint address or symbol
   * @param tokenIdOrSymbol Token mint address or symbol
   */
  async getTokenInfo(tokenIdOrSymbol: string): Promise<EnhancedTokenInfo> {
    try {
      // First try using the V2 implementation which has better error handling
      const tokenList = await solanaServiceV2.getTokenList();
      
      // Try to match by symbol (case insensitive)
      let tokenInfo = tokenList.find(t => 
        t.symbol.toLowerCase() === tokenIdOrSymbol.toLowerCase()
      );
      
      // If not found by symbol, try by mint address
      if (!tokenInfo) {
        tokenInfo = tokenList.find(t => t.mint === tokenIdOrSymbol);
      }
      
      // If found, return it
      if (tokenInfo) {
        return {
          ...tokenInfo,
          mintAddress: tokenInfo.mint,
          logo: tokenInfo.logoURI
        };
      }
      
      // Fallback to mock data if not found
      return {
        symbol: tokenIdOrSymbol.toUpperCase(),
        name: `Unknown ${tokenIdOrSymbol.slice(0, 4)}`,
        mintAddress: tokenIdOrSymbol.length > 30 ? tokenIdOrSymbol : 'unknown',
        decimals: 9,
        price: 1.0,
        volume: 0,
        priceChange: 0,
        marketCap: 0
      };
    } catch (error) {
      console.error(`Error getting token info for ${tokenIdOrSymbol}:`, error);
      
      // Fallback to mock data on error
      return {
        symbol: tokenIdOrSymbol.toUpperCase(),
        name: `Unknown ${tokenIdOrSymbol.slice(0, 4)}`,
        mintAddress: tokenIdOrSymbol.length > 30 ? tokenIdOrSymbol : 'unknown',
        decimals: 9
      };
    }
  }

  /**
   * Get price and analytics data for a Solana token
   * @param tokenMint Token mint address or symbol
   * @returns Token analytics data including price, volume, market cap, etc.
   */
  async getTokenAnalytics(tokenMint: string): Promise<TokenAnalytics> {
    try {
      // Get token info from our token info method
      const tokenInfo = await this.getTokenInfo(tokenMint);
      
      // Try to find the token in CoinGecko
      let cgData = {};
      try {
        // If it's a symbol, search for it on CoinGecko first
        if (tokenMint.length < 20) {
          const searchResults = await searchTokensFromCoinGecko(tokenMint);
          if (searchResults.length > 0) {
            // Use the first result's ID to get detailed info
            const tokenId = searchResults[0].id;
            cgData = await getTokenInfoFromCoinGecko(tokenId);
          }
        } else {
          // It's likely a mint address, let's search by name
          const searchResults = await searchTokensFromCoinGecko(tokenInfo.name);
          if (searchResults.length > 0) {
            const tokenId = searchResults[0].id;
            cgData = await getTokenInfoFromCoinGecko(tokenId);
          }
        }
      } catch (cgError) {
        console.error('Error fetching from CoinGecko:', cgError);
        // Continue with default/mock data
      }
      
      // Get price history for volatility calculation
      let volatility = 8.5; // Default value
      try {
        if (cgData.symbol) {
          const priceHistory = await getTokenPriceHistory(cgData.symbol.toLowerCase(), 30);
          if (priceHistory.prices.length > 0) {
            // Calculate standard deviation of price changes as volatility
            const prices = priceHistory.prices.map((p: any) => p.price);
            const pctChanges = prices.slice(1).map((price: number, i: number) => 
              ((price - prices[i]) / prices[i]) * 100
            );
            
            if (pctChanges.length > 0) {
              const mean = pctChanges.reduce((a: number, b: number) => a + b, 0) / pctChanges.length;
              const variance = pctChanges.reduce((a: number, b: number) => a + Math.pow(b - mean, 2), 0) / pctChanges.length;
              volatility = Math.sqrt(variance);
            }
          }
        }
      } catch (volatilityError) {
        console.error('Error calculating volatility:', volatilityError);
      }
      
      // Combine data from different sources with fallbacks to mock data
      return {
        price: tokenInfo.price || cgData.price || 0,
        priceChange24h: tokenInfo.priceChange || cgData.priceChange || -1.2,
        volume24h: tokenInfo.volume || cgData.volume || 42500000,
        marketCap: tokenInfo.marketCap || cgData.marketCap || 325000000,
        allTimeHigh: cgData.allTimeHigh || 12.45,
        allTimeLow: cgData.allTimeLow || 0.12,
        liquidityDepth: 3450000, // Currently mock data
        tradingVolume7d: cgData.volume ? cgData.volume * 7 : 168000000,
        priceVolatility30d: volatility
      };
    } catch (error) {
      console.error('Error fetching token analytics:', error);
      throw new Error(`Failed to get analytics for token ${tokenMint}`);
    }
  }

  /**
   * Generate trading signals for a given token based on current market conditions
   * @param tokenMint Token mint address or symbol
   * @returns Trading recommendation with confidence score and reasoning
   */
  async getTradingSignal(tokenMint: string): Promise<TradingSignal> {
    try {
      // Get token analytics
      const analytics = await this.getTokenAnalytics(tokenMint);
      const tokenInfo = await this.getTokenInfo(tokenMint);
      
      // Get historical price data for technical analysis
      let priceHistory = null;
      try {
        const searchResults = await searchTokensFromCoinGecko(tokenInfo.symbol);
        if (searchResults.length > 0) {
          const tokenId = searchResults[0].id;
          priceHistory = await getTokenPriceHistory(tokenId, 30);
        }
      } catch (error) {
        console.error('Error fetching price history:', error);
      }
      
      // Calculate some basic technical indicators
      let technicalIndicators = {
        rsi: 50, // Neutral by default
        trend: 'neutral',
        support: analytics.price * 0.9,
        resistance: analytics.price * 1.1
      };
      
      if (priceHistory && priceHistory.prices && priceHistory.prices.length > 0) {
        const prices = priceHistory.prices.map((p: any) => p.price);
        
        // Calculate a simple RSI (14-period)
        const gains = [];
        const losses = [];
        
        for (let i = 1; i < prices.length; i++) {
          const change = prices[i] - prices[i-1];
          if (change >= 0) {
            gains.push(change);
            losses.push(0);
          } else {
            gains.push(0);
            losses.push(Math.abs(change));
          }
        }
        
        // Use only the last 14 periods
        const recentGains = gains.slice(-14);
        const recentLosses = losses.slice(-14);
        
        if (recentGains.length > 0 && recentLosses.length > 0) {
          const avgGain = recentGains.reduce((sum, val) => sum + val, 0) / recentGains.length;
          const avgLoss = recentLosses.reduce((sum, val) => sum + val, 0) / recentLosses.length;
          
          if (avgLoss > 0) {
            const rs = avgGain / avgLoss;
            technicalIndicators.rsi = 100 - (100 / (1 + rs));
          } else {
            technicalIndicators.rsi = 100; // No losses means RSI = 100
          }
        }
        
        // Determine trend
        const firstHalf = prices.slice(0, Math.floor(prices.length / 2));
        const secondHalf = prices.slice(Math.floor(prices.length / 2));
        
        const firstHalfAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
        
        if (secondHalfAvg > firstHalfAvg * 1.03) {
          technicalIndicators.trend = 'bullish';
        } else if (secondHalfAvg < firstHalfAvg * 0.97) {
          technicalIndicators.trend = 'bearish';
        }
        
        // Find recent support and resistance
        technicalIndicators.support = Math.min(...prices.slice(-7));
        technicalIndicators.resistance = Math.max(...prices.slice(-7));
      }
      
      // Generate trading signal based on technical indicators and price data
      let recommendation: 'buy' | 'sell' | 'hold';
      let confidence: number;
      let reasoning: string;
      let timeframe: 'short' | 'medium' | 'long';
      
      // Technical analysis logic
      if (technicalIndicators.rsi < 30 && analytics.priceChange24h < -5) {
        // Oversold condition
        recommendation = 'buy';
        confidence = 80;
        timeframe = 'short';
        reasoning = `Token appears oversold with RSI at ${technicalIndicators.rsi.toFixed(2)} and 24h price drop of ${analytics.priceChange24h.toFixed(2)}%. Significant volume of $${analytics.volume24h.toLocaleString()} indicates market interest.`;
      } else if (technicalIndicators.rsi > 70 && analytics.priceChange24h > 10) {
        // Overbought condition
        recommendation = 'sell';
        confidence = 75;
        timeframe = 'short';
        reasoning = `Token appears overbought with RSI at ${technicalIndicators.rsi.toFixed(2)} and significant 24h price increase of ${analytics.priceChange24h.toFixed(2)}%. Consider taking profits.`;
      } else if (technicalIndicators.trend === 'bullish' && analytics.priceChange24h > 0) {
        // Positive trend continuation
        recommendation = 'buy';
        confidence = 65;
        timeframe = 'medium';
        reasoning = `Bullish trend with positive momentum. Price is up ${analytics.priceChange24h.toFixed(2)}% in 24h with good volume of $${analytics.volume24h.toLocaleString()}.`;
      } else if (technicalIndicators.trend === 'bearish' && analytics.priceChange24h < 0) {
        // Negative trend continuation
        recommendation = 'sell';
        confidence = 60;
        timeframe = 'medium';
        reasoning = `Bearish trend with negative momentum. Price is down ${Math.abs(analytics.priceChange24h).toFixed(2)}% in 24h with volume of $${analytics.volume24h.toLocaleString()}.`;
      } else {
        // Mixed signals
        recommendation = 'hold';
        confidence = 50;
        timeframe = 'medium';
        reasoning = `Mixed signals with RSI at ${technicalIndicators.rsi.toFixed(2)} and 24h price change of ${analytics.priceChange24h.toFixed(2)}%. Market conditions are uncertain.`;
      }
      
      // Adjust entry, target and stop loss based on technical levels
      const entryPrice = analytics.price;
      let targetPrice, stopLoss;
      
      if (recommendation === 'buy') {
        targetPrice = Math.max(analytics.price * 1.1, technicalIndicators.resistance * 1.05);
        stopLoss = Math.min(analytics.price * 0.95, technicalIndicators.support * 0.95);
      } else {
        targetPrice = Math.min(analytics.price * 0.9, technicalIndicators.support * 0.95);
        stopLoss = Math.max(analytics.price * 1.05, technicalIndicators.resistance * 1.05);
      }
      
      return {
        token: tokenInfo.symbol,
        recommendation,
        confidence,
        timeframe,
        entryPrice,
        targetPrice,
        stopLoss,
        reasoning
      };
    } catch (error) {
      console.error('Error generating trading signal:', error);
      throw new Error(`Failed to generate trading signal for ${tokenMint}`);
    }
  }

  /**
   * Simulate or execute a token swap on Solana using Jupiter aggregator
   * @param params Swap parameters including tokens and amount
   * @param execute Whether to execute the swap (true) or just simulate (false)
   * @returns Swap result with price and transaction details
   */
  async swapTokens(params: SwapParams, execute: boolean = false): Promise<SwapResult> {
    try {
      // Track execution time for monitoring
      const startTime = Date.now();

      // Get Jupiter API client
      const jupiter = await getJupiterClient();
      if (!jupiter) {
        throw new Error('Jupiter client not available');
      }
      
      // Get token information to ensure we have proper token addresses
      const fromTokenInfo = await this.getTokenInfo(params.fromToken);
      const toTokenInfo = await this.getTokenInfo(params.toToken);
      
      // Use mint addresses if available
      const inputMint = fromTokenInfo.mintAddress;
      const outputMint = toTokenInfo.mintAddress;
      
      if (!inputMint || !outputMint) {
        throw new Error('Could not resolve token mint addresses');
      }
      
      // In simulation mode, only get quote
      if (!execute) {
        try {
          // Get routes for this swap
          const routesResponse = await jupiter.getRoutes({
            inputMint,
            outputMint,
            amount: params.amount * Math.pow(10, fromTokenInfo.decimals) // Convert to lamports or smallest token unit
          });
          
          if (!routesResponse || !routesResponse.routesInfos || routesResponse.routesInfos.length === 0) {
            throw new Error('No routes found for this swap');
          }
          
          // Get best route (first one is usually best)
          const bestRoute = routesResponse.routesInfos[0];
          
          // Convert output amount back to human-readable format
          const outputDecimals = toTokenInfo.decimals;
          const outAmount = bestRoute.outAmount / Math.pow(10, outputDecimals);
          
          // Calculate price
          const price = outAmount / params.amount;
          
          // Calculate gas fees and price impact
          const estimatedFees = 0.000005; // Mock fee in SOL - in real implementation this would be estimated
          const priceImpact = bestRoute.priceImpactPct || 0;
          
          // Record execution time for monitoring
          const executionTime = Date.now() - startTime;
          console.log(`Swap quote generated in ${executionTime}ms`);
          
          // Return swap simulation result
          return {
            success: true,
            fromAmount: params.amount,
            toAmount: outAmount,
            price,
            priceImpact,
            estimatedFees,
            txId: undefined,
            route: {
              marketName: bestRoute.marketInfos[0]?.amm?.label || 'Jupiter',
              inAmount: params.amount,
              outAmount
            }
          } as SwapResult;
        } catch (error: unknown) {
          console.error('Error simulating swap:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return {
            success: false,
            fromAmount: params.amount,
            toAmount: 0,
            price: 0,
            error: `Swap simulation failed: ${errorMessage}`
          };
        }
      }
      
      // Execute mode - This would create a real transaction in a production environment
      // For now, we'll mock a successful swap transaction
      
      try {
        // This is where the actual transaction would be created and sent
        // jupiter.exchange({ ... })
        
        // Mock a successful execution
        const mockTxId = 'mock_transaction_id_' + Date.now().toString(36);
        const estimatedOutAmount = params.amount * 10; // Mock exchange rate
        
        // Record execution time for monitoring
        const executionTime = Date.now() - startTime;
        console.log(`Swap execution completed in ${executionTime}ms`);
        
        return {
          success: true,
          fromAmount: params.amount,
          toAmount: estimatedOutAmount,
          price: estimatedOutAmount / params.amount,
          txId: mockTxId,
          route: {
            marketName: 'Jupiter Aggregator',
            inAmount: params.amount,
            outAmount: estimatedOutAmount
          }
        } as SwapResult;
      } catch (error: unknown) {
        console.error('Error executing swap transaction:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          success: false,
          fromAmount: params.amount,
          toAmount: 0,
          price: 0,
          error: `Swap execution failed: ${errorMessage}`
        };
      }
    } catch (error: unknown) {
      console.error('Error in swap operation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Return error result
      return {
        success: false,
        fromAmount: params.amount,
        toAmount: 0,
        price: 0,
        error: `Swap failed: ${errorMessage}`
      };
    }
  }
  
  /**
   * Get detailed market data for multiple tokens
   * @param limit Number of tokens to return, default 100
   * @returns Array of tokens with their market data
   */
  async getTopTokens(limit: number = 100): Promise<(EnhancedTokenInfo & Partial<TokenAnalytics>)[]> {
    try {
      // Get token list from Solana service
      const tokens = await solanaServiceV2.getTokenList();
      
      // Return top tokens sorted by market cap
      return tokens
        .slice(0, limit)
        .map(token => ({
          symbol: token.symbol,
          name: token.name,
          mintAddress: token.mint,
          decimals: token.decimals,
          logo: token.logoURI,
          price: token.price || 0,
          marketCap: token.marketCap || 0,
          volume24h: token.volume24h || 0,
          priceChange24h: token.change24h || 0
        } as EnhancedTokenInfo & Partial<TokenAnalytics>));
    } catch (error: unknown) {
      console.error('Error fetching top tokens:', error);
      throw new Error('Failed to get top tokens');
    }
  }
}

/**
 * Create a singleton instance of SolanaTools
 */
let solanaToolsInstance: SolanaTools | null = null;

export function getSolanaTools(): SolanaTools {
  if (!solanaToolsInstance) {
    solanaToolsInstance = new SolanaTools();
  }
  return solanaToolsInstance;
}