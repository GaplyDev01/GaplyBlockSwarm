// Import from the /core version for backwards compatibility
import {
  AITool as CoreAITool,
  Message as CoreMessage,
  IAIProvider as CoreIAIProvider
} from '../../../core/ai/interfaces/IAIProvider';

// Import from the /src version for newer code
import {
  AIMessage,
  AITool
} from '../../core/ai/interfaces/IAIProvider';

// Define necessary interfaces locally to avoid import issues
interface ChatCompletionOptions {
  messages: AIMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  tools?: AITool[];
  toolChoice?: 'auto' | 'required' | 'none' | { type: 'function'; function: { name: string } };
}

interface ChatCompletionResponse {
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

type StreamHandler = (event: {
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
}) => void;

import { BaseAIProvider } from '../../core/ai/BaseAIProvider';
import { ILogger } from '../../shared/utils/logger/ILogger';

/**
 * Context window sizes for Anthropic models
 */
const CONTEXT_WINDOW_SIZES: Record<string, number> = {
  'claude-3-opus-20240229': 200000,
  'claude-3-sonnet-20240229': 200000,
  'claude-3-haiku-20240307': 200000,
  'claude-3-7-sonnet-20240229': 200000,
  'claude-2.1': 200000,
  'claude-2.0': 100000,
  'claude-instant-1.2': 100000,
  'default': 200000
};

/**
 * Anthropic provider for AI completions
 */
// Implement both interfaces to maintain compatibility
export class AnthropicProvider extends BaseAIProvider implements CoreIAIProvider {
  private static ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
  // Initialize fields with default values to satisfy TypeScript
  protected logger: ILogger = {} as ILogger;
  protected apiKey: string = '';
  protected defaultModel: string = 'claude-3-sonnet-20240229';

  /**
   * Get token count for messages
   * @param messages Messages to count
   * @returns Promise with estimated token count
   */
  async getTokenCount(messages: AIMessage[]): Promise<number> {
    // Anthropic doesn't have a public token counting endpoint
    // Use the estimate formula with a 4 character:1 token ratio
    const totalChars = messages.reduce((sum, msg) => sum + msg.content.length, 0);
    return Math.ceil(totalChars / 4);
  }
  
  /**
   * Get default model for this provider
   * @returns The default model name
   */
  getDefaultModel(): string {
    return this.defaultModel || 'claude-3-sonnet-20240229';
  }
  
  /**
   * Create a new AnthropicProvider
   * @param logger Logger instance
   * @param apiKey Anthropic API key
   * @param defaultModel Default model to use
   */
  constructor(
    logger: ILogger,
    apiKey: string,
    defaultModel: string = 'claude-3-sonnet-20240229'
  ) {
    super(logger, apiKey, defaultModel);
    
    // These assignments are needed for TypeScript to be happy
    // but they technically duplicate what BaseAIProvider does
    this.logger = logger;
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
  }
  
  /**
   * Log API usage statistics
   * @param model Model used
   * @param promptTokens Prompt tokens used
   * @param completionTokens Completion tokens used
   */
  protected logUsage(model: string, promptTokens: number, completionTokens?: number): void {
    const totalTokens = promptTokens + (completionTokens || 0);
    this.logger.info(`Usage: ${model}, ${promptTokens} prompt tokens, ${completionTokens || 'N/A'} completion tokens, ${totalTokens} total tokens`);
  }
  
  /**
   * Get provider name
   */
  getName(): string {
    return 'anthropic';
  }
  
  /**
   * Get available models
   */
  async getAvailableModels(): Promise<string[]> {
    // Anthropic doesn't have a models list endpoint, so we return a static list
    return [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      'claude-3-7-sonnet-20240229',
      'claude-2.1',
      'claude-2.0',
      'claude-instant-1.2'
    ];
  }
  
  /**
   * Legacy implementation for compatible with CoreIAIProvider
   * @param messages Array of messages in the conversation
   * @param options Provider-specific options
   */
  generateChatCompletion(
    messages: CoreMessage[] | AIMessage[] | ChatCompletionOptions,
    options?: any
  ): Promise<ChatCompletionResponse> {
    // Handle the legacy interface (/core version)
    if (Array.isArray(messages)) {
      // Convert CoreMessage[] to AIMessage[]
      const aiMessages = messages.map(m => ({
        role: m.role,
        content: m.content
      }));
      
      // Call the new implementation
      return this.generateChatCompletionInternal({
        messages: aiMessages,
        ...options
      }).then(response => {
        // For legacy interface, return a wrapped response
        return response;
      });
    }
    
    // Handle the new interface (/src version)
    return this.generateChatCompletionInternal(messages as ChatCompletionOptions);
  }
  
  /**
   * Internal implementation that works with the new structured format
   */
  private async generateChatCompletionInternal(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    const { messages, model, temperature, maxTokens, tools } = options;
    const modelToUse = model || this.defaultModel;
    
    try {
      const requestBody: any = {
        model: modelToUse,
        messages: this.convertToAnthropicMessages(messages),
        max_tokens: maxTokens !== undefined ? maxTokens : 4000,
      };
      
      if (temperature !== undefined) {
        requestBody.temperature = temperature;
      }
      
      if (tools && this.supportsTools() && tools.length > 0) {
        requestBody.tools = this.convertToAnthropicTools(tools);
      }
      
      const response = await fetch(AnthropicProvider.ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Anthropic API error (${response.status}): ${errorData}`);
      }
      
      const data = await response.json();
      
      // Extract and log usage statistics
      if (data.usage) {
        this.logUsage(
          modelToUse,
          data.usage.input_tokens,
          data.usage.output_tokens
        );
      }

      return {
        id: data.id,
        model: data.model,
        content: data.content[0].text,
        finishReason: data.stop_reason,
        usage: data.usage ? {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens
        } : undefined,
        toolCalls: data.content[0].type === 'tool_use' ? [{
          type: 'function',
          function: {
            name: data.content[0].name,
            arguments: JSON.stringify(data.content[0].input)
          }
        }] : undefined
      };
    } catch (error) {
      this.logger.error('Error generating chat completion', error);
      throw error;
    }
  }
  
  /**
   * Legacy implementation of streaming chat completion
   * @param messages Messages to send
   * @param onChunk Callback for each chunk
   * @param options Additional options
   */
  async generateStreamingChatCompletion(
    messages: CoreMessage[] | AIMessage[] | ChatCompletionOptions,
    onChunkOrEvent: ((chunk: any) => void) | StreamHandler,
    options?: any
  ): Promise<void> {
    // Handle the legacy interface (/core version)
    if (Array.isArray(messages)) {
      // Convert CoreMessage[] to AIMessage[]
      const aiMessages = messages.map(m => ({
        role: m.role,
        content: m.content
      }));
      
      // Call internal implementation with appropriate parameters
      if (typeof onChunkOrEvent === 'function' && options) {
        // Legacy format: messages[], callback, options
        return this.generateStreamingChatCompletionInternal(
          { messages: aiMessages, ...options },
          (event) => {
            // Convert streaming event to simple chunk format for legacy callback
            if (event.content) {
              (onChunkOrEvent as Function)(event.content);
            }
            if (event.isComplete) {
              (onChunkOrEvent as Function)({ done: true });
            }
          }
        );
      } else {
        // New format with array: messages[], callback
        return this.generateStreamingChatCompletionInternal(
          { messages: aiMessages }, 
          onChunkOrEvent as StreamHandler
        );
      }
    }
    
    // New interface (/src version)
    return this.generateStreamingChatCompletionInternal(
      messages as ChatCompletionOptions, 
      onChunkOrEvent as StreamHandler
    );
  }
  
  /**
   * Internal implementation for streaming chat completion
   */
  private async generateStreamingChatCompletionInternal(
    options: ChatCompletionOptions,
    onEvent: StreamHandler
  ): Promise<void> {
    const { messages, model, temperature, maxTokens, tools } = options;
    const modelToUse = model || this.defaultModel;
    
    try {
      const requestBody: any = {
        model: modelToUse,
        messages: this.convertToAnthropicMessages(messages),
        max_tokens: maxTokens !== undefined ? maxTokens : 4000,
        stream: true
      };
      
      if (temperature !== undefined) {
        requestBody.temperature = temperature;
      }
      
      if (tools && this.supportsTools() && tools.length > 0) {
        requestBody.tools = this.convertToAnthropicTools(tools);
      }
      
      const response = await fetch(AnthropicProvider.ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Anthropic API error (${response.status}): ${errorData}`);
      }
      
      if (!response.body) {
        throw new Error('Anthropic API returned no response body');
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let messageId: string | undefined;
      let buffer = '';
      let contentSoFar = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Convert the binary chunk to text and add it to the buffer
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete events from the buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the potentially incomplete line in the buffer
        
        for (const line of lines) {
          if (line.trim() === '' || line.startsWith(':')) continue;
          
          // Remove the "data: " prefix and parse as JSON
          if (line.startsWith('data: ')) {
            const json = line.slice(6);
            if (json === '[DONE]') {
              // Stream is complete
              onEvent({
                id: messageId,
                model: modelToUse,
                isComplete: true,
                content: contentSoFar,
                finishReason: 'stop'
              });
              return;
            }
            
            try {
              const eventData = JSON.parse(json);
              
              // Extract the ID from the first event
              if (!messageId && eventData.message_id) {
                messageId = eventData.message_id;
              }
              
              // Check if this is a text content event
              if (eventData.type === 'content_block_delta' && eventData.delta.type === 'text_delta') {
                const content = eventData.delta.text || '';
                contentSoFar += content;
                
                onEvent({
                  id: messageId,
                  model: modelToUse,
                  content,
                  isComplete: false
                });
              }
              
              // Check if this is a tool use event
              if (eventData.type === 'content_block_start' && eventData.content_block.type === 'tool_use') {
                // Start of a tool use block
                onEvent({
                  id: messageId,
                  model: modelToUse,
                  toolCalls: [{
                    type: 'function',
                    function: {
                      name: eventData.content_block.name,
                      arguments: '{}'
                    }
                  }],
                  isComplete: false
                });
              }
              
              // Check for tool input updates
              if (eventData.type === 'content_block_delta' && eventData.delta.type === 'tool_use_delta') {
                // Tool input updates
                if (eventData.delta.input_delta && typeof eventData.delta.input_delta === 'object') {
                  onEvent({
                    id: messageId,
                    model: modelToUse,
                    toolCalls: [{
                      type: 'function',
                      function: {
                        name: '', // Name is already set in content_block_start
                        arguments: JSON.stringify(eventData.delta.input_delta)
                      }
                    }],
                    isComplete: false
                  });
                }
              }
              
              // Check for stop_reason
              if (eventData.type === 'message_stop') {
                onEvent({
                  id: messageId,
                  model: modelToUse,
                  isComplete: true,
                  content: contentSoFar,
                  finishReason: eventData.stop_reason
                });
                return;
              }
            } catch (error) {
              this.logger.error('Error parsing streaming event', error);
            }
          }
        }
      }
      
      // If we reached the end of the stream without a stop_reason, send a final event
      onEvent({
        id: messageId,
        model: modelToUse,
        isComplete: true,
        content: contentSoFar,
        finishReason: 'stop'
      });
    } catch (error) {
      this.logger.error('Error creating streaming chat completion', error);
      throw error;
    }
  }
  
  /**
   * Get the context window size for a model
   * @param model Optional model name to get context window size for
   * @returns The context window size in tokens
   */
  getContextWindowSize(model?: string): number {
    const modelToCheck = model || this.defaultModel;
    return CONTEXT_WINDOW_SIZES[modelToCheck] || CONTEXT_WINDOW_SIZES.default || 100000;
  }
  
  /**
   * Check if this provider supports tools/function calling
   * @returns true if the provider supports tools, false otherwise
   */
  supportsTools(): boolean {
    return true;
  }
  
  /**
   * Set tools for this provider
   * @param tools Array of AI tools
   */
  setTools(tools: CoreAITool[] | AITool[]): void {
    this.logger.info(`Setting ${tools.length} tools for Anthropic provider`);
    this.tools = tools as AITool[];
  }
  
  /**
   * Get tools configured for this provider
   * @returns Array of configured AI tools
   */
  getTools(): AITool[] {
    return this.tools || [];
  }
  
  /**
   * Convert messages to Anthropic format
   */
  private convertToAnthropicMessages(messages: AIMessage[]): any[] {
    return messages.map(msg => {
      // Ensure valid roles for Anthropic API
      const role = ['assistant', 'user', 'system'].includes(msg.role) 
        ? msg.role 
        : 'user'; // Default to user if unknown role
      
      return {
        role,
        content: msg.content
      };
    });
  }
  
  /**
   * Convert tools to Anthropic format
   */
  private convertToAnthropicTools(tools: AITool[]): any[] {
    return tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.function.name,
        description: tool.function.description,
        parameters: tool.function.parameters
      }
    }));
  }
}