import { SolanaTools } from '../../lib/solana/tools';
import { render, screen } from '@testing-library/react';
import { TokenDetailsCard } from '../../components/ui/token-details-card';

// Simple integration test for token functionality that works with our Jest setup
describe('Token Integration Test', () => {
  // Mock token for testing
  const mockToken = {
    name: 'Wrapped SOL',
    symbol: 'SOL',
    mint: 'So11111111111111111111111111111111111111112',
    decimals: 9,
    price: 169.42,
    change24h: 2.45,
    marketCap: 73400000000,
    volume24h: 2100000000,
    supply: 430000000,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
  };

  // Mock fetch for SolanaTools
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        data: mockToken,
      }),
      status: 200,
    })
  );

  test('renders token details card with correct chat link', () => {
    render(<TokenDetailsCard token={mockToken} />);
    
    // Check if token name is displayed
    expect(screen.getByText('Wrapped SOL')).toBeInTheDocument();
    
    // Check if price is displayed
    expect(screen.getByText('$169.42')).toBeInTheDocument();
    
    // Check if Chat button exists with correct token
    const chatButton = screen.getByText(/Chat About SOL/i);
    expect(chatButton).toBeInTheDocument();
    
    // Verify the link points to AI chat with token context
    const chatLink = chatButton.closest('a');
    expect(chatLink).toHaveAttribute('href', `/ai-chat?token=SOL&mint=So11111111111111111111111111111111111111112`);
  });

  test('SolanaTools can retrieve token information', async () => {
    // Initialize SolanaTools
    const solanaTools = new SolanaTools();
    
    // Set up mock implementation for token info
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([mockToken]),
        status: 200,
      })
    );
    
    // Get token info
    const tokenInfo = await solanaTools.getTokenInfo({ mintAddress: mockToken.mint });
    
    // Verify token info matches our mock
    expect(tokenInfo).toBeDefined();
    expect(tokenInfo.symbol).toBe('SOL');
    expect(tokenInfo.mint).toBe('So11111111111111111111111111111111111111112');
    expect(tokenInfo.price).toBe(169.42);
  });
});