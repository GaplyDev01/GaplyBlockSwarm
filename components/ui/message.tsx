import React from "react"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"

export type MessageRole = "user" | "assistant" | "system" | "error" | "loading"

export interface MessageProps {
  role: MessageRole
  content: string
  timestamp?: Date
  avatar?: string
  isLoading?: boolean
  className?: string
}

export function Message({
  role,
  content,
  timestamp,
  avatar,
  isLoading = false,
  className,
}: MessageProps) {
  const isUser = role === "user"
  const isAssistant = role === "assistant"
  const isError = role === "error"
  const isLoadingRole = role === "loading"
  
  return (<div
      className={cn(
        "flex w-full mb-4 animate-in fade-in slide-in-from-bottom-5 duration-300",
        isUser ? "justify-end" : "justify-start",
        className
      )}
    >
      {!isUser && (    <div className="flex-shrink-0 mr-3">    <div className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center",
            isAssistant && "bg-emerald-400/20 text-emerald-400 border border-emerald-400/30",
            isError && "bg-neon-red/20 text-neon-red border border-neon-red/30",
            isLoadingRole && "bg-muted/50 text-muted-foreground"
          )}>
            {avatar ? (    <img src={avatar} alt={role} className="w-full h-full rounded-full" />
            ) : (    <span className="text-lg">
                {isAssistant && "A"}
                {isError && "!"}
                {isLoadingRole && "..."}
                {!isAssistant && !isError && !isLoadingRole && "?"}
              </span>
            )}
          </div>
        </div>
      )}    <div className={cn(
        "flex flex-col max-w-[80%] min-w-[40%]",
        isUser && "items-end"
      )}>    <div className={cn(
          "rounded-lg px-4 py-2 mb-1",
          isUser && "bg-secondary border border-emerald-400/20 text-secondary-foreground",
          isAssistant && "bg-card/80 border border-border text-card-foreground backdrop-blur-sm",
          isError && "bg-destructive/10 border border-destructive/30 text-destructive",
          isLoadingRole && "bg-muted/30 border border-muted/50 text-muted-foreground"
        )}>
          {isLoading || isLoadingRole ? (    <div className="flex items-center space-x-2">    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse"></div>    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:200ms]"></div>    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:400ms]"></div>
            </div>
          ) : (    <div className="prose prose-invert max-w-none">    <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          )}
        </div>
        
        {timestamp && (    <div className="text-xs text-muted-foreground">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
      
      {isUser && (    <div className="flex-shrink-0 ml-3">    <div className="bg-primary/20 text-primary w-9 h-9 rounded-full flex items-center justify-center border border-primary/30">
            {avatar ? (    <img src={avatar} alt="User" className="w-full h-full rounded-full" />
            ) : (    <span className="text-lg">U</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}