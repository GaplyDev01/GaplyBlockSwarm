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

import { ILogger } from '../../src/shared/utils/logger/ILogger';

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

interface GroqOptions {
  model?: string;
  tools?: AITool[];
  apiKey?: string;
  systemPrompt?: string;
  logger?: ILogger;
}

/**
 * Implementation of the Groq provider for LLMs
 */
export class GroqProvider extends BaseAIProvider {
  private readonly systemPrompt: string;
  private static GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
  
  constructor(options: GroqOptions) {
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
      options.apiKey || process.env.GROQ_API_KEY || '',
      options.model || 'llama3-70b-8192'
    );
    
    this.systemPrompt = options.systemPrompt || this.getDefaultSystemPrompt();
    
    // Set tools if provided
    if (options.tools && options.tools.length > 0) {
      this.setTools(options.tools);
    }
  }
  
  /**
   * Get the provider name
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
    return CONTEXT_WINDOW_SIZES[modelToCheck] || CONTEXT_WINDOW_SIZES.default || 8192;
  }
  
  /**
   * Generate a chat completion using Groq API
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
      let maxTokens = 2048;
      let tools: AITool[] | undefined;
      let toolChoice: any;
      
      if (Array.isArray(options)) {
        // Legacy message array format
        messages = options;
        
        // Extract settings from optionalSettings
        if (optionalSettings) {
          model = optionalSettings.model || model;
          temperature = optionalSettings.temperature || temperature;
          maxTokens = optionalSettings.maxTokens || maxTokens;
          tools = optionalSettings.tools || this.getTools();
          toolChoice = optionalSettings.toolChoice;
        }
      } else {
        // New options object format
        messages = options.messages;
        model = options.model || model;
        temperature = options.temperature || temperature;
        maxTokens = options.maxTokens || maxTokens;
        tools = options.tools || this.getTools();
        toolChoice = options.toolChoice;
      }
      
      // Add system message if not present and we have a system prompt
      if (this.systemPrompt && !messages.some(m => m.role === 'system')) {
        messages = [
          { role: 'system', content: this.systemPrompt },
          ...messages
        ];
      }
      
      const requestBody: any = {
        model: model,
        messages: this.formatMessages(messages),
        max_tokens: maxTokens,
        temperature: temperature,
        stream: false
      };
      
      // Add tools if supported and provided for tool-use models
      if (this.supportsTools() && tools && tools.length > 0 && model.includes('tool-use')) {
        requestBody.tools = this.convertToOpenAITools(tools);
        
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
        const errorData = await response.json();
        const errorMessage = errorData.error?.message || 'Unknown error';
        throw new Error(`Groq API error: ${errorMessage}`);
      }
      
      const data = await response.json();
      
      // Extract usage info if available
      let usage;
      if (data.usage) {
        usage = {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens
        };
        
        // Log usage
        this.logUsage(model, data.usage.prompt_tokens, data.usage.completion_tokens);
      }
      
      // Check for tool calls
      let toolCalls;
      if (data.choices[0]?.message?.tool_calls) {
        toolCalls = data.choices[0].message.tool_calls.map((tc: any) => ({
          type: 'function',
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments
          }
        }));
      }
      
      // Return standardized response
      return {
        id: data.id,
        model: data.model,
        content: data.choices[0]?.message?.content || '',
        finishReason: data.choices[0]?.finish_reason || 'stop',
        usage,
        toolCalls
      };
    } catch (error) {
      this.logger.error('Error generating chat completion with Groq:', error);
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
      let maxTokens = 2048;
      let tools: AITool[] | undefined;
      let toolChoice: any;
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
          toolChoice = onEventOrOptions.toolChoice;
          
          // Use third parameter as callback
          onEvent = optionalOnEvent || ((chunk: any) => console.log('Chunk:', chunk));
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
        toolChoice = optionsOrMessages.toolChoice;
        
        // Use second parameter as callback
        onEvent = onEventOrOptions as StreamHandler;
      }
      
      // Add system message if not present and we have a system prompt
      if (this.systemPrompt && !messages.some(m => m.role === 'system')) {
        messages = [
          { role: 'system', content: this.systemPrompt },
          ...messages
        ];
      }
      
      const requestBody: any = {
        model: model,
        messages: this.formatMessages(messages),
        max_tokens: maxTokens,
        temperature: temperature,
        stream: true
      };
      
      // Add tools if supported and provided for tool-use models
      if (this.supportsTools() && tools && tools.length > 0 && model.includes('tool-use')) {
        requestBody.tools = this.convertToOpenAITools(tools);
        
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
      const decoder = new TextDecoder('utf-8');
      let messageId: string | undefined;
      let buffer = '';
      let contentSoFar = '';
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          // Decode the chunk and add to buffer
          buffer += decoder.decode(value, { stream: true });
          
          // Process the buffer for complete server-sent events
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.trim() === '') continue;
            
            if (line.trim() === 'data: [DONE]') {
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
            
            if (line.startsWith('data: ')) {
              try {
                const jsonData = JSON.parse(line.slice(6));
                
                // Extract the ID from the first chunk
                if (!messageId && jsonData.id) {
                  messageId = jsonData.id;
                }
                
                if (jsonData.choices && jsonData.choices[0]?.delta?.content) {
                  const content = jsonData.choices[0].delta.content;
                  contentSoFar += content;
                  
                  onEvent({
                    id: messageId,
                    model: model,
                    content,
                    isComplete: false
                  });
                }
                
                // Check for tool calls
                if (jsonData.choices && jsonData.choices[0]?.delta?.tool_calls) {
                  const toolCalls = jsonData.choices[0].delta.tool_calls.map((tc: any) => ({
                    type: 'function',
                    function: {
                      name: tc.function.name || '',
                      arguments: tc.function.arguments || '{}'
                    }
                  }));
                  
                  onEvent({
                    id: messageId,
                    model: model,
                    toolCalls,
                    isComplete: false
                  });
                }
                
                // Check for finish_reason
                if (jsonData.choices && jsonData.choices[0]?.finish_reason) {
                  onEvent({
                    id: messageId,
                    model: model,
                    isComplete: true,
                    content: contentSoFar,
                    finishReason: jsonData.choices[0].finish_reason
                  });
                  return;
                }
              } catch (err) {
                this.logger.error('Error parsing SSE chunk:', err);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
      
      // If we reached the end of the stream without a finish_reason, send a final event
      onEvent({
        id: messageId,
        model: model,
        isComplete: true,
        content: contentSoFar,
        finishReason: 'stop'
      });
    } catch (error) {
      this.logger.error('Error streaming chat completion with Groq:', error);
      throw error;
    }
  }
  
  /**
   * Format messages for the Groq API
   */
  private formatMessages(messages: AIMessage[]): any[] {
    return messages.map(message => ({
      role: message.role,
      content: message.content
    }));
  }
  
  /**
   * Convert tools to OpenAI format (used by Groq)
   */
  private convertToOpenAITools(tools: AITool[]): any[] {
    return tools.map(tool => ({
      type: tool.type,
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
    return `You are a helpful assistant specialized in blockchain technologies, particularly Solana. 
You provide clear, factual information in a concise and easy-to-understand manner. 
When responding to questions about cryptocurrency, always acknowledge the volatile nature of crypto markets and avoid making financial predictions.
For technical questions, provide accurate and helpful explanations while considering the user's technical level.`;
  }
}