import { IAIProvider } from './interfaces/IAIProvider';
import { ILogger } from '../../shared/utils/logger/ILogger';

/**
 * Registry for AI providers
 * Manages available AI providers and provides access to them
 */
export class AIProviderRegistry {
  private providers: Map<string, IAIProvider> = new Map();
  private logger: ILogger;
  private defaultProvider: string | null = null;

  /**
   * Create a new AIProviderRegistry
   * @param logger Logger instance
   */
  constructor(logger: ILogger) {
    this.logger = logger.child({ module: 'AIProviderRegistry' });
  }

  /**
   * Register a new AI provider
   * @param provider Provider instance
   * @param isDefault Set as default provider
   */
  registerProvider(provider: IAIProvider, isDefault: boolean = false): void {
    const name = provider.getName();
    this.providers.set(name, provider);
    
    if (isDefault || this.defaultProvider === null) {
      this.defaultProvider = name;
    }
    
    this.logger.info(`Registered AI provider: ${name}${isDefault ? ' (default)' : ''}`);
  }

  /**
   * Get a provider by name
   * @param name Provider name
   * @returns Provider instance
   */
  getProvider(name: string): IAIProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      this.logger.error(`AI provider not found: ${name}`);
      throw new Error(`AI provider '${name}' not found`);
    }
    return provider;
  }

  /**
   * Get the default provider
   * @returns Default provider instance
   */
  getDefaultProvider(): IAIProvider {
    if (!this.defaultProvider) {
      throw new Error('No default AI provider has been registered');
    }
    return this.getProvider(this.defaultProvider);
  }

  /**
   * Set the default provider
   * @param name Provider name
   */
  setDefaultProvider(name: string): void {
    if (!this.providers.has(name)) {
      throw new Error(`Cannot set default: AI provider '${name}' not found`);
    }
    this.defaultProvider = name;
    this.logger.info(`Set default AI provider: ${name}`);
  }

  /**
   * Get list of available provider names
   * @returns Array of provider names
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get all registered providers
   * @returns Map of provider names to instances
   */
  getAllProviders(): Map<string, IAIProvider> {
    return new Map(this.providers);
  }

  /**
   * Check if a provider exists
   * @param name Provider name
   * @returns True if provider exists
   */
  hasProvider(name: string): boolean {
    return this.providers.has(name);
  }

  /**
   * Get the name of the default provider
   * @returns Default provider name
   */
  getDefaultProviderName(): string | null {
    return this.defaultProvider;
  }
}