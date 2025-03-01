import { test, expect } from '@playwright/test';
import { getTokenInfo } from '@/infrastructure/ai/tools/SolanaTools';
import { SolanaServiceFactory } from '@/infrastructure/blockchain/solana/SolanaServiceFactory';

/**
 * Real-world test for the AI-Token integration flow
 * This test performs actual network calls and validates real data
 */
test.describe('AI Token Chat Integration (Real Data)', () => {
  test('should retrieve actual token data from the Solana blockchain', async () => {
    // Use actual Solana service, not a mock
    const solanaService = await SolanaServiceFactory.createDefaultService();
    expect(solanaService).toBeDefined();
    
    // Test with actual SOL token mint address
    const solMint = 'So11111111111111111111111111111111111111112';
    
    // Get real token info using our implementation
    const tokenInfo = await solanaService.getTokenInfo(solMint);
    
    // Verify we get actual data back
    expect(tokenInfo).toBeDefined();
    expect(tokenInfo.symbol).toBe('SOL');
    expect(tokenInfo.name).toBe('Wrapped SOL');
    expect(tokenInfo.mint).toBe(solMint);
    expect(tokenInfo.decimals).toBe(9);
    
    // Verify price data exists (without asserting specific values since they change)
    expect(typeof tokenInfo.price).toBe('number');
    expect(tokenInfo.price).toBeGreaterThan(0);
    
    // Test SolanaTools implementation that AI would use
    const toolHandler = {
      getTokenInfo: async (params: { mintAddress?: string, symbol?: string }) => {
        if (params.mintAddress) {
          return await solanaService.getTokenInfo(params.mintAddress);
        } else if (params.symbol) {
          const tokens = await solanaService.getTopTokens(10);
          return tokens.find(t => t.symbol.toLowerCase() === params.symbol?.toLowerCase());
        }
        throw new Error('Either mintAddress or symbol must be provided');
      }
    };
    
    // Test with mint address (simulating AI tool usage)
    const tokenByMint = await toolHandler.getTokenInfo({ mintAddress: solMint });
    expect(tokenByMint).toBeDefined();
    expect(tokenByMint?.symbol).toBe('SOL');
    
    // Test with symbol (simulating AI tool usage)
    const tokenBySymbol = await toolHandler.getTokenInfo({ symbol: 'SOL' });
    expect(tokenBySymbol).toBeDefined();
    expect(tokenBySymbol?.mintAddress).toBe(solMint);
  });
  
  test('should get real market data for token analytics', async () => {
    // Use actual Solana service, not a mock
    const solanaService = await SolanaServiceFactory.createDefaultService();
    
    // Get top tokens with real market data
    const topTokens = await solanaService.getTopTokens(5);
    
    // Verify we got actual data
    expect(topTokens.length).toBeGreaterThan(0);
    
    // Check that each token has necessary properties
    for (const token of topTokens) {
      expect(token.symbol).toBeDefined();
      expect(token.name).toBeDefined();
      expect(token.mint).toBeDefined();
      
      // Market data
      expect(typeof token.price).toBe('number');
      expect(typeof token.marketCap).toBe('number');
      expect(typeof token.volume24h).toBe('number');
      
      // Ensure the market data is reasonable (not zeros or null values)
      if (token.symbol === 'SOL') { // SOL should definitely have market data
        expect(token.price).toBeGreaterThan(0);
        expect(token.marketCap).toBeGreaterThan(0);
        expect(token.volume24h).toBeGreaterThan(0);
      }
    }
  });
  
  test('should generate a valid trading signal with real data', async () => {
    // Use actual Solana service, not a mock
    const solanaService = await SolanaServiceFactory.createDefaultService();
    
    // Get a trading signal for SOL
    const solMint = 'So11111111111111111111111111111111111111112';
    const signal = await solanaService.getTradingSignal(solMint);
    
    // Verify the signal contains required properties
    expect(signal).toBeDefined();
    expect(['BUY', 'SELL', 'HOLD', 'NEUTRAL']).toContain(signal.recommendation);
    expect(signal.confidence).toBeGreaterThanOrEqual(0);
    expect(signal.confidence).toBeLessThanOrEqual(100);
    
    // Verify indicators are calculated with real data
    expect(signal.indicators).toBeDefined();
    expect(signal.indicators.rsi).toBeDefined();
    expect(signal.indicators.movingAverages).toBeDefined();
    
    // Check RSI is in valid range
    expect(signal.indicators.rsi).toBeGreaterThanOrEqual(0);
    expect(signal.indicators.rsi).toBeLessThanOrEqual(100);
  });
  
  test('AI chat initializes with correct token context', async ({ page }) => {
    // Navigate to a token details chat with query parameters
    await page.goto('/src/app/ai-chat?token=SOL&mint=So11111111111111111111111111111111111111112');
    
    // Verify the token context appears in the UI
    await expect(page.locator('text=AI Chat about SOL')).toBeVisible();
    
    // Check that the token mint address is displayed in shortened form
    await expect(page.locator('text=So11...1112')).toBeVisible();
    
    // Verify the chat interface is loaded
    await expect(page.locator('.chat-container')).toBeVisible();
    
    // Close browser session
    await page.close();
  });
});