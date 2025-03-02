import { IAIProvider } from './interfaces/IAIProvider';
import { ILogger } from '../../shared/utils/logger/ILogger';

/**
 * Registry for AI providers 
 * Supports both static and instance methods for flexibility
 */
export class AIProviderRegistry {
  // Instance properties
  private providers: Map<string, IAIProvider> = new Map();
  private defaultProviderName: string | null = null;
  private logger: ILogger;
  
  // Static properties
  private static instance: AIProviderRegistry | null = null;
  private static staticProviders: Map<string, IAIProvider> = new Map();
  private static staticDefaultProviderName: string | null = null;
  private static staticLogger: ILogger | null = null;
  
  /**
   * Constructor
   * @param logger Logger instance
   */
  constructor(logger: ILogger) {
    this.logger = logger;
    
    // Set the static instance for static method access
    AIProviderRegistry.instance = this;
    
    // If there are already static providers registered, add them to this instance
    if (AIProviderRegistry.staticProviders.size > 0) {
      // Convert entries to array to avoid downlevelIteration issue
      const entries = Array.from(AIProviderRegistry.staticProviders.entries());
      for (const [name, provider] of entries) {
        this.providers.set(name, provider);
      }
      
      if (AIProviderRegistry.staticDefaultProviderName) {
        this.defaultProviderName = AIProviderRegistry.staticDefaultProviderName;
      }
    }
    
    // Set the static logger
    AIProviderRegistry.staticLogger = logger;
  }
  
  /**
   * Static method to get a provider by name
   * @param name Provider name
   * @returns Provider instance or null if not found
   */
  static getProvider(name: string): IAIProvider | null {
    // Try to get from instance first
    if (AIProviderRegistry.instance) {
      return AIProviderRegistry.instance.getProvider(name);
    }
    
    // Fall back to static providers
    // Use the safer pattern to check for undefined
    const provider = AIProviderRegistry.staticProviders.get(name);
    if (provider === undefined) {
      return null;
    }
    return provider;
  }

  /**
   * Static method to get all registered providers
   * @returns Array of provider instances
   */
  static getProviders(): IAIProvider[] {
    // Try to get from instance first
    if (AIProviderRegistry.instance) {
      return AIProviderRegistry.instance.getProviders();
    }
    
    // Fall back to static providers - this is safe from undefined values
    return Array.from(AIProviderRegistry.staticProviders.values());
  }

  /**
   * Static method to get names of all available providers
   * @returns Array of provider names
   */
  static getAvailableProviders(): string[] {
    // Try to get from instance first
    if (AIProviderRegistry.instance) {
      return AIProviderRegistry.instance.getAvailableProviders();
    }
    
    // Fall back to static providers
    return Array.from(AIProviderRegistry.staticProviders.keys());
  }

  /**
   * Static method to get the default provider
   * @returns Default provider or null if none registered
   */
  static getDefaultProvider(): IAIProvider | null {
    // Try to get from instance first
    if (AIProviderRegistry.instance) {
      return AIProviderRegistry.instance.getDefaultProvider();
    }
    
    // Fall back to static default provider
    if (AIProviderRegistry.staticDefaultProviderName) {
      // Use the safer pattern to check for undefined
      const provider = AIProviderRegistry.staticProviders.get(AIProviderRegistry.staticDefaultProviderName);
      if (provider === undefined) {
        return null;
      }
      return provider;
    }
    
    // Look for common provider names if they exist
    // Hard-coded for now to fix TypeScript issues
    // Try some well-known provider names first
    const anthropicProvider = AIProviderRegistry.staticProviders.get('anthropic');
    if (anthropicProvider) {
      return anthropicProvider;
    }
    
    const groqProvider = AIProviderRegistry.staticProviders.get('groq');
    if (groqProvider) {
      return groqProvider;
    }
    
    // No providers found
    return null;
  }
  
  /**
   * Static method to register a provider
   * @param provider Provider instance
   * @param isDefault Whether this is the default provider
   */
  static register(provider: IAIProvider, isDefault: boolean = false): void {
    // Register with instance if available
    if (AIProviderRegistry.instance) {
      AIProviderRegistry.instance.registerProvider(provider, isDefault);
      return;
    }
    
    // Fall back to static registration
    const providerName = provider.getName();
    
    // Check if provider already registered
    if (AIProviderRegistry.staticProviders.has(providerName)) {
      console.warn(`Provider ${providerName} already registered`);
      return;
    }
    
    // Register the provider
    AIProviderRegistry.staticProviders.set(providerName, provider);
    console.log(`Registered AI provider: ${providerName}`);
    
    // Set as default if specified or if it's the first provider
    if (isDefault || AIProviderRegistry.staticProviders.size === 1) {
      AIProviderRegistry.staticDefaultProviderName = providerName;
    }
  }
  
  /**
   * Legacy alias for register
   */
  static registerProvider(provider: IAIProvider, isDefault: boolean = false): void {
    AIProviderRegistry.register(provider, isDefault);
  }
  
  /**
   * Set logger for the registry (static method)
   */
  static setLogger(logger: ILogger): void {
    AIProviderRegistry.staticLogger = logger;
  }
  
  /**
   * Instance method to register a provider
   * @param provider Provider instance
   * @param isDefault Whether this is the default provider
   */
  registerProvider(provider: IAIProvider, isDefault: boolean = false): void {
    const providerName = provider.getName();
    
    // Check if provider already registered
    if (this.providers.has(providerName)) {
      this.logger.warn(`Provider ${providerName} already registered`);
      return;
    }
    
    // Register the provider
    this.providers.set(providerName, provider);
    this.logger.info(`Registered AI provider: ${providerName}`);
    
    // Set as default if specified or if it's the first provider
    if (isDefault || this.providers.size === 1) {
      this.defaultProviderName = providerName;
    }
    
    // Also register in static providers for compatibility
    AIProviderRegistry.staticProviders.set(providerName, provider);
    if (isDefault || AIProviderRegistry.staticProviders.size === 1) {
      AIProviderRegistry.staticDefaultProviderName = providerName;
    }
  }
  
  /**
   * Instance method to get a provider by name
   * @param name Provider name
   * @returns Provider instance or null if not found
   */
  getProvider(name: string): IAIProvider | null {
    // Use the safer pattern to check for undefined
    const provider = this.providers.get(name);
    if (provider === undefined) {
      return null;
    }
    return provider;
  }
  
  /**
   * Instance method to get all registered providers
   * @returns Array of provider instances
   */
  getProviders(): IAIProvider[] {
    return Array.from(this.providers.values());
  }
  
  /**
   * Instance method to get names of all available providers
   * @returns Array of provider names
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
  
  /**
   * Instance method to get the default provider
   * @returns Default provider or null if none registered
   */
  getDefaultProvider(): IAIProvider | null {
    if (!this.defaultProviderName) {
      // Look for common provider names if they exist
      // Hard-coded for now to fix TypeScript issues
      // Try some well-known provider names first
      const anthropicProvider = this.providers.get('anthropic');
      if (anthropicProvider) {
        return anthropicProvider;
      }
      
      const groqProvider = this.providers.get('groq');
      if (groqProvider) {
        return groqProvider;
      }
      
      // No providers found
      return null;
    }
    
    // Use the safer pattern to check for undefined
    const provider = this.providers.get(this.defaultProviderName);
    if (provider === undefined) {
      return null;
    }
    return provider;
  }
  
  /**
   * Instance method to get the name of the default provider
   * @returns Default provider name or null if none registered
   */
  getDefaultProviderName(): string | null {
    return this.defaultProviderName;
  }
}