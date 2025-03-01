import { AIProviderRegistry } from '../../core/ai/AIProviderRegistry';
import { AnthropicProvider } from './AnthropicProvider';
import { GroqProvider } from './GroqProvider';
import { solanaToolSchema } from './tools/SolanaTools';

/**
 * Factory for creating AI providers with the appropriate configuration
 */
export class AIProviderFactory {
  /**
   * Create and register all available AI providers
   */
  static registerProviders() {
    // Register Anthropic (Claude) provider with Solana tools
    AIProviderRegistry.register(
      new AnthropicProvider({
        model: 'claude-3-7-sonnet-20240229',
        tools: solanaToolSchema,
        apiKey: process.env.ANTHROPIC_API_KEY
      })
    );
    
    // Register Groq provider
    AIProviderRegistry.register(
      new GroqProvider({
        model: 'llama3-70b-8192',
        apiKey: process.env.GROQ_API_KEY
      })
    );
  }
  
  /**
   * Create Anthropic provider with Solana tools
   */
  static createAnthropicProvider() {
    return new AnthropicProvider({
      model: 'claude-3-7-sonnet-20240229',
      tools: solanaToolSchema,
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }
  
  /**
   * Create Groq provider
   */
  static createGroqProvider() {
    return new GroqProvider({
      model: 'llama3-70b-8192',
      apiKey: process.env.GROQ_API_KEY
    });
  }
}