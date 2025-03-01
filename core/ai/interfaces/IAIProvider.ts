/**
 * Message interface for AI chat
 */
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * AI Tool interface for AI providers that support tools/function calling
 */
export interface AITool {
  type: string;
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

/**
 * AI message interface with timestamps
 */
export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  id?: string;
}

/**
 * Interface for AI providers
 */
export interface IAIProvider {
  /**
   * Get the provider name
   */
  getName(): string;
  
  /**
   * Generate a chat completion
   * @param messages Array of messages in the conversation
   * @param options Provider-specific options
   */
  generateChatCompletion(
    messages: Message[],
    options?: any
  ): Promise<string>;
  
  /**
   * Generate a streaming chat completion
   * @param messages Array of messages in the conversation
   * @param onChunk Callback for each chunk of the response
   * @param options Provider-specific options
   */
  generateStreamingChatCompletion(
    messages: Message[],
    onChunk: (chunk: any) => void,
    options?: any
  ): Promise<void>;
  
  /**
   * Checks if the provider supports tools/function calling
   */
  supportsTools?(): boolean;
  
  /**
   * Sets the tools for the provider
   * @param tools Array of AI tools
   */
  setTools?(tools: AITool[]): void;
  
  /**
   * Get context window size for a model
   * @param model Optional model name
   */
  getContextWindowSize?(model?: string): number;
}