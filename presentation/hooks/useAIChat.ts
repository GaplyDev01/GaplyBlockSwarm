import { useState, useEffect, useCallback } from 'react';
import { AIChatService } from '../../application/ai/AIChatService';
import { AIProviderRegistry } from '../../core/ai/AIProviderRegistry';
import { AIProviderFactory } from '../../infrastructure/ai/AIProviderFactory';
import { IAIProvider, Message } from '../../core/ai/interfaces/IAIProvider';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface UseAIChatOptions {
  tokenSymbol?: string;
  initialMessages?: ChatMessage[];
  aiProvider?: string;
}

/**
 * Hook for managing AI chat with blockchain tools
 */
export function useAIChat(options: UseAIChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>(options.initialMessages || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiService, setAIService] = useState<AIChatService | null>(null);
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>(options.aiProvider || '');
  
  // Initialize AI providers
  useEffect(() => {
    // Register all available AI providers
    AIProviderFactory.registerProviders();
    
    // Get list of available providers
    const providers = AIProviderRegistry.getProviders().map(p => p.getName());
    setAvailableProviders(providers);
    
    // Set default provider if none selected
    if (!selectedProvider && providers.length > 0) {
      setSelectedProvider(providers[0] || '');
    }
    
    // Create initial AI service
    initializeAIService();
    
    return () => {
      // Cleanup
    };
  }, []);
  
  // Initialize AI service when provider changes or token context is provided
  useEffect(() => {
    initializeAIService();
  }, [selectedProvider, options.tokenSymbol]);
  
  /**
   * Initialize the AI service with the selected provider and token context
   */
  const initializeAIService = useCallback(async () => {
    try {
      if (!selectedProvider) return;
      
      // Create base AI service with selected provider
      const baseService = new AIChatService({
        provider: selectedProvider
      });
      
      // If token symbol is provided, create specialized token context
      if (options.tokenSymbol) {
        const tokenService = await baseService.createTokenContext(options.tokenSymbol);
        setAIService(tokenService);
      } else {
        setAIService(baseService);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error initializing AI service:', err);
      setError('Failed to initialize AI chat service');
    }
  }, [selectedProvider, options.tokenSymbol]);
  
  /**
   * Send a message to the AI
   */
  const sendMessage = useCallback(async (content: string) => {
    if (!aiService) {
      setError('AI service not initialized');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Create new user message
      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content,
        timestamp: new Date()
      };
      
      // Add user message to state
      setMessages(prev => [...prev, userMessage]);
      
      // Convert chat messages to AI provider format
      const providerMessages: Message[] = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Send to AI service
      const response = await aiService.sendMessage(content, providerMessages);
      
      // Create AI response message
      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      
      // Add assistant message to state
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  }, [aiService, messages]);
  
  /**
   * Change the AI provider
   */
  const changeProvider = useCallback((providerName: string) => {
    if (availableProviders.includes(providerName)) {
      setSelectedProvider(providerName);
    }
  }, [availableProviders]);
  
  /**
   * Clear all chat messages
   */
  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);
  
  /**
   * Generate a random ID
   */
  const generateId = () => {
    return Math.random().toString(36).substring(2, 15);
  };
  
  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
    availableProviders,
    selectedProvider,
    changeProvider
  };
}