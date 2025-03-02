import { AIProviderRegistry } from '../../src/core/ai/AIProviderRegistry';
import { 
  IAIProvider, 
  Message, 
  ChatCompletionResponse 
} from '../../src/core/ai/interfaces/IAIProvider';
import { getTokenInfo } from '../wallet';

interface AIServiceConfig {
  provider?: string;
  systemPrompt?: string;
  contextData?: Record<string, any>;
}

/**
 * Service for managing AI chat interactions with tools integration
 */
export class AIChatService {
  private provider: IAIProvider;
  private systemPrompt: string;
  private contextData: Record<string, any>;
  
  constructor(config: AIServiceConfig = {}) {
    // Get the specified provider or default to first available
    const selectedProvider = config.provider 
      ? AIProviderRegistry.getProvider(config.provider)
      : AIProviderRegistry.getDefaultProvider();
      
    if (!selectedProvider) {
      throw new Error('No AI provider available');
    }
    
    // Now we're sure the provider isn't null
    this.provider = selectedProvider;
    this.systemPrompt = config.systemPrompt || '';
    this.contextData = config.contextData || {};
  }
  
  /**
   * Send a message to the AI and get a response
   */
  async sendMessage(
    message: string, 
    conversation: Message[] = [], 
    options: any = {}
  ): Promise<string> {
    try {
      // Create a new messages array with existing conversation
      const messages: Message[] = [...conversation];
      
      // Add system prompt if not already in conversation
      if (this.systemPrompt && !messages.some(m => m.role === 'system')) {
        messages.unshift({ role: 'system', content: this.systemPrompt });
      }
      
      // Add the new user message
      messages.push({ role: 'user', content: message });
      
      // Get response from AI provider
      const response = await this.provider.generateChatCompletion(messages, options);
      
      // Check if the response is a string (old format) or ChatCompletionResponse (new format)
      if (typeof response === 'string') {
        return response;
      } else {
        // Extract the content from the response object
        return response.content;
      }
    } catch (error) {
      console.error('Error in AI chat service:', error);
      return 'I apologize, but I encountered an error processing your request. Please try again later.';
    }
  }
  
  /**
   * Create a specialized context for a specific token
   */
  async createTokenContext(tokenSymbol: string): Promise<AIChatService> {
    try {
      // Get token information
      const tokenInfo = await getTokenInfo(tokenSymbol);
      
      // Create custom system prompt with token context
      const tokenSystemPrompt = `You are an AI assistant specialized in Solana blockchain and cryptocurrency analysis. The user is currently interested in the ${tokenInfo.name} (${tokenInfo.symbol}) token on Solana.
      
Here's what we know about this token:
- Symbol: ${tokenInfo.symbol}
- Name: ${tokenInfo.name}
- Mint Address: ${tokenInfo.mintAddress || 'Unknown'}
- Current Price: ${tokenInfo.price ? `$${tokenInfo.price}` : 'Unknown'}
${tokenInfo.marketCap ? `- Market Cap: $${tokenInfo.marketCap.toLocaleString()}` : ''}
${tokenInfo.volume ? `- 24h Volume: $${tokenInfo.volume.toLocaleString()}` : ''}

You have tools available to get the latest price, detailed analytics, and trading signals for this token. Use these tools proactively to provide the most current information when discussing this token.

Remember:
1. Cryptocurrency markets are highly volatile and all investments carry risk
2. Be precise with numbers and cite your sources
3. Explain complex concepts simply
4. Never guarantee future performance
5. For trading signals, clearly state they are algorithmic suggestions, not financial advice`;
      
      // Create a new service instance with the token context
      return new AIChatService({
        provider: this.provider.getName(),
        systemPrompt: tokenSystemPrompt,
        contextData: {
          token: tokenInfo
        }
      });
    } catch (error) {
      console.error(`Error creating token context for ${tokenSymbol}:`, error);
      
      // Fall back to generic token prompt if we can't get specific info
      const genericTokenPrompt = `You are an AI assistant specialized in Solana blockchain and cryptocurrency analysis. The user is currently interested in the ${tokenSymbol} token on Solana.

You have tools available to get the latest price, detailed analytics, and trading signals for tokens. Use these tools proactively to provide the most current information when discussing ${tokenSymbol}.

Remember:
1. Cryptocurrency markets are highly volatile and all investments carry risk
2. Be precise with numbers and cite your sources
3. Explain complex concepts simply
4. Never guarantee future performance
5. For trading signals, clearly state they are algorithmic suggestions, not financial advice`;
      
      return new AIChatService({
        provider: this.provider.getName(),
        systemPrompt: genericTokenPrompt,
        contextData: {
          token: { symbol: tokenSymbol }
        }
      });
    }
  }
}