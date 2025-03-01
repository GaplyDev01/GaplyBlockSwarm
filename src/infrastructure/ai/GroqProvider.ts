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
export class GroqProvider extends BaseAIProvider {
  private static GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
  private tools?: AITool[];
  
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
   * Create a chat completion
   */
  async createChatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    const { messages, model, temperature, maxTokens, tools, toolChoice } = options;
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
   * Create a streaming chat completion
   */
  async createStreamingChatCompletion(
    options: ChatCompletionOptions,
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
      let buffer = '';
      let messageId: string | undefined;
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
   * Get context window size for model
   */
  getContextWindowSize(model?: string): number {
    const modelToCheck = model || this.defaultModel;
    return CONTEXT_WINDOW_SIZES[modelToCheck] || CONTEXT_WINDOW_SIZES.default;
  }
  
  /**
   * Check if provider supports tools
   */
  supportsTools(): boolean {
    return true;
  }
  
  /**
   * Set tools for this provider
   * @param tools Array of tools to use
   */
  setTools(tools: AITool[]): void {
    this.logger.info(`Setting ${tools.length} tools for Groq provider`);
    this.tools = tools;
  }
  
  /**
   * Get the current tools
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