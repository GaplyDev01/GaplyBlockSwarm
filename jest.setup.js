// Import required test setup 
require('@testing-library/jest-dom');

// Global mocks
global.fetch = jest.fn();

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
  }),
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    pathname: '/',
  }),
  useSearchParams: () => ({
    get: jest.fn((param) => {
      // For token context tests
      if (param === 'token') return 'SOL';
      if (param === 'mint') return 'So11111111111111111111111111111111111111112';
      return null;
    }),
  }),
  usePathname: () => '/',
}));

// Mock wallet authentication
jest.mock('@/lib/context/user-context', () => ({
  useUserContext: () => ({
    isSignedIn: true,
    isLoaded: true,
    userId: 'test-wallet-address',
    isDemo: false
  })
}));

// Mock environment variables
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
process.env.NEXT_PUBLIC_SOLANA_RPC_URL = 'https://api.mainnet-beta.solana.com';

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  
  // Default fetch mock implementation
  global.fetch.mockImplementation(() => 
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve([]),
      status: 200,
    })
  );
});

// Add real-world API mocks for Solana tools
global.mockSolanaApi = {
  tokenInfo: {
    'So11111111111111111111111111111111111111112': {
      name: 'Wrapped SOL',
      symbol: 'SOL',
      mint: 'So11111111111111111111111111111111111111112',
      decimals: 9,
      price: 169.42,
      change24h: 2.45,
      marketCap: 73400000000,
      volume24h: 2100000000,
      supply: 430000000,
    }
  }
};

// Mock console methods to avoid noisy test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

console.error = (...args) => {
  if (process.env.DEBUG) {
    originalConsoleError(...args);
  }
};

console.warn = (...args) => {
  if (process.env.DEBUG) {
    originalConsoleWarn(...args);
  }
};

console.log = (...args) => {
  if (process.env.DEBUG) {
    originalConsoleLog(...args);
  }
};