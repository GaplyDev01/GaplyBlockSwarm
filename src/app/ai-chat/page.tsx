'use client';

// Import React and Next.js dependencies
import React, { useEffect, useState } from 'react';
import { useAuth, SignInButton } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Force dynamic rendering - never statically generate this page
export const dynamicPage = 'force-dynamic';
export const runtime = 'edge';

// Import components
import { ChatContainer } from '../../presentation/components/ai/chat-container';
import { useAIContext } from '../../presentation/context/ai-context';
import { AIProviderOption } from '../../presentation/components/ai/provider-selector';

function AIChatPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [isInitializing, setIsInitializing] = useState(true);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  
  // Get token data from URL
  const tokenSymbol = searchParams?.get('token');
  const tokenMint = searchParams?.get('mint');
  const hasTokenContext = !!(tokenSymbol && tokenMint);
  
  const { 
    isLoading: isAILoading, 
    createNewChat, 
    availableProviders,
    currentChat, 
    setCurrentChat 
  } = useAIContext();
  
  // Initialize chat with token context if provided
  useEffect(() => {
    const initializeChat = async () => {
      if (!isSignedIn || isAILoading || !availableProviders.length || !hasTokenContext) {
        setIsInitializing(false);
        return;
      }
      
      try {
        // Create a chat with token context if we have token data
        if (tokenSymbol && tokenMint && !selectedChatId) {
          const title = `${tokenSymbol} Token Chat`;
          const initialMessage = `I want to learn about the ${tokenSymbol} token (mint address: ${tokenMint})`;
          
          const newChat = await createNewChat(title, initialMessage);
          
          if (newChat) {
            setSelectedChatId(newChat.id);
            setCurrentChat(newChat.id);
          }
        }
      } catch (error) {
        console.error('Failed to initialize chat:', error);
      } finally {
        setIsInitializing(false);
      }
    };
    
    initializeChat();
  }, [
    isSignedIn, 
    isAILoading, 
    availableProviders, 
    tokenSymbol, 
    tokenMint, 
    createNewChat, 
    setCurrentChat, 
    selectedChatId,
    hasTokenContext
  ]);
  
  // Loading state
  if (!isLoaded || isAILoading || isInitializing) {
    return (    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-sapphire-900">    
        <Loader className="animate-spin text-emerald-400 h-12 w-12 mb-4" />    
        <p className="text-emerald-400">Initializing AI chat...</p>
      </div>
    );
  }
  
  // Authentication required
  if (!isSignedIn) {
    return (    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-sapphire-900">    
        <div className="text-center max-w-lg">    
        <h1 className="text-2xl font-cyber text-emerald-400 mb-4">BlockSwarms AI Chat</h1>    <p className="mb-6 text-emerald-400/70">Sign in to access AI-powered token insights</p>    <SignInButton mode="modal">    
        <button className="bg-emerald-500 hover:bg-emerald-600 text-sapphire-900 font-medium py-2 px-4 rounded">
              Sign In
            </button>
          </SignInButton>
        </div>
      </div>
    );
  }
  
  return (    <div className="flex flex-col h-screen bg-sapphire-900">
        {/*                     Header                     */}    <div className="flex items-center p-4 border-b border-emerald-400/20 bg-sapphire-800/80 backdrop-blur-sm">    <Link href="/dashboard" className="mr-4 text-emerald-400 hover:text-emerald-300">    
        <ArrowLeft size={20} />
        </Link>    <h1 className="text-xl font-cyber text-emerald-400">
          {hasTokenContext 
            ? `AI Chat about ${tokenSymbol}`
            : 'BlockSwarms AI Chat'}
        </h1>
        {hasTokenContext && (    <div className="ml-auto text-xs bg-emerald-400/10 rounded-full px-3 py-1 text-emerald-400">
            {tokenMint.slice(0, 4)}...{tokenMint.slice(-4)}
          </div>
        )}
      </div>
        {/*                     Chat container                     */}    <div className="flex-1 overflow-hidden p-4">    
        <ChatContainer
          chatId={selectedChatId || undefined}
          providers={availableProviders as AIProviderOption[]}
          initialProvider="anthropic"
          initialModel="claude-3-opus-20240229"
          showProviderSelector={!hasTokenContext}
        />
      </div>
    </div>
  );
}

// Export as default with dynamic import to skip SSR
export default dynamic(() => Promise.resolve(AIChatPage), { ssr: false });