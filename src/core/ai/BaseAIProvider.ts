import { 
  IAIProvider, 
  AIMessage, 
  AITool,
  ChatCompletionOptions, 
  ChatCompletionResponse,
  StreamHandler
} from './interfaces/IAIProvider';
import { ILogger } from '../../shared/utils/logger/ILogger';

/**
 * Base class for AI providers
 * Implements common functionality and enforces implementation of required methods
 */
export abstract class BaseAIProvider implements IAIProvider {
  protected logger: ILogger;
  protected apiKey: string;
  protected defaultModel: string;
  protected tools: AITool[] = [];
  
  /**
   * Create a new BaseAIProvider
   * @param logger Logger instance
   * @param apiKey API key for the provider
   * @param defaultModel Default model for the provider
   */
  constructor(logger: ILogger, apiKey: string, defaultModel: string) {
    this.logger = logger;
    
    // Only create child logger if the method exists
    if (logger && typeof logger.child === 'function') {
      try {
        this.logger = logger.child({ module: this.getName() });
      } catch (error) {
        // Fallback to original logger if child creation fails
        console.warn('Failed to create child logger, using parent logger instead');
      }
    }
    
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
    
    if (!apiKey) {
      this.logger.warn('No API key provided. The provider may not function correctly.');
    }
  }
  
  /**
   * Get the name of the provider
   * Must be implemented by derived classes
   */
  abstract getName(): string;
  
  /**
   * Get available models
   * Must be implemented by derived classes
   */
  abstract getAvailableModels(): Promise<string[]>;
  
  /**
   * Generate a chat completion
   * Must be implemented by derived classes
   * @param options Options for generating a chat completion (or messages array for legacy support)
   * @param optionalSettings Optional settings when using message array format
   * @returns A ChatCompletionResponse object
   */
  abstract generateChatCompletion(
    options: ChatCompletionOptions | AIMessage[],
    optionalSettings?: any
  ): Promise<ChatCompletionResponse>;
  
  /**
   * Generate a streaming chat completion
   * Must be implemented by derived classes
   * @param optionsOrMessages Options object or array of messages
   * @param onEventOrOptions Callback function or options object
   * @param optionalOnEvent Optional callback when using old API format
   */
  abstract generateStreamingChatCompletion(
    optionsOrMessages: ChatCompletionOptions | AIMessage[],
    onEventOrOptions: StreamHandler | any,
    optionalOnEvent?: StreamHandler
  ): Promise<void>;
  
  /**
   * Get the default model
   */
  getDefaultModel(): string {
    return this.defaultModel;
  }
  
  /**
   * Whether the provider supports tools/functions
   * Default implementation returns false, override in derived classes if supported
   */
  supportsTools(): boolean {
    return false;
  }
  
  /**
   * Get token count for messages
   * Default implementation returns an estimate, override in derived classes for accurate count
   */
  async getTokenCount(messages: AIMessage[]): Promise<number> {
    // Very rough estimate: 1 token ≈ 4 characters for English text
    const totalChars = messages.reduce((sum, msg) => sum + (msg.content?.length || 0), 0);
    return Math.ceil(totalChars / 4);
  }
  
  /**
   * Get context window size for model
   * Default implementation returns a conservative estimate
   * Override in derived classes for accurate sizes
   */
  getContextWindowSize(model?: string): number {
    return 4096; // Conservative default
  }
  
  /**
   * Get tools configured for this provider
   * Default implementation returns the tools array
   */
  getTools(): AITool[] {
    return this.tools;
  }
  
  /**
   * Set tools for this provider
   * Default implementation stores tools and logs a warning if tools not supported
   */
  setTools(tools: AITool[]): void {
    this.tools = tools;
    if (!this.supportsTools()) {
      this.logger.warn(`Tools set but not supported by provider: ${this.getName()}`);
    }
  }
  
  /**
   * Validate API key
   * @returns True if API key is valid
   */
  protected async validateApiKey(): Promise<boolean> {
    try {
      await this.getAvailableModels();
      return true;
    } catch (error) {
      this.logger.error('API key validation failed', error);
      return false;
    }
  }
  
  /**
   * Log usage statistics
   * @param model Model used
   * @param promptTokens Number of prompt tokens
   * @param completionTokens Number of completion tokens
   */
  protected logUsage(model: string, promptTokens: number, completionTokens?: number): void {
    const totalTokens = promptTokens + (completionTokens || 0);
    this.logger.info(`Usage: ${model}, ${promptTokens} prompt tokens, ${completionTokens || 'N/A'} completion tokens, ${totalTokens} total tokens`);
  }
}