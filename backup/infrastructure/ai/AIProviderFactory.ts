import { AIProviderRegistry } from '../../src/core/ai/AIProviderRegistry';
import { AnthropicProvider } from './AnthropicProvider';
import { GroqProvider } from './GroqProvider';
import { AITool } from '../../src/core/ai/interfaces/IAIProvider';
import { solanaToolSchema } from './tools/SolanaTools';
import { ILogger } from '../../src/shared/utils/logger/ILogger';

// Convert the solanaToolSchema to the AITool format
const convertToAITools = (schema: any[]): AITool[] => {
  return schema.map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }
  }));
};

/**
 * Factory for creating AI providers with the appropriate configuration
 */
export class AIProviderFactory {
  /**
   * Create and register all available AI providers
   * @param logger Optional logger instance
   */
  static registerProviders(logger?: ILogger) {
    // Convert the schema to the correct format
    const aiTools = convertToAITools(solanaToolSchema);
    
    // Create a simple logger if none provided
    const defaultLogger = logger || {
      info: console.info,
      debug: console.debug,
      warn: console.warn,
      error: console.error
    };
    
    // Register Anthropic (Claude) provider with Solana tools
    AIProviderRegistry.register(
      new AnthropicProvider({
        model: 'claude-3-7-sonnet-20240229',
        tools: aiTools,
        apiKey: process.env.ANTHROPIC_API_KEY,
        logger: defaultLogger
      })
    );
    
    // Register Groq provider
    AIProviderRegistry.register(
      new GroqProvider({
        model: 'llama3-70b-8192',
        apiKey: process.env.GROQ_API_KEY,
        logger: defaultLogger
      })
    );
  }
  
  /**
   * Create Anthropic provider with Solana tools
   * @param logger Optional logger instance
   */
  static createAnthropicProvider(logger?: ILogger) {
    // Convert the schema to the correct format
    const aiTools = convertToAITools(solanaToolSchema);
    
    // Create a simple logger if none provided
    const defaultLogger = logger || {
      info: console.info,
      debug: console.debug,
      warn: console.warn,
      error: console.error
    };
    
    return new AnthropicProvider({
      model: 'claude-3-7-sonnet-20240229',
      tools: aiTools,
      apiKey: process.env.ANTHROPIC_API_KEY,
      logger: defaultLogger
    });
  }
  
  /**
   * Create Groq provider
   * @param logger Optional logger instance
   */
  static createGroqProvider(logger?: ILogger) {
    // Create a simple logger if none provided
    const defaultLogger = logger || {
      info: console.info,
      debug: console.debug,
      warn: console.warn,
      error: console.error
    };
    
    return new GroqProvider({
      model: 'llama3-70b-8192',
      apiKey: process.env.GROQ_API_KEY,
      logger: defaultLogger
    });
  }
}