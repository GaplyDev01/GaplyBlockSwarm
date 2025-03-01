import { IAIProvider, Message } from './interfaces/IAIProvider';

/**
 * Base AI provider implementation
 */
export abstract class BaseAIProvider implements IAIProvider {
  private name: string;
  
  constructor(name: string) {
    this.name = name;
  }
  
  /**
   * Get the provider name
   */
  getName(): string {
    return this.name;
  }
  
  /**
   * Generate a chat completion
   * @param messages Array of messages in the conversation
   * @param options Provider-specific options
   */
  abstract generateChatCompletion(
    messages: Message[],
    options?: any
  ): Promise<string>;
  
  /**
   * Generate a streaming chat completion
   * Default implementation throws an error - providers must override if they support streaming
   * @param messages Array of messages in the conversation
   * @param onChunk Callback for each chunk of the response
   * @param options Provider-specific options
   */
  async generateStreamingChatCompletion(
    messages: Message[],
    onChunk: (chunk: any) => void,
    options?: any
  ): Promise<void> {
    try {
      // Fallback for providers that don't support streaming
      const response = await this.generateChatCompletion(messages, options);
      
      // Send the entire response as a single chunk
      onChunk({
        id: Date.now().toString(),
        content: response,
        isComplete: true
      });
    } catch (error) {
      console.error(`Error in streaming ${this.name} provider:`, error);
      throw error;
    }
  }
}