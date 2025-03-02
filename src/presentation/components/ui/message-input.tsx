import React, { useState, useRef, useEffect } from "react"
import { Button } from "./button"
import { cn } from "@/src/shared/utils/utils"

export interface MessageInputProps {
  onSend: (message: string) => void
  onStop?: () => void
  isDisabled?: boolean
  isGenerating?: boolean
  placeholder?: string
  suggestions?: string[]
  className?: string
}

export function MessageInput({
  onSend,
  onStop,
  isDisabled = false,
  isGenerating = false,
  placeholder = "Type your message...",
  suggestions = [],
  className,
}: MessageInputProps) {
  const [message, setMessage] = useState("")
  const inputRef = useRef<HTMLTextAreaElement>(null)
  
  const handleSend = () => {
    if (message.trim() && !isDisabled && !isGenerating) {
      onSend(message.trim())
      setMessage("")
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }
  
  const handleSuggestionClick = (suggestion: string) => {
    if (!isDisabled && !isGenerating) {
      onSend(suggestion)
      // Focus the input after using a suggestion
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }
  }
  
  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [message]);
  
  return (    <div className={cn("w-full", className)}>
      {suggestions.length > 0 && (    <div className="mb-3 flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (    <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              disabled={isDisabled || isGenerating}
              className={cn(
                "text-xs px-3 py-1 rounded-full bg-card border border-border hover:border-emerald-400/50 transition-colors",
                "hover:bg-card/80 hover:text-shadow-neon disabled:opacity-50 disabled:pointer-events-none"
              )}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}    <div className="relative flex items-end w-full">    
        <textarea
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isDisabled}
          rows={1}
          className={cn(
            "flex-1 resize-none max-h-32 overflow-y-auto",
            "rounded-l-md py-3 px-4 bg-secondary/80 backdrop-blur-sm",
            "border border-emerald-400/20 focus:border-emerald-400/50 focus:ring-0",
            "placeholder-muted-foreground/50 text-foreground",
            isDisabled && "opacity-50 cursor-not-allowed"
          )}
        />
        
        {isGenerating ? (    <Button
            onClick={onStop}
            variant="outline"
            className="rounded-l-none rounded-r-md h-full border border-l-0 border-destructive/50 hover:bg-destructive/10"
            disabled={isDisabled || !onStop}
          >    
        <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >    
        <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>    <span className="ml-2">Stop</span>
          </Button>
        ) : (    <Button
            onClick={handleSend}
            variant="primary"
            className="rounded-l-none rounded-r-md h-full"
            disabled={isDisabled || !message.trim()}
          >    
        <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >    
        <path d="m3 3 3 9-3 9 19-9Z" />    
        <path d="M6 12h16" />
            </svg>
          </Button>
        )}
      </div>
    </div>
  )
}