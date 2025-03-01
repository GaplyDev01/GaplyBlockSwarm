import { IAIProvider } from './interfaces/IAIProvider';
import { ILogger } from '../../shared/utils/logger/ILogger';

/**
 * Registry for AI providers
 */
export class AIProviderRegistry {
  private providers: Map<string, IAIProvider> = new Map();
  private defaultProviderName: string | null = null;
  private logger: ILogger;
  
  /**
   * Constructor
   * @param logger Logger instance
   */
  constructor(logger: ILogger) {
    this.logger = logger;
  }
  
  /**
   * Register a new AI provider
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
    
    this.providers.set(providerName, provider);
    this.logger.info(`Registered AI provider: ${providerName}`);
    
    // Set as default if specified or if it's the first provider
    if (isDefault || this.providers.size === 1) {
      this.defaultProviderName = providerName;
    }
  }
  
  /**
   * Get an AI provider by name
   * @param name Provider name
   * @returns Provider instance or null if not found
   */
  getProvider(name: string): IAIProvider | null {
    return this.providers.get(name) || null;
  }
  
  /**
   * Get all registered providers
   * @returns Array of provider instances
   */
  getProviders(): IAIProvider[] {
    return Array.from(this.providers.values());
  }
  
  /**
   * Get names of all available providers
   * @returns Array of provider names
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
  
  /**
   * Get the default provider
   * @returns Default provider or null if none registered
   */
  getDefaultProvider(): IAIProvider | null {
    if (!this.defaultProviderName) return null;
    return this.providers.get(this.defaultProviderName) || null;
  }
  
  /**
   * Get the name of the default provider
   * @returns Default provider name or null if none registered
   */
  getDefaultProviderName(): string | null {
    return this.defaultProviderName;
  }
}