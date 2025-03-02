import { AIProviderRegistry } from '../../core/ai/AIProviderRegistry';
import { logger } from '../../shared/utils/logger';
import { AnthropicProvider } from './AnthropicProvider';
import { GroqProvider } from './GroqProvider';
import { IAIProvider } from '../../core/ai/interfaces/IAIProvider';
import { ILogger } from '../../shared/utils/logger/ILogger';
import { PinoLogger } from '../../shared/utils/logger/PinoLogger';

/**
 * Factory for creating and initializing AI providers
 */
export class AIProviderFactory {
  /**
   * Initialize all AI providers
   * @param logger Logger instance
   * @returns AIProviderRegistry instance
   */
  static initialize(customLogger: ILogger = logger): AIProviderRegistry {
    const registry = new AIProviderRegistry(customLogger);
    customLogger.info('Initializing AI providers');
    
    // Initialize providers based on available API keys
    this.initializeAnthropicProvider(registry, customLogger);
    this.initializeGroqProvider(registry, customLogger);
    
    // Log available providers
    const providers = registry.getAvailableProviders();
    customLogger.info(`Initialized ${providers.length} AI providers: ${providers.join(', ')}`);
    
    // Set default provider if available
    if (providers.length > 0) {
      const defaultProviderName = registry.getDefaultProviderName();
      customLogger.info(`Default AI provider: ${defaultProviderName}`);
    } else {
      customLogger.warn('No AI providers initialized. Check your API keys.');
    }
    
    return registry;
  }
  
  /**
   * Initialize Anthropic provider
   * @param registry AIProviderRegistry instance
   * @param logger Logger instance
   */
  private static initializeAnthropicProvider(registry: AIProviderRegistry, logger: ILogger): void {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      logger.warn('ANTHROPIC_API_KEY not found, skipping Anthropic provider initialization');
      return;
    }
    
    try {
      const provider = new AnthropicProvider(
        logger,
        apiKey,
        process.env.ANTHROPIC_DEFAULT_MODEL || 'claude-3-sonnet-20240229'
      );
      
      // Register as default if specified
      const isDefault = process.env.DEFAULT_AI_PROVIDER === 'anthropic';
      registry.registerProvider(provider, isDefault);
      logger.info('Initialized Anthropic provider');
    } catch (error) {
      logger.error('Failed to initialize Anthropic provider', error);
    }
  }
  
  /**
   * Initialize Groq provider
   * @param registry AIProviderRegistry instance
   * @param logger Logger instance
   */
  private static initializeGroqProvider(registry: AIProviderRegistry, logger: ILogger): void {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      logger.warn('GROQ_API_KEY not found, skipping Groq provider initialization');
      return;
    }
    
    try {
      const provider = new GroqProvider(
        logger,
        apiKey,
        process.env.GROQ_DEFAULT_MODEL || 'llama3-70b-8192'
      );
      
      // Register as default if specified
      const isDefault = process.env.DEFAULT_AI_PROVIDER === 'groq';
      registry.registerProvider(provider, isDefault);
      logger.info('Initialized Groq provider');
    } catch (error) {
      logger.error('Failed to initialize Groq provider', error);
    }
  }

  /**
   * Create an Anthropic provider
   * @returns Anthropic provider instance
   */
  static createAnthropicProvider(): IAIProvider {
    const apiKey = process.env.ANTHROPIC_API_KEY || '';
    const model = process.env.ANTHROPIC_DEFAULT_MODEL || 'claude-3-sonnet-20240229';
    
    return new AnthropicProvider(
      new PinoLogger().child({ module: 'anthropic', provider: 'anthropic' }),
      apiKey,
      model
    );
  }

  /**
   * Create a Groq provider
   * @returns Groq provider instance
   */
  static createGroqProvider(): IAIProvider {
    const apiKey = process.env.GROQ_API_KEY || '';
    const model = process.env.GROQ_DEFAULT_MODEL || 'llama3-70b-8192';
    
    return new GroqProvider(
      new PinoLogger().child({ module: 'groq', provider: 'groq' }),
      apiKey,
      model
    );
  }
}

/**
 * Singleton instance of AIProviderRegistry
 */
let registryInstance: AIProviderRegistry | null = null;

/**
 * Get the AIProviderRegistry instance
 * @param logger Logger instance
 * @returns AIProviderRegistry instance
 */
export function getAIProviderRegistry(customLogger?: ILogger): AIProviderRegistry {
  if (!registryInstance) {
    registryInstance = AIProviderFactory.initialize(customLogger);
  }
  return registryInstance;
}