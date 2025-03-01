import { BaseAIProvider } from '../../core/ai/BaseAIProvider';
import { Message } from '../../core/ai/interfaces/IAIProvider';
import { SolanaTool } from './tools/SolanaTools';

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
  model: string;
  tools?: any[];
  apiKey?: string;
  systemPrompt?: string;
}

/**
 * Implementation of the Anthropic provider for Claude AI models
 */
export class AnthropicProvider extends BaseAIProvider {
  private readonly model: string;
  private readonly apiKey: string;
  private readonly tools: any[];
  private readonly systemPrompt: string;
  private readonly solanaTool: SolanaTool;
  
  constructor(options: AnthropicOptions) {
    super('anthropic');
    this.model = options.model || 'claude-3-sonnet-20240229';
    this.apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY || '';
    this.tools = options.tools || [];
    this.systemPrompt = options.systemPrompt || this.getDefaultSystemPrompt();
    this.solanaTool = new SolanaTool();
  }
  
  /**
   * Generate a chat completion using Anthropic's Claude API
   */
  async generateChatCompletion(messages: Message[], options: any = {}): Promise<string> {
    try {
      const anthropicMessages = this.formatMessages(messages);
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          messages: anthropicMessages,
          system: this.systemPrompt,
          tools: this.tools.length > 0 ? this.tools : undefined,
          max_tokens: options.maxTokens || 4000,
          temperature: options.temperature || 0.7,
          stream: false
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error?.message || 'Unknown error';
        throw new Error(`Anthropic API error: ${errorMessage}`);
      }
      
      const data = await response.json();
      
      // Check if the response contains a tool use request
      if (data.content && data.stop_reason === 'tool_use') {
        return await this.handleToolUse(data, messages);
      }
      
      return data.content[0].text;
    } catch (error) {
      console.error('Error generating chat completion with Anthropic:', error);
      throw error;
    }
  }
  
  /**
   * Handle tool use request from Claude
   */
  private async handleToolUse(data: any, originalMessages: Message[]): Promise<string> {
    // Extract tool use information from the response
    const toolUseBlock = data.content.find((block: any) => block.type === 'tool_use');
    
    if (!toolUseBlock) {
      return 'I tried to use a tool but encountered an error.';
    }
    
    const { id: toolUseId, name: toolName, input: toolInput } = toolUseBlock;
    
    // Execute the tool based on the name
    let toolResult;
    try {
      toolResult = await this.executeTool(toolName, toolInput);
    } catch (error) {
      toolResult = { error: `Error executing tool ${toolName}: ${error.message}` };
    }
    
    // Add the tool result to the messages and continue the conversation
    const updatedMessages = [...this.formatMessages(originalMessages)];
    
    // Add the assistant's tool use request
    updatedMessages.push({
      role: 'assistant',
      content: data.content
    });
    
    // Add the tool result
    updatedMessages.push({
      role: 'user',
      content: [
        {
          type: 'tool_result',
          tool_result: {
            tool_use_id: toolUseId,
            content: JSON.stringify(toolResult)
          }
        }
      ]
    });
    
    // Get the final response from Claude
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.model,
        messages: updatedMessages,
        system: this.systemPrompt,
        max_tokens: 4000,
        temperature: 0.7,
        stream: false
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Anthropic API error: ${error.error?.message || 'Unknown error'}`);
    }
    
    const finalResponse = await response.json();
    
    // If Claude wants to use another tool, handle that recursively
    if (finalResponse.content && finalResponse.stop_reason === 'tool_use') {
      return this.handleToolUse(finalResponse, originalMessages);
    }
    
    return finalResponse.content[0].text;
  }
  
  /**
   * Execute a tool by name with the given input
   */
  private async executeTool(toolName: string, toolInput: any): Promise<any> {
    switch (toolName) {
      case 'get_token_price':
        return await this.solanaTool.get_token_price(toolInput);
      case 'get_token_analytics':
        return await this.solanaTool.get_token_analytics(toolInput);
      case 'get_trading_signal':
        return await this.solanaTool.get_trading_signal(toolInput);
      case 'simulate_token_swap':
        return await this.solanaTool.simulate_token_swap(toolInput);
      case 'get_top_tokens':
        return await this.solanaTool.get_top_tokens(toolInput);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
  
  /**
   * Format messages for the Anthropic API
   */
  private formatMessages(messages: Message[]): AnthropicMessage[] {
    return messages.map(message => {
      const role = message.role === 'system' ? 'user' : message.role;
      
      return {
        role,
        content: message.content
      };
    });
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