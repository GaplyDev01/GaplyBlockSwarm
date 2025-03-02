'use client';

import React, { useState } from 'react';
import { AIMessage } from '@/core/ai/interfaces/IAIProvider';
import { cn } from '@/lib/utils';

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

  return (    <div 
      className={cn(
        'flex w-full py-4',
        message.role === 'assistant' 
          ? 'bg-sapphire-800/50 backdrop-blur-sm border-b border-emerald-400/10' 
          : 'bg-sapphire-900/70 backdrop-blur-sm',
        isLastMessage && isStreaming && 'border-l-2 border-emerald-400'
      )}
    >    
        <div className="flex w-full max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8">    
        <div className="flex-shrink-0 mr-4">    
        <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            message.role === 'assistant' 
              ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/30' 
              : 'bg-primary/20 text-primary border border-primary/30'
          )}>
            {message.role === 'assistant' ? 'A' : 'U'}
          </div>
        </div>    <div className="flex-1 space-y-2 overflow-hidden">    
        <div className="flex items-center">    
        <span className={cn(
              "font-medium font-cyber",
              message.role === 'assistant' ? 'text-emerald-400' : 'text-white'
            )}>
              {message.role === 'assistant' ? (providerName || 'BlockSwarms AI') : 'You'}
            </span>
            {isLastMessage && isStreaming && (    <span className="ml-2 inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            )}
          </div>    <div className="prose prose-invert max-w-none text-white">
            {formattedContent}
          </div>
        </div>    <div className="flex-shrink-0 ml-4 self-start">    
        <button
            onClick={copyToClipboard}
            className="text-emerald-400/50 hover:text-emerald-400"
            aria-label="Copy message"
            title="Copy message"
          >
            {isCopied ? (    <span className="text-emerald-400">✓</span>
            ) : (    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">    
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};