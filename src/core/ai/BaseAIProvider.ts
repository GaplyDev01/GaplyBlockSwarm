import { 
  IAIProvider, 
  AIMessage, 
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
  
  /**
   * Create a new BaseAIProvider
   * @param logger Logger instance
   * @param apiKey API key for the provider
   * @param defaultModel Default model for the provider
   */
  constructor(logger: ILogger, apiKey: string, defaultModel: string) {
    this.logger = logger.child({ module: this.getName() });
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
   * Create a chat completion
   * Must be implemented by derived classes
   */
  abstract createChatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse>;
  
  /**
   * Create a streaming chat completion
   * Must be implemented by derived classes
   */
  abstract createStreamingChatCompletion(
    options: ChatCompletionOptions,
    onEvent: StreamHandler
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
    const totalChars = messages.reduce((sum, msg) => sum + msg.content.length, 0);
    return Math.ceil(totalChars / 4);
  }
  
  /**
   * Get context window size for model
   * Must be implemented by derived classes
   */
  abstract getContextWindowSize(model?: string): number;
  
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