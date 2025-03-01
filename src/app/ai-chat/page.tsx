'use client';

import React, { useEffect, useState } from 'react';
import { useAuth, SignInButton } from '@clerk/nextjs';
import { ChatContainer } from '../../presentation/components/ai/chat-container';
import { useAIContext } from '../../presentation/context/ai-context';
import { AIProviderOption } from '../../presentation/components/ai/provider-selector';

export default function AIChatPage() {
  const { isSignedIn } = useAuth();
  const { 
    isLoading, 
    availableProviders, 
    chats, 
    currentChat, 
    setCurrentChat,
    createNewChat,
    deleteChat
  } = useAIContext();
  
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  
  // Set current chat when selectedChatId changes
  useEffect(() => {
    if (selectedChatId) {
      setCurrentChat(selectedChatId);
    }
  }, [selectedChatId, setCurrentChat]);
  
  // Create a new chat
  const handleCreateChat = async () => {
    const newChat = await createNewChat('New Chat');
    if (newChat) {
      setSelectedChatId(newChat.id);
    }
  };
  
  // Delete a chat
  const handleDeleteChat = async (chatId: string) => {
    await deleteChat(chatId);
    if (selectedChatId === chatId) {
      setSelectedChatId(null);
    }
  };
  
  // Handle chat selection
  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
  };
  
  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">BlockSwarms AI Chat</h1>
          <p className="mb-6">Please sign in to access the AI chat feature.</p>
          <SignInButton mode="modal">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded">
              Sign In
            </button>
          </SignInButton>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-gray-100 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-lg">BlockSwarms AI</h2>
        </div>
        
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={handleCreateChat}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New Chat
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No chats yet</p>
              <p className="text-sm mt-2">Create a new chat to get started</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {chats.map((chat) => (
                <li key={chat.id}>
                  <button
                    onClick={() => handleChatSelect(chat.id)}
                    className={`w-full text-left p-4 hover:bg-gray-200 dark:hover:bg-gray-800 flex justify-between items-center ${
                      selectedChatId === chat.id ? 'bg-gray-200 dark:bg-gray-800' : ''
                    }`}
                  >
                    <div className="flex-1 truncate">
                      <span className="block font-medium">{chat.name}</span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(chat.updatedAt).toLocaleString()}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteChat(chat.id);
                      }}
                      className="ml-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                      aria-label="Delete chat"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      {/* Main chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedChatId && currentChat ? (
          <ChatContainer
            chatId={selectedChatId}
            initialMessages={currentChat.messages}
            providers={availableProviders as AIProviderOption[]}
            initialProvider={currentChat.modelProvider}
            initialModel={currentChat.modelName}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Welcome to BlockSwarms AI Chat</h3>
              <p className="max-w-md">
                Select an existing chat or create a new one to get started.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}