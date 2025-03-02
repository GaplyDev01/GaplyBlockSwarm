// Import from the /core version for backwards compatibility
import {
  AITool as CoreAITool,
  Message as CoreMessage,
  IAIProvider as CoreIAIProvider
} from '../../core/ai/interfaces/IAIProvider';

// Import from the /src version for newer code
import {
  AIMessage,
  AITool,
  IAIProvider,
  Message,
  Tool,
  ToolCallResult,
  StreamHandler
} from '../../core/ai/interfaces/IAIProvider';
import { BaseAIProvider } from '../../core/ai/BaseAIProvider';
import { ILogger } from '../../shared/utils/logger/ILogger';

/**
 * Context window sizes for Groq models
 */
const CONTEXT_WINDOW_SIZES: Record<string, number> = {
  'llama3-70b-8192': 8192,
  'llama3-8b-8192': 8192,
  'llama3-70b-8192-tool-use-preview': 8192,
  'mixtral-8x7b-32768': 32768,
  'gemma-7b-it': 8192,
  'default': 8192
};

/**
 * Groq provider for AI completions
 */
// Implement both interfaces to maintain compatibility
export class GroqProvider extends BaseAIProvider implements CoreIAIProvider {
  // Initialize fields with default values to satisfy TypeScript
  protected apiKey: string = '';
  protected logger: ILogger = {} as ILogger;
  protected defaultModel: string = 'llama3-70b-8192';
  
  /**
   * Get default model for this provider
   * @returns The default model name
   */
  getDefaultModel(): string {
    return this.defaultModel || 'llama3-70b-8192';
  }
  private static GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

  /**
   * Get token count for messages
   */
  async getTokenCount(messages: AIMessage[]): Promise<number> {
    // Groq doesn't provide a direct token counting endpoint
    // Fallback to rough estimate: 1 token ≈ 4 characters for English text
    const totalChars = messages.reduce((sum, msg) => sum + msg.content.length, 0);
    return Math.ceil(totalChars / 4);
  }
  
  /**
   * Create a new GroqProvider
   * @param logger Logger instance
   * @param apiKey Groq API key
   * @param defaultModel Default model to use
   */
  constructor(
    logger: ILogger,
    apiKey: string,
    defaultModel: string = 'llama3-70b-8192'
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
    return 'groq';
  }
  
  /**
   * Get available models
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Groq API error (${response.status}): ${errorData}`);
      }
      
      const data = await response.json();
      
      // Extract model IDs
      return data.data.map((model: any) => model.id);
    } catch (error) {
      this.logger.error('Error fetching Groq models', error);
      // Return a static list as fallback
      return [
        'llama3-70b-8192',
        'llama3-8b-8192',
        'llama3-70b-8192-tool-use-preview',
        'mixtral-8x7b-32768',
        'gemma-7b-it'
      ];
    }
  }
  
  /**
   * Generate a chat completion
   * @param options Options for generating a chat completion or array of messages
   * @param optionalSettings Optional settings when using message array format
   */
  async generateChatCompletion(
    options: any | AIMessage[] | CoreMessage[], 
    optionalSettings?: any
  ): Promise<any> {
    // Handle different parameter formats to support both old and new API
    let messages: AIMessage[];
    let model = this.defaultModel;
    let temperature: number | undefined;
    let maxTokens: number | undefined;
    let tools: AITool[] | undefined;
    let toolChoice: any;
    
    if (Array.isArray(options)) {
      // Old API: messages array as first parameter, settings object as second
      // Convert CoreMessage[] or AIMessage[] to AIMessage[]
      messages = options.map(m => ({
        role: m.role,
        content: m.content
      }));
      
      if (optionalSettings) {
        model = optionalSettings.model || this.defaultModel;
        temperature = optionalSettings.temperature;
        maxTokens = optionalSettings.maxTokens;
        tools = optionalSettings.tools;
        toolChoice = optionalSettings.toolChoice;
      }
    } else {
      // New API: options object contains everything
      messages = options.messages;
      model = options.model || this.defaultModel;
      temperature = options.temperature;
      maxTokens = options.maxTokens;
      tools = options.tools;
      toolChoice = options.toolChoice;
    }
    
    const modelToUse = model || this.defaultModel;
    
    try {
      const requestBody: any = {
        model: modelToUse,
        messages: this.convertToOpenAIMessages(messages),
        stream: false
      };
      
      if (temperature !== undefined) {
        requestBody.temperature = temperature;
      }
      
      if (maxTokens !== undefined) {
        requestBody.max_tokens = maxTokens;
      }
      
      // Add tools if supported and provided
      if (this.supportsTools() && tools && tools.length > 0 && modelToUse.includes('tool-use')) {
        requestBody.tools = tools;
        
        if (toolChoice) {
          requestBody.tool_choice = toolChoice;
        }
      }
      
      const response = await fetch(GroqProvider.GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Groq API error (${response.status}): ${errorData}`);
      }
      
      const data = await response.json();
      
      // Extract and log usage statistics
      if (data.usage) {
        this.logUsage(
          modelToUse,
          data.usage.prompt_tokens,
          data.usage.completion_tokens
        );
      }
      
      return {
        id: data.id,
        model: data.model,
        content: data.choices[0].message.content || '',
        finishReason: data.choices[0].finish_reason,
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens
        } : undefined,
        toolCalls: data.choices[0].message.tool_calls
      };
    } catch (error) {
      this.logger.error('Error creating chat completion', error);
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
    messages: CoreMessage[] | AIMessage[] | any,
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
      messages as any, 
      onChunkOrEvent as StreamHandler
    );
  }
  
  /**
   * Internal implementation for streaming chat completion
   */
  private async generateStreamingChatCompletionInternal(
    options: any,
    onEvent: StreamHandler
  ): Promise<void> {
    const { messages, model, temperature, maxTokens, tools, toolChoice } = options;
    const modelToUse = model || this.defaultModel;
    
    try {
      const requestBody: any = {
        model: modelToUse,
        messages: this.convertToOpenAIMessages(messages),
        stream: true
      };
      
      if (temperature !== undefined) {
        requestBody.temperature = temperature;
      }
      
      if (maxTokens !== undefined) {
        requestBody.max_tokens = maxTokens;
      }
      
      // Add tools if supported and provided
      if (this.supportsTools() && tools && tools.length > 0 && modelToUse.includes('tool-use')) {
        requestBody.tools = tools;
        
        if (toolChoice) {
          requestBody.tool_choice = toolChoice;
        }
      }
      
      const response = await fetch(GroqProvider.GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Groq API error (${response.status}): ${errorData}`);
      }
      
      if (!response.body) {
        throw new Error('Groq API returned no response body');
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let messageId: string | undefined;
      let buffer = '';
      let contentSoFar = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete events from the buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the potentially incomplete line in the buffer
        
        for (const line of lines) {
          if (line.trim() === '' || line.startsWith(':')) continue;
          
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
              const parsedData = JSON.parse(json);
              
              // Extract the message ID from the first chunk
              if (!messageId && parsedData.id) {
                messageId = parsedData.id;
              }
              
              // Handle content delta
              if (parsedData.choices && parsedData.choices.length > 0) {
                const choice = parsedData.choices[0];
                
                // Check for content in delta
                if (choice.delta && choice.delta.content) {
                  const content = choice.delta.content;
                  contentSoFar += content;
                  
                  onEvent({
                    id: messageId,
                    model: modelToUse,
                    content,
                    isComplete: false
                  });
                }
                
                // Check for tool calls
                if (choice.delta && choice.delta.tool_calls) {
                  const toolCalls = choice.delta.tool_calls.map((tc: any) => ({
                    type: 'function',
                    function: {
                      name: tc.function.name || '',
                      arguments: tc.function.arguments || '{}'
                    }
                  }));
                  
                  onEvent({
                    id: messageId,
                    model: modelToUse,
                    toolCalls,
                    isComplete: false
                  });
                }
                
                // Check for finish reason
                if (choice.finish_reason) {
                  onEvent({
                    id: messageId,
                    model: modelToUse,
                    isComplete: true,
                    content: contentSoFar,
                    finishReason: choice.finish_reason
                  });
                  return;
                }
              }
            } catch (error) {
              this.logger.error('Error parsing streaming event', error);
            }
          }
        }
      }
      
      // If we reached the end of the stream without a finish_reason, send a final event
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
   * Set tools for CoreIAIProvider compatibility
   */
  setTools(tools: CoreAITool[] | AITool[]): void {
    this.tools = tools as AITool[];
  }
  
  /**
   * Get context window size for model
   * @param model Optional model name to get context window size for
   * @returns The context window size in tokens
   */
  getContextWindowSize(model?: string): number {
    const modelToCheck = model || this.defaultModel;
    return CONTEXT_WINDOW_SIZES[modelToCheck] || CONTEXT_WINDOW_SIZES.default || 100000;
  }
  
  /**
   * Check if provider supports tools/function calling
   * @returns true if the provider supports tools, false otherwise
   */
  supportsTools(): boolean {
    return true;
  }
  
  /**
   * Get tools configured for this provider
   * @returns Array of configured AI tools
   */
  getTools(): AITool[] {
    return this.tools || [];
  }

  /**
   * Convert messages to OpenAI format
   * Groq uses OpenAI-compatible format
   */
  private convertToOpenAIMessages(messages: AIMessage[]): any[] {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }
}
