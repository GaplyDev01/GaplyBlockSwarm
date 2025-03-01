'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAIContext } from '../context/ai-context';
import { ChatCompletionResponse } from '../../core/ai/interfaces/IAIProvider';

interface UseAIChatOptions {
  chatId?: string;
  provider?: string;
  model?: string;
  onChatCreated?: (chatId: string) => void;
}

interface UseAIChatResult {
  currentChatId: string | null;
  sendMessage: (content: string) => Promise<ChatCompletionResponse | null>;
  isProcessing: boolean;
  activeProvider: string;
  error: Error | null;
}

export function useAIChat({
  chatId,
  provider,
  model,
  onChatCreated,
}: UseAIChatOptions = {}): UseAIChatResult {
  const [currentChatId, setCurrentChatId] = useState<string | null>(chatId || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeProvider, setActiveProvider] = useState(provider || '');
  const [error, setError] = useState<Error | null>(null);
  
  const { chatService, isAuthenticated } = useAIContext();
  
  useEffect(() => {
    // Create a new chat if none is provided and we have a service
    if (!currentChatId && chatService && isAuthenticated) {
      const newChat = chatService.createChat('New Chat');
      setCurrentChatId(newChat.id);
      if (onChatCreated) {
        onChatCreated(newChat.id);
      }
    }
  }, [chatService, currentChatId, isAuthenticated, onChatCreated]);
  
  useEffect(() => {
    if (provider) {
      setActiveProvider(provider);
    }
  }, [provider]);
  
  const sendMessage = useCallback(
    async (content: string): Promise<ChatCompletionResponse | null> => {
      if (!chatService || !currentChatId || !isAuthenticated) {
        setError(new Error('Chat service not available or user not authenticated'));
        return null;
      }
      
      setIsProcessing(true);
      setError(null);
      
      try {
        const result = await chatService.getCompletion({
          messages: [{ role: 'user', content }],
          chatId: currentChatId,
          provider: activeProvider,
          model,
        });
        
        return result;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [chatService, currentChatId, activeProvider, model, isAuthenticated]
  );
  
  return {
    currentChatId,
    sendMessage,
    isProcessing,
    activeProvider,
    error,
  };
}