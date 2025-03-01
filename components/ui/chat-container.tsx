import React, { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./card"
import { Message, MessageRole } from "./message"
import { MessageInput } from "./message-input"
import { cn } from "@/lib/utils"

export interface Message {
  id: string
  role: MessageRole
  content: string
  timestamp?: Date
}

export interface ChatContainerProps {
  messages: Message[]
  onSendMessage: (message: string) => void
  onStopGeneration?: () => void
  isGenerating?: boolean
  isDisabled?: boolean
  title?: string
  suggestions?: string[]
  className?: string
}

export function ChatContainer({
  messages,
  onSendMessage,
  onStopGeneration,
  isGenerating = false,
  isDisabled = false,
  title = "AI Chat",
  suggestions = [],
  className,
}: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, autoScroll])
  
  // Handle scroll to detect if user has scrolled up
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const atBottom = scrollHeight - scrollTop - clientHeight < 100
    setAutoScroll(atBottom)
  }
  
  return (<Card 
      variant="glass" 
      className={cn("flex flex-col h-full overflow-hidden", className)}
    >    <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b border-border">    <CardTitle className="text-lg font-cyber text-glow">{title}</CardTitle>
        {isGenerating && (    <div className="flex items-center space-x-1 text-xs text-emerald-400 animate-pulse">    <span className="h-2 w-2 rounded-full bg-emerald-400"></span>    <span>Generating...</span>
          </div>
        )}
      </CardHeader>    <CardContent 
        className="flex-1 overflow-y-auto p-4" 
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">    <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-12 w-12 mb-4 text-muted"
            >    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>    <p>No messages yet. Start a conversation!</p>
          </div>
        ) : (    <div className="space-y-4">
            {messages.map((message) => (    <Message
                key={message.id}
                role={message.role}
                content={message.content}
                timestamp={message.timestamp}
              />
            ))}    <div ref={messagesEndRef} /></div>
        )}
      </CardContent>    <CardFooter className="p-4 border-t border-border">    <MessageInput
          onSend={onSendMessage}
          onStop={onStopGeneration}
          isGenerating={isGenerating}
          isDisabled={isDisabled}
          suggestions={suggestions}
        />
      </CardFooter>
      
      {!autoScroll && messages.length > 0 && (    <button
          onClick={() => {
            setAutoScroll(true)
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
          }}
          className="absolute bottom-20 right-4 w-10 h-10 rounded-full bg-muted/80 backdrop-blur-sm flex items-center justify-center hover:bg-muted border border-border hover:border-emerald-400/50 transition-colors"
        >    <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >    <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      )}
    </Card>
  )
}