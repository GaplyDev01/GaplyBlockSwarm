'use client';

import React, { useState } from 'react';
import { AIMessage } from '../../../core/ai/interfaces/IAIProvider';
import { Avatar } from '../../../components/ui/skeleton';
import { cn } from '../../../lib/utils';

interface MessageProps {
  message: AIMessage;
  isLastMessage: boolean;
  isStreaming?: boolean;
  providerName?: string;
}

export const Message: React.FC<MessageProps> = ({
  message,
  isLastMessage,
  isStreaming = false,
  providerName,
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Generate avatar based on role
  const avatarSrc = 
    message.role === 'assistant' 
      ? '/ai-avatar.png' // Replace with actual AI avatar path
      : message.role === 'system'
        ? '/system-avatar.png' // Replace with actual system avatar path
        : '/user-avatar.png'; // Replace with actual user avatar path

  // Format message content with proper syntax highlighting and markdown
  const formattedContent = message.content; // In a real implementation, we would use a markdown renderer like react-markdown

  return (
    <div 
      className={cn(
        'flex w-full py-4',
        message.role === 'assistant' ? 'bg-slate-50 dark:bg-slate-900' : 'bg-white dark:bg-slate-800',
        isLastMessage && isStreaming && 'border-l-2 border-blue-500'
      )}
    >
      <div className="flex w-full max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex-shrink-0 mr-4">
          <Avatar className="w-8 h-8 rounded-full">
            <img src={avatarSrc} alt={`${message.role} avatar`} className="w-full h-full rounded-full" />
          </Avatar>
        </div>
        <div className="flex-1 space-y-2 overflow-hidden">
          <div className="flex items-center">
            <span className="font-medium capitalize">
              {message.role === 'assistant' ? (providerName || 'AI Assistant') : message.role}
            </span>
            {isLastMessage && isStreaming && (
              <span className="ml-2 inline-block h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
            )}
          </div>
          <div className="prose dark:prose-invert max-w-none">
            {formattedContent}
          </div>
        </div>
        <div className="flex-shrink-0 ml-4 self-start">
          <button
            onClick={copyToClipboard}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Copy message"
            title="Copy message"
          >
            {isCopied ? (
              <span className="text-green-500">✓</span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};