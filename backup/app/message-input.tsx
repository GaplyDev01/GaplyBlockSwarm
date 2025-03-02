'use client';

import React, { useState, useRef, useEffect } from 'react';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isProcessing,
  placeholder = 'Ask me anything...',
  disabled = false,
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea as user types
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isProcessing || disabled) return;
    
    onSendMessage(trimmedMessage);
    setMessage('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter without Shift key
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (    <form onSubmit={handleSubmit} className="border-t border-emerald-400/20 p-4 bg-sapphire-800/80 backdrop-blur-sm">    
        <div className="flex items-end space-x-2 max-w-screen-lg mx-auto">    
        <div className="flex-1 min-h-[40px] rounded-lg border border-emerald-400/30 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-400/50 transition-shadow bg-sapphire-900/50">    
        <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isProcessing || disabled}
            rows={1}
            className="w-full p-3 resize-none bg-transparent border-0 focus:ring-0 focus:outline-none text-white placeholder:text-emerald-400/50"
          />
        </div>    <button
          type="submit"
          disabled={!message.trim() || isProcessing || disabled}
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-emerald-400 text-sapphire-900 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors h-[40px] font-medium"
        >
          {isProcessing ? (    <span className="inline-block h-4 w-4 rounded-full border-2 border-sapphire-900 border-t-transparent animate-spin"></span>
          ) : (    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">    
        <line x1="22" y1="2" x2="11" y2="13"></line>    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          )}
        </button>
      </div>
    </form>
  );
};