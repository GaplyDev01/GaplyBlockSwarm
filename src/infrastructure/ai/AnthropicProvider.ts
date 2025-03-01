import {
  AIMessage,
  AITool,
  ChatCompletionOptions,
  ChatCompletionResponse,
  StreamHandler
} from '../../core/ai/interfaces/IAIProvider';
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
export class AnthropicProvider extends BaseAIProvider {
  private static ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
  private tools?: AITool[];
  
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
   * Create a chat completion
   */
  async createChatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
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
      this.logger.error('Error creating chat completion', error);
      throw error;
    }
  }
  
  /**
   * Create a streaming chat completion
   */
  async createStreamingChatCompletion(
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
   */
  getContextWindowSize(model?: string): number {
    const modelToCheck = model || this.defaultModel;
    return CONTEXT_WINDOW_SIZES[modelToCheck] || CONTEXT_WINDOW_SIZES.default || 100000;
  }
  
  /**
   * Check if this provider supports tools
   */
  supportsTools(): boolean {
    return true;
  }
  
  /**
   * Set tools for this provider
   * @param tools Array of tools to use
   */
  setTools(tools: AITool[]): void {
    this.logger.info(`Setting ${tools.length} tools for Anthropic provider`);
    this.tools = tools;
  }
  
  /**
   * Get the current tools
   */
  getTools(): AITool[] {
    return this.tools || [];
  }
  
  /**
   * Convert messages to Anthropic format
   */
  private convertToAnthropicMessages(messages: AIMessage[]): any[] {
    return messages.map(msg => {
      // Convert roles
      let role = msg.role;
      if (role === 'assistant') role = 'assistant';
      else if (role === 'user') role = 'user';
      else if (role === 'system') role = 'system';
      
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