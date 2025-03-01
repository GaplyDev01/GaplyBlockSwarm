import { getSolanaTools } from '../../../lib/solana/tools';

/**
 * AI tool definitions for Solana blockchain operations
 * These functions will be exposed to Claude as tools
 */
export const solanaToolSchema = [
  {
    name: "get_token_price",
    description: "Get the current price and basic information for any Solana token. This tool returns the current price in USD, 24h price change percentage, and current market cap. Use this when the user asks about token prices, market data, or wants to check the value of specific Solana tokens.",
    parameters: {
      type: "object",
      properties: {
        token: {
          type: "string",
          description: "The token symbol (e.g., 'SOL', 'BONK', 'JUP') or mint address (e.g., 'So11111111111111111111111111111111111111112')"
        }
      },
      required: ["token"]
    }
  },
  {
    name: "get_token_analytics",
    description: "Get detailed analytics and market data for a Solana token. This tool provides comprehensive analytics including price, price changes, trading volume, market cap, all-time highs/lows, liquidity depth, and volatility metrics. Use this when the user wants in-depth analysis of a token's performance or detailed market metrics beyond just the current price.",
    parameters: {
      type: "object",
      properties: {
        token: {
          type: "string",
          description: "The token symbol (e.g., 'SOL', 'BONK', 'JUP') or mint address"
        }
      },
      required: ["token"]
    }
  },
  {
    name: "get_trading_signal",
    description: "Generate a trading recommendation for a specific Solana token based on current market conditions, price action, and on-chain metrics. The signal includes a buy/sell/hold recommendation, confidence level, suggested entry price, target price, stop loss, and detailed reasoning. Use this when the user asks for trading advice, investment recommendations, or whether they should buy or sell a specific token.",
    parameters: {
      type: "object",
      properties: {
        token: {
          type: "string",
          description: "The token symbol (e.g., 'SOL', 'BONK', 'JUP') or mint address"
        }
      },
      required: ["token"]
    }
  },
  {
    name: "simulate_token_swap",
    description: "Simulate a token swap on Solana to get the expected output amount, price impact, and best route. This tool doesn't execute the actual swap but provides a preview of what would happen. Use this when the user wants to check swap rates, compare prices, or understand the potential outcome of a swap without committing to it.",
    parameters: {
      type: "object",
      properties: {
        fromToken: {
          type: "string",
          description: "The source token symbol or mint address"
        },
        toToken: {
          type: "string", 
          description: "The destination token symbol or mint address"
        },
        amount: {
          type: "number",
          description: "The amount of fromToken to swap"
        },
        slippageBps: {
          type: "number",
          description: "Maximum acceptable slippage in basis points (e.g., 50 = 0.5%). Default is 50.",
          default: 50
        }
      },
      required: ["fromToken", "toToken", "amount"]
    }
  },
  {
    name: "get_top_tokens",
    description: "Get a list of top Solana tokens sorted by market cap, with price and volume data. This tool returns information about multiple tokens at once, making it useful for market overview and comparison. Use this when the user wants to know about trending tokens, the biggest tokens on Solana, or needs to compare multiple tokens at once.",
    parameters: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Number of tokens to return (default 10, max 100)",
          default: 10
        }
      }
    }
  }
];

/**
 * Implementation of the Solana tools for Claude
 */
export class SolanaTool {
  private solanaTools = getSolanaTools();
  
  /**
   * Get token price and basic information
   */
  async get_token_price({ token }: { token: string }) {
    try {
      const tokenInfo = await this.solanaTools.getTokenInfo(token);
      
      return {
        symbol: tokenInfo.symbol,
        name: tokenInfo.name,
        mintAddress: tokenInfo.mintAddress,
        price: tokenInfo.price || 0,
        priceChange24h: tokenInfo.priceChange || 0,
        marketCap: tokenInfo.marketCap || 0,
        volume24h: tokenInfo.volume || 0
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { error: `Failed to get price for token ${token}: ${errorMessage}` };
    }
  }
  
  /**
   * Get detailed token analytics
   */
  async get_token_analytics({ token }: { token: string }) {
    try {
      const analytics = await this.solanaTools.getTokenAnalytics(token);
      const tokenInfo = await this.solanaTools.getTokenInfo(token);
      
      return {
        symbol: tokenInfo.symbol,
        name: tokenInfo.name,
        ...analytics
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { error: `Failed to get analytics for token ${token}: ${errorMessage}` };
    }
  }
  
  /**
   * Get trading recommendation
   */
  async get_trading_signal({ token }: { token: string }) {
    try {
      const signal = await this.solanaTools.getTradingSignal(token);
      return signal;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { error: `Failed to generate trading signal for ${token}: ${errorMessage}` };
    }
  }
  
  /**
   * Simulate a token swap
   */
  async simulate_token_swap({ 
    fromToken, 
    toToken, 
    amount, 
    slippageBps = 50 
  }: { 
    fromToken: string; 
    toToken: string; 
    amount: number; 
    slippageBps?: number;
  }) {
    try {
      // Track start time for performance monitoring
      const startTime = Date.now();
      
      // Execute the swap simulation
      const result = await this.solanaTools.swapTokens({
        fromToken,
        toToken,
        amount,
        slippageBps
      }, false); // simulate only
      
      // Track execution time
      const executionTime = Date.now() - startTime;
      
      // Add some helpful information for the user
      if (result.success) {
        // Format the response for better readability
        return {
          success: true,
          fromToken: fromToken.toUpperCase(),
          toToken: toToken.toUpperCase(),
          fromAmount: result.fromAmount,
          toAmount: result.toAmount,
          exchangeRate: `1 ${fromToken.toUpperCase()} = ${result.price.toFixed(6)} ${toToken.toUpperCase()}`,
          priceImpact: result.priceImpact ? `${result.priceImpact.toFixed(2)}%` : 'Unknown',
          estimatedFees: result.estimatedFees ? `${result.estimatedFees} SOL` : 'Unknown',
          route: result.route ? `via ${result.route.marketName}` : 'Jupiter Aggregator',
          responseTime: `${executionTime}ms`
        };
      } else {
        // Return error information
        return { 
          success: false,
          fromToken: fromToken.toUpperCase(),
          toToken: toToken.toUpperCase(),
          amount: amount,
          error: result.error || 'Failed to simulate swap'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { 
        success: false,
        error: `Failed to simulate swap: ${errorMessage}` 
      };
    }
  }
  
  /**
   * Get top tokens by market cap
   */
  async get_top_tokens({ limit = 10 }: { limit?: number }) {
    try {
      const tokens = await this.solanaTools.getTopTokens(Math.min(limit, 100));
      return tokens.map(token => ({
        symbol: token.symbol,
        name: token.name,
        price: token.price || 0,
        priceChange24h: token.priceChange24h || 0,
        marketCap: token.marketCap || 0,
        volume24h: token.volume24h || 0
      }));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { error: `Failed to get top tokens: ${errorMessage}` };
    }
  }
}