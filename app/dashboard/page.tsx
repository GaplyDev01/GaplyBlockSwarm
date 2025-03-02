'use client';

// Force dynamic rendering - never statically generate this page
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import React, { useState, useEffect } from 'react';
import { TokenInfo } from '@/lib/types/tokens';
import { UserButton } from '@clerk/nextjs';
import { useUserContext } from '@/lib/context/user-context';
import { ConnectWalletButton } from '@/components/wallet/connect-wallet-button';
import { WalletContextProvider } from '@/lib/context/wallet-context';
import { WalletDashboard } from '@/components/wallet/wallet-dashboard';
import { WalletTransactionsV2 } from '@/components/wallet/wallet-transactions-v2';
import Link from 'next/link';
import { Home, Settings, Brain, Zap, Layout, Eye, EyeOff, X, Plus, Search, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TokenInfo as TokenInfoComponent } from '@/components/ui/token-info';
import { TokenSearch } from '@/components/ui/token-search';
import { DashboardGrid } from '@/components/ui/dashboard-grid';

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
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  const [layoutMode, setLayoutMode] = useState<'default' | 'compact' | 'wide'>('default');
  
  // Default dashboard cards
  const defaultDashboardCards: DashboardCard[] = [
    {
      id: 'wallet',
      title: 'Wallet Overview',
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
      id: 'search',
      title: 'Token Search',
      type: 'token-search',
      size: 'medium',
      visible: true
    },
    {
      id: 'ai-chat',
      title: 'AI Assistant',
      type: 'ai',
      size: 'medium',
      visible: true
    }
  ];
  
  const [dashboardCards, setDashboardCards] = useState<DashboardCard[]>(defaultDashboardCards);
  
  // Safely handle case when context is not yet available
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-sapphire-900 flex items-center justify-center">
        <div className="w-12 h-12 border-t-2 border-emerald-500 rounded-full animate-spin mb-4"></div>
        <p className="text-emerald-400 ml-3">Loading user data...</p>
      </div>
    );
  }
  
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
  
  // Save dashboard settings to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('dashboardLayout', layoutMode);
        localStorage.setItem('dashboardCards', JSON.stringify(dashboardCards));
      } catch (error) {
        console.error('Error saving dashboard settings to localStorage:', error);
      }
    }
  }, [layoutMode, dashboardCards]);
  
  // Handle showing/hiding dashboard cards
  const toggleCardVisibility = (id: string) => {
    setDashboardCards(cards => 
      cards.map(card => 
        card.id === id ? { ...card, visible: !card.visible } : card
      )
    );
  };
  
  // Handle reordering dashboard cards
  const handleCardsReorder = (newCards: DashboardCard[]) => {
    setDashboardCards(newCards);
  };
  
  // Get CSS class for card size
  const getCardSizeClass = (size: 'small' | 'medium' | 'large') => {
    switch (size) {
      case 'small':
        return 'col-span-12 md:col-span-6 lg:col-span-4 xl:col-span-3';
      case 'medium':
        return 'col-span-12 md:col-span-6';
      case 'large':
        return 'col-span-12';
      default:
        return 'col-span-12 md:col-span-6';
    }
  };
  
  // Handle token selection
  const handleTokenSelect = (token: TokenInfo) => {
    setSelectedToken(token);
    
    // Add a new card for the selected token if it doesn't exist
    const tokenCardExists = dashboardCards.some(
      card => card.type === 'token-details' && card.tokenMint === token.mint
    );
    
    if (!tokenCardExists) {
      const newTokenCard: DashboardCard = {
        id: `token-${token.mint}`,
        title: `${token.name} (${token.symbol})`,
        type: 'token-details',
        size: 'medium',
        visible: true,
        tokenMint: token.mint
      };
      
      setDashboardCards(cards => [...cards, newTokenCard]);
    }
  };
  
  // Render content for each card type
  const renderCardContent = (card: DashboardCard) => {
    switch (card.type) {
      case 'wallet':
        return (
          <WalletContextProvider>
            <WalletDashboard />
          </WalletContextProvider>
        );
      case 'transactions':
        return (
          <WalletContextProvider>
            <WalletTransactionsV2 />
          </WalletContextProvider>
        );
      case 'token-search':
        return <TokenSearch onSelect={handleTokenSelect} />;
      case 'token-details':
        if (card.tokenMint && selectedToken && card.tokenMint === selectedToken.mint) {
          return <TokenInfoComponent token={selectedToken} />;
        }
        return <div className="text-center p-4 text-emerald-400/50">Select a token to view details</div>;
      case 'ai':
        return (
          <div className="p-4">
            <p className="text-emerald-400/70 mb-4">Ask AI about Solana tokens, trading strategies, or market analysis</p>
            <Link href="/ai-chat">
              <Button className="w-full">
                <MessageSquare className="w-4 h-4 mr-2" />
                Open AI Chat
              </Button>
            </Link>
          </div>
        );
      default:
        return <div>Content not available</div>;
    }
  };
  
  // Reset dashboard to defaults
  const resetDashboard = () => {
    setDashboardCards(defaultDashboardCards);
    setLayoutMode('default');
    setShowCustomizeModal(false);
  };
  
  // Add a new card to the dashboard
  const addCard = (type: DashboardCard['type'], title: string) => {
    const newCard: DashboardCard = {
      id: `${type}-${Date.now()}`,
      title,
      type,
      size: 'medium',
      visible: true
    };
    
    setDashboardCards(cards => [...cards, newCard]);
  };
  
  return (
    <div className="min-h-screen bg-sapphire-900 text-white">
      {/* Header */}
      <header className="bg-sapphire-900/80 backdrop-blur-sm border-b border-emerald-400/20 p-4 fixed top-0 left-0 right-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="font-cyber text-2xl text-emerald-400">BlockSwarms</Link>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustomizeModal(true)}
              className="text-emerald-400 border-emerald-400/30"
            >
              <Layout size={16} className="mr-2" />
              Customize
            </Button>
            <ConnectWalletButton />
            <UserButton />
          </div>
        </div>
      </header>
      
      {/* Dashboard Content */}
      <main className="container mx-auto px-4 pt-24 pb-10">
        <DashboardGrid
          cards={dashboardCards}
          onCardsReorder={handleCardsReorder}
          onToggleVisibility={toggleCardVisibility}
          renderCardContent={renderCardContent}
          getCardSizeClass={getCardSizeClass}
          className="mb-8"
        />
      </main>
      
      {/* Customize Modal */}
      {showCustomizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-sapphire-900/80 backdrop-blur-sm">
          <div className="bg-sapphire-800 border border-emerald-400/30 rounded-lg shadow-xl max-w-4xl w-full mx-4 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-cyber text-emerald-400">Customize Dashboard</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCustomizeModal(false)}
                className="text-emerald-400/70 hover:text-emerald-400"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-emerald-400 mb-4">Layout Settings</h3>
                <div className="space-y-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={layoutMode === 'default'}
                      onChange={() => setLayoutMode('default')}
                      className="text-emerald-400"
                    />
                    <span>Default Layout</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={layoutMode === 'compact'}
                      onChange={() => setLayoutMode('compact')}
                      className="text-emerald-400"
                    />
                    <span>Compact Layout</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={layoutMode === 'wide'}
                      onChange={() => setLayoutMode('wide')}
                      className="text-emerald-400"
                    />
                    <span>Wide Layout</span>
                  </label>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-emerald-400 mb-4">Dashboard Widgets</h3>
                <div className="space-y-2">
                  <div className="flex justify-between mb-2">
                    <span>Available Widgets</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetDashboard}
                      className="text-xs text-emerald-400/70 hover:text-emerald-400"
                    >
                      Reset to Default
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addCard('wallet', 'Wallet Overview')}
                      className="justify-start"
                    >
                      <Plus className="h-3 w-3 mr-2" />
                      Wallet
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addCard('transactions', 'Recent Transactions')}
                      className="justify-start"
                    >
                      <Plus className="h-3 w-3 mr-2" />
                      Transactions
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addCard('token-search', 'Token Search')}
                      className="justify-start"
                    >
                      <Plus className="h-3 w-3 mr-2" />
                      <Search className="h-3 w-3 mr-2" />
                      Token Search
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addCard('ai', 'AI Assistant')}
                      className="justify-start"
                    >
                      <Plus className="h-3 w-3 mr-2" />
                      <Brain className="h-3 w-3 mr-2" />
                      AI Assistant
                    </Button>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="font-semibold text-emerald-400 mb-2">Current Widgets</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {dashboardCards.map(card => (
                      <div
                        key={card.id}
                        className="flex items-center justify-between bg-sapphire-900 p-2 rounded-md"
                      >
                        <span className="truncate max-w-[180px]">{card.title}</span>
                        <div className="flex items-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleCardVisibility(card.id)}
                            className="h-6 w-6 text-emerald-400/70 hover:text-emerald-400"
                          >
                            {card.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-6 pt-4 border-t border-emerald-400/20">
              <Button
                variant="outline"
                onClick={() => setShowCustomizeModal(false)}
                className="mr-2"
              >
                Cancel
              </Button>
              <Button
                onClick={() => setShowCustomizeModal(false)}
                className="bg-emerald-400 text-sapphire-900 hover:bg-emerald-500"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export as default with dynamic import to skip SSR
import dynamic from 'next/dynamic';
export default dynamic(() => Promise.resolve(DashboardPage), { ssr: false });