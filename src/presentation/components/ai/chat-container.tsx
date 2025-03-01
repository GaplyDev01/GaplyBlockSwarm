'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AIMessage } from '../../../core/ai/interfaces/IAIProvider';
import { Message } from './message';
import { MessageInput } from './message-input';
import { ProviderSelector, AIProviderOption } from './provider-selector';
import { useAIChat } from '../../hooks/useAIChat';

interface ChatContainerProps {
  chatId?: string;
  initialMessages?: AIMessage[];
  providers: AIProviderOption[];
  initialProvider?: string;
  initialModel?: string;
  showProviderSelector?: boolean;
  onChatCreated?: (chatId: string) => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  chatId,
  initialMessages = [],
  providers,
  initialProvider,
  initialModel,
  showProviderSelector = true,
  onChatCreated,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<AIMessage[]>(initialMessages);
  const [selectedProvider, setSelectedProvider] = useState<string>(
    initialProvider || (providers[0]?.id || '')
  );
  const [selectedModel, setSelectedModel] = useState<string>(
    initialModel || (providers[0]?.models[0]?.id || '')
  );

  const {
    sendMessage,
    isProcessing,
    activeProvider,
    currentChatId,
  } = useAIChat({
    chatId,
    provider: selectedProvider,
    model: selectedModel,
    onChatCreated,
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Sync messages from the chat service
  useEffect(() => {
    if (messages.length === 0 && initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages, messages.length]);

  const handleSendMessage = async (content: string) => {
    // Add user message to the UI immediately
    const userMessage: AIMessage = {
      role: 'user',
      content,
    };
    
    setMessages((prev) => [...prev, userMessage]);
    
    // Send message to the AI service
    const result = await sendMessage(content);
    
    if (result) {
      // Add AI response
      setMessages((prev) => [
        ...prev, 
        {
          role: 'assistant',
          content: result.content,
        },
      ]);
    }
  };

  const handleProviderChange = (providerId: string) => {
    const newProvider = providers.find(p => p.id === providerId);
    setSelectedProvider(providerId);
    
    // Auto-select the first model for the new provider
    if (newProvider && newProvider.models.length > 0) {
      setSelectedModel(newProvider.models[0].id);
    }
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
  };
  
  // Get the current provider name for display
  const providerName = providers.find(p => p.id === activeProvider)?.name || 'AI Assistant';

  return (
    <div className="flex flex-col h-full max-h-full">
      {showProviderSelector && (
        <ProviderSelector
          providers={providers}
          selectedProvider={selectedProvider}
          selectedModel={selectedModel}
          onProviderChange={handleProviderChange}
          onModelChange={handleModelChange}
          disabled={isProcessing || messages.length > 0}
        />
      )}
      
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 p-4">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Welcome to BlockSwarms AI Chat</h3>
              <p className="max-w-md">
                Ask me anything about blockchain, cryptocurrencies, or how to use BlockSwarms features.
              </p>
            </div>
          </div>
        ) : (
          <div className="min-h-0 space-y-0">
            {messages.map((message, index) => (
              <Message
                key={`${message.role}-${index}`}
                message={message}
                isLastMessage={index === messages.length - 1}
                isStreaming={index === messages.length - 1 && isProcessing}
                providerName={message.role === 'assistant' ? providerName : undefined}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      <MessageInput
        onSendMessage={handleSendMessage}
        isProcessing={isProcessing}
        placeholder="Ask about blockchain, trading, or anything crypto-related..."
      />
    </div>
  );
};