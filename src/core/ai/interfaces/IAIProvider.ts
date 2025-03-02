/**
 * Message role types for AI conversations
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Message interface for AI conversations
 */
export interface AIMessage {
  role: MessageRole;
  content: string;
  timestamp?: Date;
  id?: string;
}

/**
 * For backward compatibility with old interface
 */
export type Message = AIMessage;

/**
 * Tool definition for AI providers that support tools/functions
 */
export interface AITool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

/**
 * Tool interface for backward compatibility
 */
export type Tool = AITool;

/**
 * Result of a tool call
 */
export interface ToolCallResult {
  toolName: string;
  result: string;
}

/**
 * Options for chat completions
 */
export interface ChatCompletionOptions {
  messages: AIMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  tools?: AITool[];
  toolChoice?: 'auto' | 'required' | 'none' | { type: 'function'; function: { name: string } };
}

/**
 * Response for chat completions
 */
export interface ChatCompletionResponse {
  id: string;
  model: string;
  content: string;
  finishReason: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  toolCalls?: {
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }[];
}

/**
 * Stream event for chat completions
 */
export interface ChatCompletionStreamEvent {
  id?: string;
  model?: string;
  content?: string;
  finishReason?: string;
  isComplete: boolean;
  toolCalls?: {
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }[];
}

/**
 * Type for stream handlers
 */
export type StreamHandler = (event: ChatCompletionStreamEvent) => void;

/**
 * Interface for AI providers
 */
export interface IAIProvider {
  /**
   * Get provider name
   */
  getName(): string;

  /**
   * Get available models
   */
  getAvailableModels(): Promise<string[]>;

  /**
   * Get default model
   */
  getDefaultModel(): string;

  /**
   * Check if the provider supports tools/functions
   */
  supportsTools(): boolean;

  /**
   * Generate a chat completion
   * @param options Options for generating a chat completion (or messages array for legacy support)
   * @param optionalSettings Optional settings when using message array format
   * @returns A ChatCompletionResponse object
   */
  generateChatCompletion(
    options: ChatCompletionOptions | AIMessage[],
    optionalSettings?: any
  ): Promise<ChatCompletionResponse>;

  /**
   * Generate a streaming chat completion
   * @param optionsOrMessages Options object or array of messages
   * @param onEventOrOptions Callback function or options object
   * @param optionalOnEvent Optional callback when using old API format
   */
  generateStreamingChatCompletion(
    optionsOrMessages: ChatCompletionOptions | AIMessage[],
    onEventOrOptions: StreamHandler | any,
    optionalOnEvent?: StreamHandler
  ): Promise<void>;

  /**
   * Get token count for messages
   */
  getTokenCount(messages: AIMessage[]): Promise<number>;

  /**
   * Get context window size for model
   */
  getContextWindowSize(model?: string): number;
  
  /**
   * Get tools configured for this provider
   */
  getTools(): AITool[];
  
  /**
   * Set tools for this provider
   */
  setTools(tools: AITool[]): void;
}