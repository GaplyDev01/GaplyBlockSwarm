'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@clerk/nextjs';
import { AIChatService } from '../../application/ai/AIChatService';
import type { ChatHistory } from '../../application/ai/AIChatService';
// Define the AIProviderOption locally since we can't import it
interface AIProviderOption {
  id: string;
  name: string;
  description?: string;
  models: Array<{
    id: string;
    name: string;
    description?: string;
    contextWindow?: number;
  }>;
}
import { AIProviderRegistry } from '../../core/ai/AIProviderRegistry';
import { AnthropicProvider } from '../../infrastructure/ai/AnthropicProvider';
import { GroqProvider } from '../../infrastructure/ai/GroqProvider';
import { PinoLogger } from '../../shared/utils/logger';
// Define interfaces locally since we can't import them
interface IChatRepository {
  save(chat: ChatHistory): Promise<void>;
  saveMany(chats: ChatHistory[]): Promise<void>;
  getByUserId(userId: string): Promise<ChatHistory[]>;
  delete(id: string): Promise<boolean>;
}

// Mock factory for ChatRepository
const ChatRepositoryFactory = {
  create(type: string, logger: any): IChatRepository {
    return {
      save: async () => {},
      saveMany: async () => {},
      getByUserId: async () => [],
      delete: async () => true
    };
  }
};
// Import the singleton instance to fix the type error
import { solanaServiceFactory } from '../../infrastructure/blockchain/solana/SolanaServiceFactory';

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
        
        // Create provider registry with the logger
        const registry = new AIProviderRegistry(logger);
        
        // Create and register providers using factory
        try {
          // Create providers manually since static method isn't available in this context
          const anthropicProvider = new AnthropicProvider(
            logger,
            process.env.ANTHROPIC_API_KEY || '',
            'claude-3-sonnet-20240229'
          );
          
          const groqProvider = new GroqProvider(
            logger,
            process.env.GROQ_API_KEY || '',
            'llama3-70b-8192'
          );
          
          // Register the providers
          registry.registerProvider(anthropicProvider, true);
          registry.registerProvider(groqProvider);
          
          // The providers have been added to the registry already
        } catch (error) {
          console.error('Failed to create AI providers:', error);
        }
        
        // Initialize Solana service for AI tools integration
        // Get Solana service with null safety
        const solanaService = solanaServiceFactory?.getSolanaService() || null;
        
        // Create chat service with Solana integration
        const service = new AIChatService(registry, logger, solanaService);
        
        // Create chat repository
        const repository = ChatRepositoryFactory.create('memory', logger);
        
        setChatService(service);
        setChatRepository(repository);
        
        // Build provider options for UI
        const anthropicProviderOption = {
          id: 'anthropic',
          name: 'Anthropic',
          models: [
            {
              id: 'claude-3-opus-20240229',
              name: 'Claude 3 Opus',
              contextWindow: 200000
            },
            {
              id: 'claude-3-sonnet-20240229',
              name: 'Claude 3 Sonnet',
              contextWindow: 180000
            },
            {
              id: 'claude-3-haiku-20240307',
              name: 'Claude 3 Haiku',
              contextWindow: 150000
            }
          ]
        };
        
        const groqProviderOption = {
          id: 'groq',
          name: 'Groq',
          models: [
            {
              id: 'llama3-8b-8192',
              name: 'Llama 3 8B',
              contextWindow: 8192
            },
            {
              id: 'llama3-70b-8192',
              name: 'Llama 3 70B',
              contextWindow: 8192
            },
            {
              id: 'mixtral-8x7b-32768',
              name: 'Mixtral 8x7B',
              contextWindow: 32768
            }
          ]
        };
        
        setAvailableProviders([anthropicProviderOption, groqProviderOption]);
        
        // Load user chats from service if supported
        let userChats: ChatHistory[] = [];
        if (service && typeof service.getAllChats === 'function') {
          userChats = service.getAllChats(userId);
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
    
    try {
      // Create new chat
      const newChat = chatService.createChat(name, initialMessage, userId);
      
      // Save to repository
      await chatRepository.save(newChat);
      
      // Refresh chats
      await refreshChats();
      
      return newChat;
    } catch (error) {
      console.error('Failed to create new chat:', error);
      return null;
    }
  };
  
  // Delete chat
  const deleteChat = async (chatId: string): Promise<boolean> => {
    if (!chatService || !chatRepository) return false;
    
    try {
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
    } catch (error) {
      console.error('Failed to delete chat:', error);
      return false;
    }
  };
  
  // Save chats when updated
  useEffect(() => {
    if (!chatService || !chatRepository || !userId) return;
    
    const saveChats = async () => {
      try {
        // Export chats from service
        const exportedChats = chatService.getAllChats(userId);
        
        // Save all chats to repository
        if (exportedChats.length > 0) {
          await chatRepository.saveMany(exportedChats);
        }
      } catch (error) {
        console.error('Failed to save chats:', error);
      }
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