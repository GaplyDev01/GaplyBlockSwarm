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
}

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
   * Supports tools/functions
   */
  supportsTools(): boolean;

  /**
   * Create a chat completion
   */
  createChatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse>;

  /**
   * Create a streaming chat completion
   */
  createStreamingChatCompletion(
    options: ChatCompletionOptions,
    onEvent: StreamHandler
  ): Promise<void>;

  /**
   * Get token count for messages
   */
  getTokenCount(messages: AIMessage[]): Promise<number>;

  /**
   * Get context window size for model
   */
  getContextWindowSize(model?: string): number;
}