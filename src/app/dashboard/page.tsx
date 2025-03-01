'use client';

// Force dynamic rendering - never statically generate this page
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import React, { useState, useEffect } from 'react';
import { CoinGeckoToken, JupiterToken, TokenInfo } from '@/lib/types/tokens';
import { UserButton } from '@clerk/nextjs';
import { useUserContext } from '@/lib/context/user-context';
import { ConnectWalletButton } from '@/components/wallet/connect-wallet-button';
import { WalletContextProvider } from '@/lib/context/wallet-context';
import { WalletDashboard } from '@/components/wallet/wallet-dashboard';
import { WalletTransactionsV2 } from '@/components/wallet/wallet-transactions-v2';
import Link from 'next/link';
import { Home, Settings, BarChart2, Brain, Zap, Bot, Plus, X, Layout, Eye, EyeOff, Move, Grid3X3, Search, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TokenInfo as TokenInfoComponent } from '@/components/ui/token-info';
import { TokenSearch } from '@/components/ui/token-search';
import { solanaServiceV2 } from '@/lib/solana/v2';
// Using TokenInfo from /lib/types/tokens instead of the one from solana/types

// Define card types for the dashboard
interface DashboardCard {
  id: string;
  title: string;
  type: 'wallet' | 'transactions' | 'token' | 'market' | 'ai' | 'signals' | 'token-search' | 'token-details';
  size: 'small' | 'medium' | 'large';
  visible: boolean;
  content?: React.ReactNode;
  tokenMint?: string;
}

function DashboardPage() {
  const { isLoaded, isSignedIn, user } = useUserContext();
  
  // Safely handle case when context is not yet available
  if (!isLoaded) {
    return (<div className="min-h-screen bg-sapphire-900 flex items-center justify-center">    <div className="w-12 h-12 border-t-2 border-emerald-500 rounded-full animate-spin mb-4"></div>    <p className="text-emerald-400 ml-3">Loading user data...</p>
      </div>
    );
  }
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'default' | 'compact' | 'wide'>('default');
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);
  
  // Add state for selected token
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  
  // Load saved dashboard settings from localStorage on component mount
  useEffect(() => {
    // Only run in browser, not during SSR
    if (typeof window !== 'undefined') {
      try {
        // Load layout preference
        const savedLayout = localStorage.getItem('dashboardLayout');
        if (savedLayout && (savedLayout === 'default' || savedLayout === 'compact' || savedLayout === 'wide')) {
          setLayoutMode(savedLayout as 'default' | 'compact' | 'wide');
        }
        
        // Load saved card configuration
        const savedCards = localStorage.getItem('dashboardCards');
        if (savedCards) {
          const parsedCards = JSON.parse(savedCards) as DashboardCard[];
          setDashboardCards(parsedCards);
        }
      } catch (error) {
        console.error('Error loading dashboard settings from localStorage:', error);
      }
    }
  }, []);
  
  // Default dashboard card layout
  const defaultDashboardCards: DashboardCard[] = [
    { 
      id: 'wallet', 
      title: 'Connected Wallet', 
      type: 'wallet', 
      size: 'medium', 
      visible: true 
    },
    { 
      id: 'transactions', 
      title: 'Recent Transactions', 
      type: 'transactions', 
      size: 'medium', 
      visible: true 
    },
    { 
      id: 'token-search', 
      title: 'Token Search', 
      type: 'token-search', 
      size: 'medium', 
      visible: true
    },
    { 
      id: 'token-details', 
      title: 'Token Details', 
      type: 'token-details', 
      size: 'medium', 
      visible: true
    },
    { 
      id: 'sol-token', 
      title: 'Solana Token', 
      type: 'token', 
      size: 'medium', 
      visible: true,
      tokenMint: 'So11111111111111111111111111111111111111112' // Native SOL mint address
    },
    { 
      id: 'market-overview', 
      title: 'Market Overview', 
      type: 'market', 
      size: 'large', 
      visible: true 
    },
    { 
      id: 'ai-assistant', 
      title: 'AI Assistant', 
      type: 'ai', 
      size: 'medium', 
      visible: false 
    },
    { 
      id: 'signals', 
      title: 'Market Signals', 
      type: 'signals', 
      size: 'medium', 
      visible: false 
    },
  ];
  
  // Initialize state from localStorage when available, fall back to defaults
  const [dashboardCards, setDashboardCards] = useState<DashboardCard[]>(defaultDashboardCards);

  // State for tracking loading/error states
  const [dashboardState, setDashboardState] = useState<{
    isLoading: boolean;
    error: string | null;
    retryCount: number;
  }>({
    isLoading: true,
    error: null,
    retryCount: 0
  });

  // Load token data when the component mounts
  useEffect(() => {
    const loadTokens = async () => {
      try {
        setIsLoadingTokens(true);
        setDashboardState(prev => ({ ...prev, isLoading: true, error: null }));
        
        // Fetch real token data from CoinGecko API
        try {
          const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=solana-ecosystem&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h');
          
          if (!response.ok) {
            throw new Error(`CoinGecko API response not ok: ${response.status}`);
          }
          
          const data = await response.json();
          
          // Transform data to match our TokenInfo interface
          const tokenData = data.map((token: CoinGeckoToken): TokenInfo => ({
            symbol: token.symbol.toUpperCase(),
            name: token.name,
            mint: token.id, // Using id as mint address for now
            decimals: 9, // Default for Solana tokens
            price: token.current_price,
            change24h: token.price_change_percentage_24h,
            volume24h: token.total_volume ?? 0,
            marketCap: token.market_cap ?? 0,
            supply: token.circulating_supply ?? 0,
            totalSupply: token.total_supply ?? 0,
            logoURI: token.image
          }));
          
          setTokens(tokenData);
          setDashboardState(prev => ({ ...prev, isLoading: false, error: null }));
        } catch (error) {
          console.error('Error fetching token data from CoinGecko:', error);
          
          // Try fallback to Jupiter API for token metadata
          try {
            const jupiterResponse = await fetch('https://token.jup.ag/strict');
            
            if (!jupiterResponse.ok) {
              throw new Error(`Jupiter API response not ok: ${jupiterResponse.status}`);
            }
            
            const jupiterData = await jupiterResponse.json();
            
            // Get top tokens by market cap (based on tags)
            const topTokens = jupiterData
              .filter((token: JupiterToken) => token.tags && (token.tags.includes('popular') || token.tags.includes('top-tokens')))
              .slice(0, 10)
              .map((token: JupiterToken): TokenInfo => ({
                symbol: token.symbol,
                name: token.name,
                mint: token.address || '',
                decimals: token.decimals || 9,
                price: 0, // Prices not available from Jupiter
                change24h: 0,
                volume24h: 0,
                marketCap: 0,
                supply: token.circulating_supply ?? 0,
                totalSupply: token.total_supply ?? 0,
                logoURI: token.logoURI || ''
              }));
              
            setTokens(topTokens);
            setDashboardState(prev => ({ ...prev, isLoading: false, error: null }));
          } catch (jupiterError) {
            console.error('Error fetching token data from Jupiter:', jupiterError);
            throw new Error('Failed to fetch token data from multiple sources');
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Failed to load token data';
        
        console.error('Dashboard token loading error:', error);
        setDashboardState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: errorMessage 
        }));
      } finally {
        setIsLoadingTokens(false);
      }
    };

    loadTokens();
  }, []);

  // Calculate main content width based on layout mode
  const getMainContentClass = () => {
    switch (layoutMode) {
      case 'compact':
        return 'max-w-5xl';
      case 'wide':
        return 'max-w-7xl';
      default:
        return 'max-w-6xl';
    }
  };

  // Toggle card visibility
  const toggleCardVisibility = (id: string) => {
    setDashboardCards(prev =>
      prev.map(card => (card.id === id ? { ...card, visible: !card.visible } : card))
    );
  };

  // Render card content based on type
  const renderCardContent = (card: DashboardCard) => {
    switch (card.type) {
      case 'wallet':
        return <WalletDashboard />;
      case 'transactions':
        return <WalletTransactionsV2 maxItems={5} />;
      case 'token-search':
        return (<div className="p-2">    <p className="text-sm text-emerald-400/70 mb-3">
              Search for any token on Solana
            </p>    <TokenSearch onSelectToken={(token) => {
              // Transform the token to match the expected TokenInfo interface
              const tokenInfo = {
                name: token.name,
                symbol: token.symbol,
                mint: token.id, // Use id as mint
                logoURI: token.image,
                price: token.current_price,
                change24h: token.price_change_percentage_24h,
                marketCap: token.market_cap || 0,
                volume24h: token.total_volume || 0,
                supply: token.circulating_supply || 0,
                totalSupply: token.total_supply || token.circulating_supply || 0,
                decimals: 9
              };
              setSelectedToken(tokenInfo);
            }} />
          </div>
        );
      case 'token-details':
        return (<div className="p-2">
            {selectedToken ? (    <div>    <div className="flex items-center mb-4">    <div className="h-8 w-8 rounded-full bg-sapphire-800 mr-3 overflow-hidden flex items-center justify-center">
                    {selectedToken.logoURI ? (    <img 
                        src={selectedToken.logoURI} 
                        alt={selectedToken.symbol} 
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          e.currentTarget.parentElement!.innerText = selectedToken.symbol.charAt(0);
                        }}
                      />
                    ) : (    <span className="font-semibold text-emerald-400">{selectedToken.symbol.charAt(0)}</span>
                    )}
                  </div>    <div>    <h3 className="font-cyber">{selectedToken.name}</h3>    <div className="text-xs text-emerald-400/70">{selectedToken.symbol}</div>
                  </div>
                </div>    <div className="mb-4">    <div className="flex justify-between items-end">    <div className="text-2xl font-mono font-semibold text-emerald-400">
                      ${selectedToken.price.toFixed(selectedToken.price < 0.01 ? 6 : 2)}
                    </div>    <div className={`${selectedToken.change24h >= 0 ? 'text-green-400' : 'text-red-400'} text-sm`}>
                      {selectedToken.change24h >= 0 ? '+' : ''}{selectedToken.change24h.toFixed(2)}%
                    </div>
                  </div>
                </div>    <div className="grid grid-cols-2 gap-4 text-sm mb-4">    <div>    <div className="text-emerald-400/50 mb-1">Market Cap</div>    <div className="font-mono">
                      ${formatLargeNumber(selectedToken.marketCap)}
                    </div>
                  </div>    <div>    <div className="text-emerald-400/50 mb-1">Volume (24h)</div>    <div className="font-mono">
                      ${formatLargeNumber(selectedToken.volume24h)}
                    </div>
                  </div>    <div>    <div className="text-emerald-400/50 mb-1">Supply</div>    <div className="font-mono">
                      {formatLargeNumber(selectedToken.supply)}
                    </div>
                  </div>    <div>    <div className="text-emerald-400/50 mb-1">Decimals</div>    <div className="font-mono">{selectedToken.decimals}</div>
                  </div>
                </div>    <div className="flex flex-col space-y-2">    <a 
                    href={`https://solscan.io/token/${selectedToken.mint}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline w-full block py-2 px-4 text-center rounded-md border border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10 transition-colors"
                  >
                    View on Explorer
                  </a>    <Link 
                    href={`/ai-chat?token=${encodeURIComponent(selectedToken.symbol)}&mint=${encodeURIComponent(selectedToken.mint)}`}
                    className="w-full flex items-center justify-center py-2 px-4 text-center rounded-md bg-emerald-400 text-sapphire-900 font-medium hover:bg-emerald-500 transition-colors"
                  >    <MessageSquare size={16} className="mr-2" />
                    Chat About {selectedToken.symbol}
                  </Link>
                </div>
              </div>
            ) : (    <div className="flex flex-col items-center justify-center py-8 text-center">    <p className="text-emerald-400/70 mb-2">Search and select a token to view details</p>    <div className="w-16 h-16 rounded-full border-2 border-dashed border-emerald-400/30 flex items-center justify-center text-emerald-400/40">    <MessageSquare size={24} />
                </div>
              </div>
            )}
          </div>
        );
      case 'token':
        if (card.tokenMint) {
          const token = tokens.find(t => t.mint === card.tokenMint);
          // Map the Solana TokenInfo to the shape expected by the TokenInfo component
          return token ? (    <TokenInfoComponent token={{
              name: token.name,
              symbol: token.symbol,
              logoUrl: token.logoURI || `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${token.mint}/logo.png`,
              price: token.price,
              priceChange24h: token.change24h,
              marketCap: token.marketCap,
              volume24h: token.volume24h,
              circulatingSupply: token.supply,
              totalSupply: token.supply,
              explorer: `https://solscan.io/token/${token.mint}`
            }} />
          ) : (    <TokenInfoComponent isLoading={isLoadingTokens} token={{
              name: "",
              symbol: "",
              logoUrl: "",
              price: 0,
              priceChange24h: 0,
              marketCap: 0,
              volume24h: 0,
              circulatingSupply: 0,
              totalSupply: 0
            }} />
          );
        }
        return null;
      case 'market':
        return (<div className="space-y-4 p-4">    <p className="text-muted-foreground">
              Market data visualization with real-time updates
            </p>    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tokens.slice(0, 3).map(token => (    <div key={token.mint} className="glass-card rounded-lg p-4">    <div className="text-muted-foreground text-sm mb-1">{token.symbol} Price</div>    <div className="text-emerald-400 text-xl font-mono font-bold">
                    {token.price ? `$${token.price.toFixed(2)}` : "Loading..."}
                  </div>
                  {token.change24h !== undefined && (    <div className={token.change24h >= 0 ? "text-green-400 text-xs" : "text-red-400 text-xs"}>
                      {token.change24h >= 0 ? "+" : ""}{token.change24h.toFixed(2)}%
                    </div>
                  )}
                </div>
              ))}
              
              {/* If we don't have enough tokens yet, show loading placeholders */}
              {tokens.length < 3 && Array.from({length: 3 - tokens.length}).map((_, idx) => (    <div key={`placeholder-${idx}`} className="glass-card rounded-lg p-4">    <div className="text-muted-foreground text-sm mb-1">Loading...</div>    <div className="animate-pulse bg-emerald-400/20 h-7 w-24 rounded mt-1"></div>    <div className="animate-pulse bg-emerald-400/10 h-4 w-16 rounded mt-2"></div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'ai':
        return (<div className="space-y-4 p-4">    <p className="text-muted-foreground">
              Ask questions about wallet, transactions, or market data
            </p>    <div className="flex flex-col">    <div className="glass-card rounded-lg p-4 border border-emerald-500/30 mb-2">    <p className="font-cyber text-sm text-emerald-400 mb-1">BlockSwarms AI</p>    <p>Welcome to BlockSwarms. How can I assist you with your Solana wallet today?</p>
              </div>    <div className="glass-card rounded-lg p-4 mb-2">    <div className="text-muted-foreground text-sm mb-1">You</div>    <p>What tokens are currently showing the most trading volume?</p>
              </div>    <div className="glass-card rounded-lg p-4 border border-emerald-500/30 mb-4">    <p className="font-cyber text-sm text-emerald-400 mb-1">BlockSwarms AI</p>    <p>Based on current data, the tokens with the highest 24h trading volume are SOL, JUP, and BONK. Would you like to see detailed information for any of these tokens?</p>
              </div>    <Link href="/ai-chat" className="w-full">    <Button variant="primary" className="w-full flex items-center justify-center">    <Brain size={16} className="mr-2" />
                  Open AI Chat
                </Button>
              </Link>
            </div>
          </div>
        );
      case 'signals':
        return (<div className="space-y-4 p-4">    <p className="text-muted-foreground">
              Market signals and trading opportunities
            </p>
            
            {/* Use actual token data to generate signals based on price movement */}    <div className="flex flex-col space-y-2">
              {tokens.slice(0, 3).map(token => {
                // Generate signal based on price change
                let signal = 'HOLD';
                let borderClass = 'border-yellow-500';
                let signalClass = 'text-yellow-400';
                let signalText = 'Sideways movement, monitoring volume';
                
                if (token.change24h > 5) {
                  signal = 'BUY';
                  borderClass = 'border-emerald-500';
                  signalClass = 'text-emerald-400';
                  signalText = `Strong momentum, up ${token.change24h.toFixed(1)}% in 24h`;
                } else if (token.change24h < -5) {
                  signal = 'SELL';
                  borderClass = 'border-red-500';
                  signalClass = 'text-red-400';
                  signalText = `Downward trend, ${token.change24h.toFixed(1)}% in 24h`;
                }
                
                return (<div key={token.mint} className={`glass-card rounded-lg p-3 border-l-4 ${borderClass}`}>    <div className="flex justify-between">    <span className="font-semibold">{token.symbol}/USD</span>    <span className={signalClass}>{signal}</span>
                    </div>    <p className="text-sm text-muted-foreground">{signalText}</p>
                  </div>
                );
              })}
              
              {/* If we don't have enough tokens yet, show loading placeholders */}
              {tokens.length < 3 && Array.from({length: 3 - tokens.length}).map((_, idx) => (    <div key={`signal-placeholder-${idx}`} className="glass-card rounded-lg p-3 border-l-4 border-gray-500 animate-pulse">    <div className="flex justify-between">    <span className="font-semibold bg-emerald-400/20 h-5 w-20 rounded"></span>    <span className="bg-emerald-400/20 h-5 w-12 rounded"></span>
                  </div>    <div className="bg-emerald-400/10 h-4 w-48 mt-2 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Get card size class
  const getCardSizeClass = (size: DashboardCard['size']) => {
    switch (size) {
      case 'small':
        return 'col-span-12 md:col-span-4';
      case 'medium':
        return 'col-span-12 md:col-span-6';
      case 'large':
        return 'col-span-12';
      default:
        return 'col-span-12 md:col-span-6';
    }
  };

  // Function to handle retry when data loading fails
  const handleRetryLoading = () => {
    setDashboardState({
      isLoading: true,
      error: null,
      retryCount: dashboardState.retryCount + 1
    });
  };

  // Helper function to format large numbers
  function formatLargeNumber(value: number): string {
    if (!value && value !== 0) return 'N/A';
    
    if (value >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(2)}B`;
    } else if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(2)}M`;
    } else if (value >= 1_000) {
      return `${(value / 1_000).toFixed(2)}K`;
    } else {
      return value.toFixed(2);
    }
  }

  return (<WalletContextProvider>    <div className="min-h-screen bg-sapphire-900 text-white">
        {/* Header */}    <header className="bg-sapphire-900/80 backdrop-blur-sm border-b border-emerald-400/20 p-4 fixed top-0 left-0 right-0 z-10">    <div className="container mx-auto flex justify-between items-center">    <Link href="/" className="font-cyber text-2xl text-emerald-400">BlockSwarms</Link>    <div className="flex items-center space-x-4">    <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomizeModal(true)}
                className="text-emerald-400 border-emerald-400/30"
              >    <Layout size={16} className="mr-2" />
                Customize
              </Button>    <ConnectWalletButton />    <UserButton />
            </div>
          </div>
        </header>

        {/* Sidebar */}    <div className="fixed left-0 top-0 h-full w-16 bg-sapphire-900/80 backdrop-blur-sm border-r border-emerald-400/20 pt-20 hidden md:flex flex-col items-center">    <Link href="/dashboard" className="w-10 h-10 mb-4 rounded-md bg-emerald-400/10 flex items-center justify-center text-emerald-400">    <Home size={20} />
          </Link>    <Link href="#wallet" className="w-10 h-10 mb-4 rounded-md hover:bg-emerald-400/10 flex items-center justify-center text-emerald-400/50 hover:text-emerald-400">    <BarChart2 size={20} />
          </Link>    <Link 
            href="/ai-chat" 
            className="w-10 h-10 mb-4 rounded-md hover:bg-emerald-400/10 flex items-center justify-center text-emerald-400/50 hover:text-emerald-400"
            title="AI Chat"
          >    <Brain size={20} />
          </Link>    <Link href="#signals" className="w-10 h-10 mb-4 rounded-md hover:bg-emerald-400/10 flex items-center justify-center text-emerald-400/50 hover:text-emerald-400">    <Zap size={20} />
          </Link>
        </div>

        {/* Main content */}    <main className="pt-20 md:pl-16 p-4">    <div className={`mx-auto ${getMainContentClass()}`}>
            {/* Page header */}    <div className="mb-8 flex justify-between items-center">    <h1 className="text-2xl font-cyber text-emerald-400">Dashboard</h1>    <div className="flex space-x-2">    <Button
                  variant="outline"
                  size="sm"
                  className={layoutMode === 'compact' ? 'bg-emerald-400/10 text-emerald-400' : 'text-emerald-400/60'}
                  onClick={() => setLayoutMode('compact')}
                >
                  Compact
                </Button>    <Button
                  variant="outline"
                  size="sm"
                  className={layoutMode === 'default' ? 'bg-emerald-400/10 text-emerald-400' : 'text-emerald-400/60'}
                  onClick={() => setLayoutMode('default')}
                >
                  Default
                </Button>    <Button
                  variant="outline"
                  size="sm"
                  className={layoutMode === 'wide' ? 'bg-emerald-400/10 text-emerald-400' : 'text-emerald-400/60'}
                  onClick={() => setLayoutMode('wide')}
                >
                  Wide
                </Button>
              </div>
            </div>

            {/* Loading state */}
            {dashboardState.isLoading && (    <div className="flex justify-center items-center min-h-[400px]">    <div className="flex flex-col items-center">    <div className="w-12 h-12 border-t-2 border-emerald-500 rounded-full animate-spin mb-4"></div>    <p className="text-emerald-400">Loading Dashboard Data...</p>
                </div>
              </div>
            )}

            {/* Error state */}
            {!dashboardState.isLoading && dashboardState.error && (    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">    <h2 className="text-xl font-cyber text-red-400 mb-2">Error Loading Data</h2>    <p className="mb-4 text-red-300">{dashboardState.error}</p>    <div className="flex flex-col items-center gap-3">    <Button 
                    variant="primary"
                    onClick={handleRetryLoading}
                    className="w-full md:w-auto"
                  >
                    Retry Loading
                  </Button>    <p className="text-sm text-red-300/70">
                    Note: If token data fails to load after multiple attempts, the API may have rate limits.
                    The dashboard will fall back to mock data if real data can't be loaded.
                  </p>
                </div>
              </div>
            )}

            {/* Dashboard grid */}
            {!dashboardState.isLoading && !dashboardState.error && (    <div className="grid grid-cols-12 gap-6">
                {dashboardCards
                  .filter(card => card.visible)
                  .map(card => (    <div 
                      key={card.id}
                      className={getCardSizeClass(card.size)}
                    >    <div className="bg-sapphire-800/70 backdrop-blur-sm border border-emerald-400/20 rounded-lg h-full">    <div className="p-4 border-b border-emerald-400/20 flex justify-between">    <h2 className="font-cyber text-emerald-400">{card.title}</h2>    <button 
                            onClick={() => toggleCardVisibility(card.id)}
                            className="text-emerald-400/60 hover:text-emerald-400"
                          >    <EyeOff size={16} />
                          </button>
                        </div>    <div className="h-[calc(100%-56px)] overflow-auto">
                          {renderCardContent(card)}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </main>

        {/* Customize Modal */}
        {showCustomizeModal && (    <div className="fixed inset-0 bg-sapphire-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">    <div className="bg-sapphire-800 border border-emerald-400/30 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto">    <div className="p-4 border-b border-emerald-400/20 flex justify-between">    <h2 className="font-cyber text-emerald-400 flex items-center">    <Layout size={18} className="mr-2" />
                  Customize Dashboard
                </h2>    <button 
                  onClick={() => setShowCustomizeModal(false)}
                  className="text-emerald-400/60 hover:text-emerald-400"
                >    <X size={20} />
                </button>
              </div>    <div className="p-6">    <div className="mb-6">    <h3 className="text-lg font-cyber text-emerald-400 mb-2">Dashboard Layout</h3>    <p className="text-emerald-400/70 text-sm mb-3">
                    Choose your preferred layout density:
                  </p>    <div className="flex space-x-2">    <Button
                      size="sm"
                      variant={layoutMode === 'compact' ? 'primary' : 'outline'}
                      onClick={() => setLayoutMode('compact')}
                      className="text-sm"
                    >
                      Compact
                    </Button>    <Button
                      size="sm"
                      variant={layoutMode === 'default' ? 'primary' : 'outline'}
                      onClick={() => setLayoutMode('default')}
                      className="text-sm"
                    >
                      Default
                    </Button>    <Button
                      size="sm"
                      variant={layoutMode === 'wide' ? 'primary' : 'outline'}
                      onClick={() => setLayoutMode('wide')}
                      className="text-sm"
                    >
                      Wide
                    </Button>
                  </div>
                </div>    <h3 className="text-lg font-cyber text-emerald-400 mb-3">Visible Cards</h3>    <div className="space-y-2 mb-6">
                  {dashboardCards.map(card => (    <div 
                      key={card.id}
                      className={`p-3 rounded-md border ${card.visible ? 'border-emerald-400/30 bg-emerald-400/5' : 'border-emerald-400/10'} flex justify-between items-center`}
                    >    <div className="flex items-center">    <div className={`w-8 h-8 rounded-full ${card.visible ? 'bg-emerald-400/20' : 'bg-sapphire-700/50'} flex items-center justify-center mr-3`}>
                          {(() => {
                            switch(card.type) {
                              case 'wallet': return <Home size={16} className="text-emerald-400" />;
                              case 'transactions': return <BarChart2 size={16} className="text-emerald-400" />;
                              case 'token-search': return <Search size={16} className="text-emerald-400" />;
                              case 'token-details': return <MessageSquare size={16} className="text-emerald-400" />;
                              case 'token': return <Bot size={16} className="text-emerald-400" />;
                              case 'market': return <BarChart2 size={16} className="text-emerald-400" />;
                              case 'ai': return <Brain size={16} className="text-emerald-400" />;
                              case 'signals': return <Zap size={16} className="text-emerald-400" />;
                              default: return <Bot size={16} className="text-emerald-400" />;
                            }
                          })()}
                        </div>    <div>    <div className="font-semibold text-emerald-400">{card.title}</div>    <div className="text-xs text-emerald-400/50">Size: {card.size}</div>
                        </div>
                      </div>    <div className="flex gap-2">    <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDashboardCards(prev => 
                              prev.map(c => 
                                c.id === card.id 
                                  ? { ...c, size: c.size === 'small' ? 'medium' : c.size === 'medium' ? 'large' : 'small' } 
                                  : c
                              )
                            );
                          }}
                          className="text-xs"
                        >
                          Size
                        </Button>    <Button
                          variant={card.visible ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => toggleCardVisibility(card.id)}
                          className="text-xs"
                        >
                          {card.visible ? 'Hide' : 'Show'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>    <h3 className="text-lg font-cyber text-emerald-400 mb-3">Add New Card</h3>    <div className="grid grid-cols-2 gap-2">    <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => {
                      const newCard: DashboardCard = {
                        id: `token-search-${Date.now()}`,
                        title: 'Token Search',
                        type: 'token-search',
                        size: 'medium',
                        visible: true
                      };
                      setDashboardCards(prev => [...prev, newCard]);
                    }}
                  >    <Search size={16} className="mr-2" />
                    Token Search
                  </Button>    <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => {
                      const newCard: DashboardCard = {
                        id: `token-details-${Date.now()}`,
                        title: 'Token Details',
                        type: 'token-details',
                        size: 'medium',
                        visible: true
                      };
                      setDashboardCards(prev => [...prev, newCard]);
                    }}
                  >    <MessageSquare size={16} className="mr-2" />
                    Token Details
                  </Button>    <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => {
                      const newCard: DashboardCard = {
                        id: `ai-chat-${Date.now()}`,
                        title: 'AI Assistant',
                        type: 'ai',
                        size: 'medium',
                        visible: true
                      };
                      setDashboardCards(prev => [...prev, newCard]);
                    }}
                  >    <Brain size={16} className="mr-2" />
                    AI Assistant
                  </Button>    <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => {
                      const newCard: DashboardCard = {
                        id: `market-signals-${Date.now()}`,
                        title: 'Market Signals',
                        type: 'signals',
                        size: 'medium',
                        visible: true
                      };
                      setDashboardCards(prev => [...prev, newCard]);
                    }}
                  >    <Zap size={16} className="mr-2" />
                    Market Signals
                  </Button>
                </div>    <div className="mt-8 flex justify-between border-t border-emerald-400/20 pt-6">    <Button 
                    variant="outline"
                    onClick={() => {
                      // Reset to default dashboard layout
                      setDashboardCards([
                        { id: 'wallet', title: 'Connected Wallet', type: 'wallet', size: 'medium', visible: true },
                        { id: 'transactions', title: 'Recent Transactions', type: 'transactions', size: 'medium', visible: true },
                        { id: 'token-search', title: 'Token Search', type: 'token-search', size: 'medium', visible: true },
                        { id: 'token-details', title: 'Token Details', type: 'token-details', size: 'medium', visible: true },
                        { id: 'sol-token', title: 'Solana Token', type: 'token', size: 'medium', visible: true, tokenMint: 'So11111111111111111111111111111111111111112' },
                        { id: 'market-overview', title: 'Market Overview', type: 'market', size: 'large', visible: true },
                      ]);
                    }}
                  >    <span className="mr-2">Reset Layout</span>
                  </Button>    <div className="flex space-x-3">    <Button 
                      variant="outline"
                      onClick={() => setShowCustomizeModal(false)}
                    >    <X size={16} className="mr-2" />    <span>Cancel</span>
                    </Button>    <Button 
                      variant="primary"
                      onClick={() => {
                        // Here we would save to localStorage in a real app
                        // For now, just close the modal
                        localStorage.setItem('dashboardCards', JSON.stringify(dashboardCards));
                        localStorage.setItem('dashboardLayout', layoutMode);
                        setShowCustomizeModal(false);
                      }}
                    >    <span>Save Changes</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </WalletContextProvider>
  );
}

// Export as default with dynamic import to skip SSR
import dynamic from 'next/dynamic';
export default dynamic(() => Promise.resolve(DashboardPage), { ssr: false });