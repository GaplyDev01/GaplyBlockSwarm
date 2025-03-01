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
    const tokenInfo = await solanaTools.getTokenInfo({ symbol: 'SOL' });
    
    // Verify we get real data
    expect(tokenInfo).toBeDefined();
    expect(tokenInfo.symbol).toBe('SOL');
    expect(tokenInfo.name).toBeDefined();
    expect(tokenInfo.mint).toBeDefined();
    expect(tokenInfo.price).toBeGreaterThan(0);
    expect(tokenInfo.marketCap).toBeGreaterThan(0);
  });
  
  it('should get real token information by mint address', async () => {
    // SOL token mint address
    const solMint = 'So11111111111111111111111111111111111111112';
    const tokenInfo = await solanaTools.getTokenInfo({ mintAddress: solMint });
    
    // Verify we get real data
    expect(tokenInfo).toBeDefined();
    expect(tokenInfo.symbol).toBe('SOL');
    expect(tokenInfo.mint).toBe(solMint);
  });
  
  it('should fetch real token analytics with price history', async () => {
    // SOL token mint address
    const solMint = 'So11111111111111111111111111111111111111112';
    const analytics = await solanaTools.getTokenAnalytics({ mintAddress: solMint });
    
    // Verify analytics data
    expect(analytics).toBeDefined();
    expect(analytics.currentPrice).toBeGreaterThan(0);
    expect(analytics.priceChange24h).toBeDefined();
    expect(analytics.marketCap).toBeGreaterThan(0);
    expect(analytics.volume24h).toBeGreaterThan(0);
    
    // Verify historical data
    expect(analytics.priceHistory).toBeDefined();
    expect(analytics.priceHistory.length).toBeGreaterThan(0);
    
    // Each price point should have timestamp and price
    analytics.priceHistory.forEach(point => {
      expect(point.timestamp).toBeDefined();
      expect(point.price).toBeDefined();
    });
  });
  
  it('should generate real trading signals based on current market data', async () => {
    // SOL token mint address
    const solMint = 'So11111111111111111111111111111111111111112';
    const signal = await solanaTools.getTradingSignal({ mintAddress: solMint });
    
    // Verify signal data
    expect(signal).toBeDefined();
    expect(['BUY', 'SELL', 'HOLD', 'NEUTRAL']).toContain(signal.recommendation);
    expect(signal.confidence).toBeGreaterThanOrEqual(0);
    expect(signal.confidence).toBeLessThanOrEqual(100);
    
    // Technical indicators should be present
    expect(signal.indicators).toBeDefined();
    expect(signal.indicators.rsi).toBeDefined();
    expect(signal.indicators.rsi).toBeGreaterThanOrEqual(0);
    expect(signal.indicators.rsi).toBeLessThanOrEqual(100);
    
    // Moving averages
    expect(signal.indicators.movingAverages).toBeDefined();
    expect(signal.indicators.movingAverages.sma50).toBeDefined();
    expect(signal.indicators.movingAverages.sma200).toBeDefined();
    
    // Explanation should be provided
    expect(signal.explanation).toBeDefined();
    expect(signal.explanation.length).toBeGreaterThan(0);
  });
  
  it('should fetch top tokens with real market data', async () => {
    const topTokens = await solanaTools.getTopTokens({ limit: 5 });
    
    // Verify we get actual data
    expect(topTokens).toBeDefined();
    expect(topTokens.length).toBeGreaterThan(0);
    expect(topTokens.length).toBeLessThanOrEqual(5);
    
    // Each token should have proper data
    topTokens.forEach(token => {
      expect(token.symbol).toBeDefined();
      expect(token.name).toBeDefined();
      expect(token.mint).toBeDefined();
      expect(token.price).toBeDefined();
      expect(token.marketCap).toBeDefined();
      
      // Logos should be provided when available
      if (token.symbol === 'SOL') {
        expect(token.logoURI).toBeDefined();
      }
    });
  });
  
  it('should get swap price estimation for real tokens', async () => {
    // SOL -> USDC swap
    const solMint = 'So11111111111111111111111111111111111111112';
    const usdcMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    const amount = 1; // 1 SOL
    
    const swapInfo = await solanaTools.getSwapPrice({
      sourceMint: solMint,
      destinationMint: usdcMint,
      amount
    });
    
    // Verify swap data
    expect(swapInfo).toBeDefined();
    expect(swapInfo.inputAmount).toBe(amount);
    expect(swapInfo.inputToken).toBe('SOL');
    expect(swapInfo.outputToken).toBe('USDC');
    expect(swapInfo.outputAmount).toBeGreaterThan(0);
    expect(swapInfo.exchangeRate).toBeGreaterThan(0);
    expect(swapInfo.priceImpact).toBeDefined();
    expect(swapInfo.fee).toBeDefined();
  });
});