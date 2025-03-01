'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@clerk/nextjs';
import { AIChatService, ChatHistory } from '../../application/ai/AIChatService';
import { AIProviderOption } from '../components/ai/provider-selector';
import { AIProviderRegistry } from '../../core/ai/AIProviderRegistry';
import { AIProviderFactory } from '../../infrastructure/ai/AIProviderFactory';
import { PinoLogger } from '../../shared/utils/logger';
import { IChatRepository, ChatRepositoryFactory } from '../../infrastructure/database/ChatRepository';
import { SolanaServiceFactory } from '../../infrastructure/blockchain/solana/SolanaServiceFactory';

interface AIContextValue {
  chatService: AIChatService | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  availableProviders: AIProviderOption[];
  chats: ChatHistory[];
  refreshChats: () => Promise<void>;
  currentChat: ChatHistory | null;
  setCurrentChat: (chatId: string | null) => void;
  deleteChat: (chatId: string) => Promise<boolean>;
  createNewChat: (name: string, initialMessage?: string) => Promise<ChatHistory | null>;
}

const AIContext = createContext<AIContextValue>({
  chatService: null,
  isLoading: true,
  isAuthenticated: false,
  availableProviders: [],
  chats: [],
  refreshChats: async () => {},
  currentChat: null,
  setCurrentChat: () => {},
  deleteChat: async () => false,
  createNewChat: async () => null,
});

export const useAIContext = () => useContext(AIContext);

interface AIProviderProps {
  children: ReactNode;
}

export const AIProvider: React.FC<AIProviderProps> = ({ children }) => {
  const [chatService, setChatService] = useState<AIChatService | null>(null);
  const [chatRepository, setChatRepository] = useState<IChatRepository | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chats, setChats] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [availableProviders, setAvailableProviders] = useState<AIProviderOption[]>([]);
  
  const { isLoaded, isSignedIn, userId } = useAuth();
  const isAuthenticated = isLoaded && isSignedIn;
  
  // Initialize chat service
  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setIsLoading(false);
      return;
    }
    
    const initService = async () => {
      try {
        setIsLoading(true);
        
        // Create logger
        const logger = new PinoLogger();
        
        // Create provider registry
        const registry = new AIProviderRegistry(logger);
        
        // Create and register providers using factory
        const anthropicProvider = AIProviderFactory.createAnthropicProvider();
        const groqProvider = AIProviderFactory.createGroqProvider();
        
        registry.registerProvider(anthropicProvider);
        registry.registerProvider(groqProvider);
        
        // Initialize Solana service for AI tools integration
        const solanaService = await SolanaServiceFactory.createDefaultService();
        
        // Create chat service with Solana integration
        const service = new AIChatService(registry, logger, solanaService);
        
        // Create chat repository
        const repository = ChatRepositoryFactory.create('memory', logger);
        
        setChatService(service);
        setChatRepository(repository);
        
        // Load available providers and models
        const anthropicModels = await anthropicProvider.getAvailableModels();
        const groqModels = await groqProvider.getAvailableModels();
        
        setAvailableProviders([
          {
            id: 'anthropic',
            name: 'Anthropic',
            models: anthropicModels.map(modelId => ({
              id: modelId,
              name: modelId,
              contextWindow: anthropicProvider.getContextWindowSize(modelId),
            })),
          },
          {
            id: 'groq',
            name: 'Groq',
            models: groqModels.map(modelId => ({
              id: modelId,
              name: modelId,
              contextWindow: groqProvider.getContextWindowSize(modelId),
            })),
          },
        ]);
        
        // Load user chats from repository
        const userChats = await repository.getByUserId(userId);
        
        // Import chats to service
        if (userChats.length > 0) {
          service.importChats(userChats);
        }
        
        setChats(userChats);
        
      } catch (error) {
        console.error('Failed to initialize AI chat service:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initService();
  }, [isAuthenticated, userId]);
  
  // Refresh chats
  const refreshChats = async () => {
    if (!chatService || !chatRepository || !userId) return;
    
    // Get chats from repository
    const userChats = await chatRepository.getByUserId(userId);
    
    // Update state
    setChats(userChats);
  };
  
  // Create new chat
  const createNewChat = async (name: string, initialMessage?: string): Promise<ChatHistory | null> => {
    if (!chatService || !chatRepository || !userId) return null;
    
    // Create new chat
    const newChat = chatService.createChat(name, initialMessage, userId);
    
    // Save to repository
    await chatRepository.save(newChat);
    
    // Refresh chats
    await refreshChats();
    
    return newChat;
  };
  
  // Delete chat
  const deleteChat = async (chatId: string): Promise<boolean> => {
    if (!chatService || !chatRepository) return false;
    
    // Delete from service
    const serviceSuccess = chatService.deleteChat(chatId);
    
    // Delete from repository
    const repoSuccess = await chatRepository.delete(chatId);
    
    const success = serviceSuccess && repoSuccess;
    
    if (success) {
      await refreshChats();
      if (currentChatId === chatId) {
        setCurrentChatId(null);
      }
    }
    
    return success;
  };
  
  // Save chats when updated
  useEffect(() => {
    const saveChats = async () => {
      if (!chatService || !chatRepository || !userId) return;
      
      // Only run this effect when we have a chat service and repository
      const exportedChats = chatService.exportChats(userId);
      
      // Save all chats to repository
      await chatRepository.saveMany(exportedChats);
    };
    
    // Save chats periodically (every 30 seconds)
    const saveInterval = setInterval(saveChats, 30000);
    
    // Initial save
    saveChats();
    
    return () => {
      clearInterval(saveInterval);
    };
  }, [chatService, chatRepository, userId]);
  
  // Get current chat
  const currentChat = currentChatId 
    ? chats.find(chat => chat.id === currentChatId) || null
    : null;
  
  // Context value
  const value: AIContextValue = {
    chatService,
    isLoading,
    isAuthenticated,
    availableProviders,
    chats,
    refreshChats,
    currentChat,
    setCurrentChat: setCurrentChatId,
    deleteChat,
    createNewChat,
  };
  
  return (<AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
};