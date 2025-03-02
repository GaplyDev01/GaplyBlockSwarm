'use client';

import React, { useEffect, useState } from 'react';

// Force dynamic rendering - never statically generate this page
const dynamic_rendering = 'force-dynamic';
const runtime_setting = 'edge';
import { ConnectWalletButton } from '@/components/wallet/connect-wallet-button';
import { LiveWalletBalance } from '@/components/wallet/live-wallet-balance';
import { WalletDashboard } from '@/components/wallet/wallet-dashboard';
import { WalletTransactions } from '@/components/wallet/wallet-transactions';
import { WalletTransactionsV2 } from '@/components/wallet/wallet-transactions-v2';
import { WalletContextProvider } from '@/lib/context/wallet-context';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChatContainer } from '@/components/ui/chat-container';
import { TokenInfo } from '@/components/ui/token-info';
import { MessageRole } from '@/components/ui/message';
import { generateId } from '@/lib/utils';
import Link from 'next/link';
import { ArrowLeft, BarChart2, Bot, Brain } from 'lucide-react';

// Sample token data
const solanaToken = {
  name: 'Solana',
  symbol: 'SOL',
  logoUrl: 'https://cryptologos.cc/logos/solana-sol-logo.png',
  price: 142.78,
  priceChange24h: 8.45,
  marketCap: 64830000000,
  volume24h: 1500000000,
  circulatingSupply: 412500000,
  totalSupply: 535000000,
  website: 'https://solana.com',
  explorer: 'https://explorer.solana.com',
};

// Interface for chat messages
interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

// Sample suggestions for the chat
const suggestions = [
  "What is Solana's current price?",
  "How does Solana compare to Ethereum?",
  "Explain Solana's consensus mechanism",
  "What are the top Solana dApps?",
];

function SolanaV2DemoPage() {
  const [viewMode, setViewMode] = useState<'original' | 'cyberpunk'>('original');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: generateId(),
      role: 'assistant',
      content: "👋 Hello! I'm your AI assistant for Solana. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  
  useEffect(() => {
    // Force enable Solana V2 implementation
    if (typeof window !== 'undefined') {
      // @ts-ignore - Setting environment variable in browser for demo
      window.process = window.process || {};
      // @ts-ignore
      window.process.env = window.process.env || {};
      // @ts-ignore
      window.process.env.NEXT_PUBLIC_USE_SOLANA_V2 = 'true';
    }
    logger.info('Solana V2 Demo Page loaded');
  }, []);
  
  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsGenerating(true);
    
    // Simulate AI response with timeout
    setTimeout(() => {
      const aiResponse = generateAIResponse(content);
      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsGenerating(false);
    }, 1500);
  };
  
  const handleStopGeneration = () => {
    setIsGenerating(false);
  };
  
  // Simple mock AI response generator (in a real app, this would call an API)
  const generateAIResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('price')) {
      return `The current price of Solana (SOL) is $${solanaToken.price}, which represents a ${solanaToken.priceChange24h > 0 ? 'gain' : 'loss'} of ${Math.abs(solanaToken.priceChange24h)}% in the last 24 hours.`;
    }
    
    if (message.includes('compare') && message.includes('ethereum')) {
      return `Both Solana and Ethereum are smart contract platforms, but they differ in several ways:

1. **Speed & Throughput**: Solana can process up to 65,000 transactions per second with sub-second finality, while Ethereum 2.0 aims for 100,000 TPS but currently handles about 15-30 TPS.

2. **Consensus Mechanism**: Solana uses a unique Proof of History (PoH) with Proof of Stake (PoS), while Ethereum is transitioning from Proof of Work (PoW) to PoS.

3. **Fees**: Solana typically has much lower transaction fees (often less than $0.01) compared to Ethereum (which can range from a few dollars to over $100 during congestion).

4. **Developer Ecosystem**: Ethereum has a larger developer community and more established tools, while Solana's ecosystem is growing rapidly.

5. **Programming Languages**: Solana uses Rust for smart contracts, while Ethereum uses Solidity.`;
    }
    
    if (message.includes('consensus') || message.includes('proof of history')) {
      return `Solana uses a unique hybrid consensus mechanism that combines **Proof of Stake (PoS)** with **Proof of History (PoH)**.

**Proof of History (PoH)** is Solana's breakthrough innovation. It's not a consensus protocol itself but a cryptographic clock that enables the network to agree on the time and sequence of events without requiring all nodes to communicate with each other. This dramatically reduces the overhead needed to reach consensus.

**Tower BFT** is Solana's specific implementation of Practical Byzantine Fault Tolerance that leverages PoH. Validators vote on the state of the PoH, and these votes are weighted by the validators' stake.

This combination allows Solana to achieve:
- High throughput (65,000+ TPS)
- Sub-second finality
- Low transaction costs
- Energy efficiency compared to Proof of Work systems`;
    }
    
    if (message.includes('dapps') || message.includes('applications')) {
      return `Here are some of the top dApps in the Solana ecosystem:

1. **Jupiter** - The key liquidity aggregator and swap infrastructure for Solana
2. **Raydium** - AMM and liquidity provider for the Solana blockchain
3. **Magic Eden** - Leading NFT marketplace on Solana
4. **Kamino Finance** - Automated concentrated liquidity management
5. **Drift Protocol** - Decentralized exchange for perpetual futures trading
6. **Marginfi** - Lending and borrowing platform
7. **Zeta Markets** - Derivatives exchange
8. **Tensor** - Advanced NFT trading platform
9. **Parcl** - Real estate derivatives protocol
10. **Helium** - Decentralized wireless network now on Solana

The Solana ecosystem continues to grow with new applications being built across DeFi, NFTs, gaming, and social applications.`;
    }
    
    // Default response
    return `Thank you for your question about Solana. The Solana blockchain is known for its high throughput and low transaction costs. It uses a unique Proof of History (PoH) consensus mechanism combined with Proof of Stake (PoS).

Some key facts about Solana:
- Capable of processing 65,000+ transactions per second
- Average transaction cost is less than $0.01
- Block time of approximately 400ms
- Smart contracts written in Rust
- Growing ecosystem of DeFi, NFT, and gaming applications

Is there anything specific about Solana you'd like to learn more about?`;
  };
  
  if (viewMode === 'original') {
    return (    <WalletContextProvider>    
        <div className="min-h-screen bg-sapphire-900 text-emerald-400 p-6">    
        <div className="max-w-6xl mx-auto">    
        <header className="mb-12">    
        <div className="flex items-center justify-between">    
        <div className="flex items-center">    
        <h1 className="text-3xl font-cyber">Solana V2 Integration Demo</h1>
                </div>    <div className="flex items-center space-x-4">    
        <Button 
                    variant="outline" 
                    onClick={() => setViewMode('cyberpunk')}
                  >
                    View Cyberpunk UI
                  </Button>    <ConnectWalletButton variant="outline" />
                </div>
              </div>    <p className="text-emerald-400/70 mt-2">
                Showcasing the enhanced Solana V2 implementation with improved caching and transaction parsing
              </p>
            </header>    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">    
        <div>    
        <h2 className="text-xl font-cyber mb-4">Wallet Overview</h2>    <div className="bg-sapphire-800/30 border border-emerald-400/20 rounded-lg p-6">    
        <LiveWalletBalance className="text-3xl mb-6" />    
        <WalletDashboard />
                </div>
              </div>    <div>    
        <h2 className="text-xl font-cyber mb-4">V2 Features</h2>    <div className="bg-sapphire-800/30 border border-emerald-400/20 rounded-lg p-6">    
        <ul className="list-disc list-inside space-y-2 text-emerald-400/80">    
        <li>Enhanced transaction parsing</li>    <li>Improved token metadata handling</li>    <li>Smart caching system for better performance</li>    <li>Detailed swap transaction information</li>    <li>Better error handling and fallbacks</li>    <li>Support for Associated Token Accounts</li>
                  </ul>
                </div>
              </div>
            </div>    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">    
        <div>    
        <h2 className="text-xl font-cyber mb-4">Standard Transactions</h2>    <WalletTransactions maxItems={5} />
              </div>    <div>    
        <h2 className="text-xl font-cyber mb-4">Enhanced V2 Transactions</h2>    <WalletTransactionsV2 maxItems={5} />
              </div>
            </div>    <div className="text-center mt-12 text-emerald-400/50 text-sm">    
        <p>BlockSwarms Solana V2 Implementation Demo</p>    <p className="mt-1">Note: This demo automatically enables the V2 implementation via client-side settings</p>
            </div>
          </div>
        </div>
      </WalletContextProvider>
    );
  }
  
  // Cyberpunk UI version
  return (    <WalletContextProvider>    
        <div className="min-h-screen bg-sapphire-900 bg-tech-pattern bg-fixed p-6">
        {/*                           Header                           */}    <div className="max-w-7xl mx-auto mb-6">    <div className="flex justify-between items-center">    
        <div className="flex items-center">    
        <Link href="/dashboard" className="mr-2">    
        <Button
                  variant="ghost"
                  size="icon"
                >    
        <ArrowLeft size={18} />
                </Button>
              </Link>    <h1 className="text-2xl font-cyber text-emerald-400 text-shadow-neon flex items-center">
                Solana AI Analysis    <Button 
                  variant="ghost" 
                  size="sm"
                  className="ml-4"
                  onClick={() => setViewMode('original')}
                >
                  View Classic UI
                </Button>
              </h1>
            </div>    <ConnectWalletButton />
          </div>
        </div>
        {/*                           Main content                           */}    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/*                           Left panel - Token info                           */}    <div className="lg:col-span-1">    <Tabs defaultValue="info" className="w-full">    
        <TabsList className="w-full mb-4 bg-sapphire-800/50 border border-emerald-400/20">    
        <TabsTrigger value="info" className="flex-1 data-[state=active]:text-emerald-400">
                  Token Info
                </TabsTrigger>    <TabsTrigger value="news" className="flex-1 data-[state=active]:text-emerald-400">
                  News
                </TabsTrigger>
              </TabsList>    <TabsContent value="info" className="mt-0">    
        <TokenInfo token={solanaToken} />    
        <Card className="mt-4">    
        <CardHeader className="py-3">    
        <CardTitle className="text-lg font-cyber">Key Metrics</CardTitle>
                  </CardHeader>    <CardContent className="space-y-3">    
        <div className="flex justify-between">    
        <span className="text-muted-foreground">All-Time High</span>    <span className="font-mono">$259.96</span>
                    </div>    <div className="flex justify-between">    
        <span className="text-muted-foreground">All-Time Low</span>    <span className="font-mono">$0.50</span>
                    </div>    <div className="flex justify-between">    
        <span className="text-muted-foreground">30-Day Change</span>    <span className="font-mono text-green-400">+15.2%</span>
                    </div>    <div className="flex justify-between">    
        <span className="text-muted-foreground">90-Day Change</span>    <span className="font-mono text-green-400">+82.7%</span>
                    </div>    <div className="flex justify-between">    
        <span className="text-muted-foreground">Market Rank</span>    <span className="font-mono">#5</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>    <TabsContent value="news" className="mt-0">    
        <Card>    
        <CardContent className="pt-4">    
        <div className="space-y-4">    
        <div className="glass-card p-3 rounded-md hover:neon-border transition-all cursor-pointer">    
        <h3 className="font-cyber text-base mb-1">Solana TVL Reaches New High</h3>    <p className="text-sm text-muted-foreground mb-2">
                          Total value locked in Solana DeFi reaches $4.2 billion, signaling strong ecosystem growth.
                        </p>    <div className="text-xs text-muted-foreground">1 hour ago</div>
                      </div>    <div className="glass-card p-3 rounded-md hover:neon-border transition-all cursor-pointer">    
        <h3 className="font-cyber text-base mb-1">Jupiter Breaks Volume Records</h3>    <p className="text-sm text-muted-foreground mb-2">
                          Jupiter DEX records $450M in 24h trading volume, setting a new all-time high.
                        </p>    <div className="text-xs text-muted-foreground">3 hours ago</div>
                      </div>    <div className="glass-card p-3 rounded-md hover:neon-border transition-all cursor-pointer">    
        <h3 className="font-cyber text-base mb-1">Solana Mobile Announces New SDK</h3>    <p className="text-sm text-muted-foreground mb-2">
                          Saga developers receive new tools for mobile dApp development with enhanced crypto features.
                        </p>    <div className="text-xs text-muted-foreground">5 hours ago</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        {/*                           Center panel - Chat                           */}    <div className="lg:col-span-2 h-[calc(100vh-8rem)]">    
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">    
        <TabsList className="w-full mb-4 bg-sapphire-800/50 border border-emerald-400/20">    
        <TabsTrigger value="chat" className="flex-1 data-[state=active]:text-emerald-400">    
        <Bot size={16} className="mr-2" />
                  AI Chat
                </TabsTrigger>    <TabsTrigger value="analysis" className="flex-1 data-[state=active]:text-emerald-400">    
        <BarChart2 size={16} className="mr-2" />
                  Technical Analysis
                </TabsTrigger>
              </TabsList>    <TabsContent value="chat" className="h-full mt-0 flex-1 flex flex-col">    
        <ChatContainer
                  messages={messages}
                  onSend={handleSendMessage}
                  onStop={handleStopGeneration}
                  isGenerating={isGenerating}
                  title="Solana AI Assistant"
                  suggestions={suggestions}
                  className="h-full"
                />
              </TabsContent>    <TabsContent value="analysis" className="mt-0 h-full">    
        <Card variant="glass" className="h-full flex flex-col">    
        <CardHeader className="py-3 border-b border-border">    
        <CardTitle className="text-lg font-cyber text-shadow-neon">Technical Analysis</CardTitle>
                  </CardHeader>    <CardContent className="flex-1 p-6">    
        <div className="flex flex-col items-center justify-center h-full text-center space-y-6">    
        <div className="animate-pulse-glow border border-emerald-400/50 rounded-full p-6">    
        <div className="w-16 h-16 text-emerald-400">    
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">    
        <path d="M3 3v18h18" />    
        <path d="m19 9-5 5-4-4-3 3" />
                          </svg>
                        </div>
                      </div>    <h3 className="text-xl font-cyber text-shadow-neon">Coming Soon</h3>    <p className="text-muted-foreground max-w-md">
                        Advanced technical analysis with indicators, trend lines, and AI-powered insights is coming in the next update.
                      </p>    <Button onClick={() => setActiveTab('chat')}>Return to Chat</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </WalletContextProvider>
  );
}

// Export as default with dynamic import to skip SSR
import { default as nextDynamic } from 'next/dynamic';
export default nextDynamic(() => Promise.resolve(SolanaV2DemoPage), { ssr: false });