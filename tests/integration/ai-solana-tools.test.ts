import { describe, it, expect } from 'vitest';
import { SolanaTools } from '@/lib/solana/tools';

/**
 * Real integration test for Solana tools using actual API calls
 * Tests the core functionality that will be used by Claude AI
 */
describe('SolanaTools Real Integration', () => {
  // Create real instance of SolanaTools
  const solanaTools = new SolanaTools();
  
  it('should get real token information by symbol', async () => {
    // Test with a well-known token
    const tokenInfo = await solanaTools.getTokenInfo('SOL');
    
    // Verify we get real data
    expect(tokenInfo).toBeDefined();
    expect(tokenInfo.symbol).toBe('SOL');
    expect(tokenInfo.name).toBeDefined();
    expect(tokenInfo.mintAddress).toBeDefined();
    expect(tokenInfo.price).toBeGreaterThan(0);
    expect(tokenInfo.marketCap).toBeGreaterThan(0);
  });
  
  it('should get real token information by mint address', async () => {
    // SOL token mint address
    const solMint = 'So11111111111111111111111111111111111111112';
    const tokenInfo = await solanaTools.getTokenInfo(solMint);
    
    // Verify we get real data
    expect(tokenInfo).toBeDefined();
    expect(tokenInfo.symbol).toBe('SOL');
    expect(tokenInfo.mintAddress).toBe(solMint);
  });
  
  it('should fetch real token analytics with price history', async () => {
    // SOL token mint address
    const solMint = 'So11111111111111111111111111111111111111112';
    const analytics = await solanaTools.getTokenAnalytics(solMint);
    
    // Verify analytics data
    expect(analytics).toBeDefined();
    expect(analytics.price).toBeGreaterThan(0);
    expect(analytics.priceChange24h).toBeDefined();
    expect(analytics.marketCap).toBeGreaterThan(0);
    expect(analytics.volume24h).toBeGreaterThan(0);
    
    // Since we've fixed the interface to match the implementation, 
    // we'll now check metrics from the TokenAnalytics interface
    expect(analytics.liquidityDepth).toBeDefined();
    expect(analytics.tradingVolume7d).toBeGreaterThan(0);
    expect(analytics.priceVolatility30d).toBeDefined();
  });
  
  it('should generate real trading signals based on current market data', async () => {
    // SOL token mint address
    const solMint = 'So11111111111111111111111111111111111111112';
    const signal = await solanaTools.getTradingSignal(solMint);
    
    // Verify signal data matches our TradingSignal interface
    expect(signal).toBeDefined();
    expect(['buy', 'sell', 'hold']).toContain(signal.recommendation);
    expect(signal.confidence).toBeGreaterThanOrEqual(0);
    expect(signal.confidence).toBeLessThanOrEqual(100);
    
    // Check for price targets
    expect(signal.entryPrice).toBeDefined();
    expect(signal.targetPrice).toBeDefined();
    expect(signal.stopLoss).toBeDefined();
    
    // Reasoning should be provided
    expect(signal.reasoning).toBeDefined();
    expect(signal.reasoning.length).toBeGreaterThan(0);
  });
  
  it('should fetch top tokens with real market data', async () => {
    const topTokens = await solanaTools.getTopTokens(5);
    
    // Verify we get actual data
    expect(topTokens).toBeDefined();
    expect(topTokens.length).toBeGreaterThan(0);
    expect(topTokens.length).toBeLessThanOrEqual(5);
    
    // Each token should have proper data
    topTokens.forEach(token => {
      expect(token.symbol).toBeDefined();
      expect(token.name).toBeDefined();
      expect(token.mintAddress).toBeDefined();
      expect(token.price).toBeDefined();
      expect(token.marketCap).toBeDefined();
      
      // Logos should be provided when available
      if (token.symbol === 'SOL') {
        expect(token.logo).toBeDefined();
      }
    });
  });
  
  it('should get swap price estimation for real tokens', async () => {
    // SOL -> USDC swap
    const solMint = 'So11111111111111111111111111111111111111112';
    const usdcMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    const amount = 1; // 1 SOL
    
    // This method needs to be implemented based on the actual SolanaTools class
    // Since the class doesn't have a simulate_token_swap method directly
    // Let's use swapTokens method with simulation flag set to true
    const swapInfo = await solanaTools.swapTokens({
      fromToken: solMint,
      toToken: usdcMint,
      amount,
      slippageBps: 50
    }, false);
    
    // Verify swap data
    expect(swapInfo).toBeDefined();
    expect(swapInfo.success).toBe(true);
    expect(swapInfo.fromAmount).toBe(amount);
    expect(swapInfo.toAmount).toBeGreaterThan(0);
    expect(swapInfo.price).toBeGreaterThan(0);
    expect(swapInfo.priceImpact).toBeDefined();
  });
});