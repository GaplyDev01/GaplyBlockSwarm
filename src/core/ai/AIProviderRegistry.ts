import { IAIProvider } from './interfaces/IAIProvider';
import { ILogger } from '../../shared/utils/logger/ILogger';

/**
 * Registry for AI providers
 */
export class AIProviderRegistry {
  private static providers: IAIProvider[] = [];
  private static logger: ILogger | null = null;
  
  /**
   * Register a new AI provider
   */
  static register(provider: IAIProvider): void {
    // Check if provider already registered
    if (this.providers.some(p => p.getName() === provider.getName())) {
      console.warn(`Provider ${provider.getName()} already registered`);
      return;
    }
    
    this.providers.push(provider);
    console.log(`Registered AI provider: ${provider.getName()}`);
  }
  
  /**
   * Get an AI provider by name
   */
  static getProvider(name: string): IAIProvider | null {
    const provider = this.providers.find(p => p.getName() === name);
    return provider || null;
  }
  
  /**
   * Get all registered providers
   */
  static getProviders(): IAIProvider[] {
    return [...this.providers];
  }
  
  /**
   * Get the default provider (first one)
   */
  static getDefaultProvider(): IAIProvider | null {
    return this.providers.length > 0 ? this.providers[0] : null;
  }
  
  /**
   * Set logger for the registry
   */
  static setLogger(logger: ILogger): void {
    this.logger = logger;
  }
}