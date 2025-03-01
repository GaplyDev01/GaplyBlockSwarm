/**
 * E2E test for the Solana tools integration with AI chat
 * Tests the complete flow in a browser environment
 */

describe('Solana Tools with AI Chat E2E', () => {
  // Define test timeout - real API calls can take time
  jest.setTimeout(30000);

  beforeAll(async () => {
    // Navigate to home page
    await page.goto('http://localhost:3000');
  });

  test('User can navigate to AI chat from dashboard', async () => {
    // First login if needed
    if (await page.$('text=Sign In')) {
      await page.click('text=Sign In');
      // Complete auth flow...
    }
    
    // Navigate to dashboard
    await page.click('text=ENTER PLATFORM');
    await page.waitForSelector('text=Dashboard', { visible: true });
    
    // Click on AI chat icon in sidebar
    await page.click('[title="AI Chat"]');
    
    // Verify AI chat page loaded
    await page.waitForSelector('text=BlockSwarms AI Chat', { visible: true });
    expect(await page.isVisible('.chat-container')).toBe(true);
  });

  test('Token details card can navigate to token-specific AI chat', async () => {
    // Go to dashboard
    await page.goto('http://localhost:3000/dashboard');
    
    // Search for a token
    await page.fill('input[placeholder*="Search"]', 'SOL');
    await page.click('text=Solana (SOL)');
    
    // Wait for token details to load
    await page.waitForSelector('text=Chat About SOL', { visible: true });
    
    // Click on chat button
    await page.click('text=Chat About SOL');
    
    // Verify we're on AI chat page with token context
    await page.waitForSelector('text=AI Chat about SOL', { visible: true });
    expect(await page.isVisible('text=So11...1112')).toBe(true);
  });

  test('AI can respond with real Solana token data', async () => {
    // Go to AI chat
    await page.goto('http://localhost:3000/src/app/ai-chat');
    
    // Type a message about a token
    await page.fill('textarea[placeholder*="Ask about"]', 'What is the current price of SOL?');
    await page.click('button[type="submit"]');
    
    // Wait for response (this may take time due to real API calls)
    await page.waitForSelector('.message[data-role="assistant"]', { 
      visible: true,
      timeout: 15000 
    });
    
    // Get the response text
    const responseText = await page.$eval('.message[data-role="assistant"]', 
      el => el.textContent
    );
    
    // Response should contain price information
    expect(responseText).toContain('SOL');
    expect(responseText).toMatch(/\$\d+(\.\d+)?/); // Match price format
  });

  test('AI can generate trading signal based on real data', async () => {
    // Go to AI chat
    await page.goto('http://localhost:3000/src/app/ai-chat');
    
    // Ask for trading signal
    await page.fill('textarea[placeholder*="Ask about"]', 
      'What is your trading recommendation for SOL right now?'
    );
    await page.click('button[type="submit"]');
    
    // Wait for response (this may take time due to real API calls)
    await page.waitForSelector('.message[data-role="assistant"]', { 
      visible: true,
      timeout: 15000 
    });
    
    // Get the response text
    const responseText = await page.$eval('.message[data-role="assistant"]', 
      el => el.textContent
    );
    
    // Response should contain trading recommendation
    expect(responseText).toMatch(/BUY|SELL|HOLD/i);
    expect(responseText).toContain('RSI');
    expect(responseText).toContain('moving average');
  });

  test('AI can provide swap price estimation', async () => {
    // Go to AI chat
    await page.goto('http://localhost:3000/src/app/ai-chat');
    
    // Ask for swap price
    await page.fill('textarea[placeholder*="Ask about"]', 
      'How much USDC would I get for 1 SOL right now?'
    );
    await page.click('button[type="submit"]');
    
    // Wait for response
    await page.waitForSelector('.message[data-role="assistant"]', { 
      visible: true,
      timeout: 15000 
    });
    
    // Get the response text
    const responseText = await page.$eval('.message[data-role="assistant"]', 
      el => el.textContent
    );
    
    // Response should contain swap details
    expect(responseText).toContain('USDC');
    expect(responseText).toContain('SOL');
    expect(responseText).toMatch(/\$\d+(\.\d+)?/); // Match price format
  });
});