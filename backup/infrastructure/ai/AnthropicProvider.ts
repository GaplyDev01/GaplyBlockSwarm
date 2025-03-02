import { 
  BaseAIProvider 
} from '../../src/core/ai/BaseAIProvider';

import { 
  Message, 
  AIMessage,
  AITool,
  ChatCompletionOptions,
  ChatCompletionResponse,
  StreamHandler
} from '../../src/core/ai/interfaces/IAIProvider';

import { SolanaTool } from './tools/SolanaTools';
import { ILogger } from '../../src/shared/utils/logger/ILogger';

interface AnthropicMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | Array<{
    type: string;
    text?: string;
    tool_use?: {
      name: string;
      input: any;
    };
    tool_result?: {
      tool_use_id: string;
      content: string;
    };
  }>;
}

interface AnthropicOptions {
  model?: string;
  tools?: AITool[];
  apiKey?: string;
  systemPrompt?: string;
  logger?: ILogger;
}

/**
 * Implementation of the Anthropic provider for Claude AI models
 */
export class AnthropicProvider extends BaseAIProvider {
  private readonly systemPrompt: string;
  private readonly solanaTool: SolanaTool;
  
  constructor(options: AnthropicOptions) {
    // Create a simple logger if none provided
    const logger = options.logger || {
      info: console.info,
      debug: console.debug,
      warn: console.warn,
      error: console.error
    };
    
    // Pass required parameters to parent class
    super(
      logger, 
      options.apiKey || process.env.ANTHROPIC_API_KEY || '',
      options.model || 'claude-3-sonnet-20240229'
    );
    
    this.systemPrompt = options.systemPrompt || this.getDefaultSystemPrompt();
    this.solanaTool = new SolanaTool();
    
    // Set tools if provided
    if (options.tools && options.tools.length > 0) {
      this.setTools(options.tools);
    }
  }
  
  /**
   * Get the provider name
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
   * Check if this provider supports tools/functions
   */
  supportsTools(): boolean {
    return true;
  }
  
  /**
   * Get context window size for a model
   */
  getContextWindowSize(model?: string): number {
    const modelToCheck = model || this.defaultModel;
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
    return CONTEXT_WINDOW_SIZES[modelToCheck] || CONTEXT_WINDOW_SIZES.default || 100000;
  }
  
  /**
   * Generate a chat completion using Anthropic's Claude API
   */
  async generateChatCompletion(
    options: ChatCompletionOptions | AIMessage[],
    optionalSettings?: any
  ): Promise<ChatCompletionResponse> {
    try {
      // Handle both formats (options object and message array)
      let messages: AIMessage[];
      let model = this.defaultModel;
      let temperature = 0.7;
      let maxTokens = 4000;
      let tools: AITool[] | undefined;
      
      if (Array.isArray(options)) {
        // Legacy message array format
        messages = options;
        
        // Extract settings from optionalSettings
        if (optionalSettings) {
          model = optionalSettings.model || model;
          temperature = optionalSettings.temperature || temperature;
          maxTokens = optionalSettings.maxTokens || maxTokens;
          tools = optionalSettings.tools || this.getTools();
        }
      } else {
        // New options object format
        messages = options.messages;
        model = options.model || model;
        temperature = options.temperature || temperature;
        maxTokens = options.maxTokens || maxTokens;
        tools = options.tools || this.getTools();
      }
      
      const anthropicMessages = this.formatMessages(messages);
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model,
          messages: anthropicMessages,
          system: this.systemPrompt,
          tools: tools && tools.length > 0 ? this.convertToolsToAnthropicFormat(tools) : undefined,
          max_tokens: maxTokens,
          temperature: temperature,
          stream: false
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error?.message || 'Unknown error';
        throw new Error(`Anthropic API error: ${errorMessage}`);
      }
      
      const data = await response.json();
      
      // Extract usage info if available
      let usage;
      if (data.usage) {
        usage = {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens
        };
        
        // Log usage
        this.logUsage(model, data.usage.input_tokens, data.usage.output_tokens);
      }
      
      // Check if the response contains a tool use request
      if (data.content && data.stop_reason === 'tool_use') {
        // Find the tool use content block
        const toolUseBlock = data.content.find((block: any) => block.type === 'tool_use');
        
        if (toolUseBlock) {
          // Return with tool calls
          return {
            id: data.id,
            model: data.model,
            content: 'Function call requested',
            finishReason: data.stop_reason,
            usage,
            toolCalls: [{
              type: 'function',
              function: {
                name: toolUseBlock.name,
                arguments: JSON.stringify(toolUseBlock.input)
              }
            }]
          };
        }
      }
      
      // Return standard response
      return {
        id: data.id,
        model: data.model,
        content: data.content[0].text,
        finishReason: data.stop_reason,
        usage
      };
    } catch (error) {
      this.logger.error('Error generating chat completion with Anthropic:', error);
      throw error;
    }
  }
  
  /**
   * Generate a streaming chat completion
   */
  async generateStreamingChatCompletion(
    optionsOrMessages: ChatCompletionOptions | AIMessage[],
    onEventOrOptions: StreamHandler | any,
    optionalOnEvent?: StreamHandler
  ): Promise<void> {
    try {
      // Handle both formats
      let messages: AIMessage[];
      let model = this.defaultModel;
      let temperature = 0.7;
      let maxTokens = 4000;
      let tools: AITool[] | undefined;
      let onEvent: StreamHandler;
      
      if (Array.isArray(optionsOrMessages)) {
        // Legacy message array format
        messages = optionsOrMessages;
        
        // Extract settings from second parameter if it's an object
        if (typeof onEventOrOptions !== 'function') {
          model = onEventOrOptions.model || model;
          temperature = onEventOrOptions.temperature || temperature;
          maxTokens = onEventOrOptions.maxTokens || maxTokens;
          tools = onEventOrOptions.tools || this.getTools();
          
          // Use third parameter as callback
          onEvent = optionalOnEvent || ((chunk) => console.log('Chunk:', chunk));
        } else {
          // Use second parameter as callback
          onEvent = onEventOrOptions as StreamHandler;
        }
      } else {
        // New options object format
        messages = optionsOrMessages.messages;
        model = optionsOrMessages.model || model;
        temperature = optionsOrMessages.temperature || temperature;
        maxTokens = optionsOrMessages.maxTokens || maxTokens;
        tools = optionsOrMessages.tools || this.getTools();
        
        // Use second parameter as callback
        onEvent = onEventOrOptions as StreamHandler;
      }
      
      const anthropicMessages = this.formatMessages(messages);
      
      // Start the streaming request
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model,
          messages: anthropicMessages,
          system: this.systemPrompt,
          tools: tools && tools.length > 0 ? this.convertToolsToAnthropicFormat(tools) : undefined,
          max_tokens: maxTokens,
          temperature: temperature,
          stream: true
        })
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
                model: model,
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
                  model: model,
                  content,
                  isComplete: false
                });
              }
              
              // Check if this is a tool use event
              if (eventData.type === 'content_block_start' && eventData.content_block.type === 'tool_use') {
                // Start of a tool use block
                onEvent({
                  id: messageId,
                  model: model,
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
                    model: model,
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
                  model: model,
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
        model: model,
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
   * Format messages for the Anthropic API
   */
  private formatMessages(messages: AIMessage[]): AnthropicMessage[] {
    return messages.map(message => {
      // Ensure valid roles for Anthropic API (system role is not directly supported)
      const role = message.role === 'system' ? 'user' : message.role;
      
      return {
        role,
        content: message.content
      };
    });
  }
  
  /**
   * Convert tools to Anthropic format
   */
  private convertToolsToAnthropicFormat(tools: AITool[]): any[] {
    return tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.function.name,
        description: tool.function.description,
        parameters: tool.function.parameters
      }
    }));
  }
  
  /**
   * Get the default system prompt
   */
  private getDefaultSystemPrompt(): string {
    return `You are an AI assistant specialized in Solana blockchain and cryptocurrency analysis. You have access to real-time token data, market analytics, and trading signals for Solana tokens.

When providing information about tokens:
1. Be precise with numbers, using appropriate decimal places
2. Cite market data when providing analysis
3. Always note that cryptocurrency markets are volatile and risky
4. Never make guarantees about future price movements
5. Explain technical concepts in simple terms when needed

For trading signals:
1. Clearly state that these are algorithmic suggestions, not financial advice
2. Explain the reasoning behind recommendations
3. Include relevant risk factors
4. Suggest position sizing appropriate to risk (small allocations for high-risk tokens)

Use the tools available to you to provide accurate, up-to-date information about Solana tokens and the broader cryptocurrency market. When the user expresses interest in a specific token, proactively check its price and analytics to provide informed insights.`;
  }
}