import { ILogger } from '../../../src/shared/utils/logger/ILogger';
import pino from 'pino';

/**
 * Logger implementation using Pino
 */
export class PinoLogger implements ILogger {
  private logger: pino.Logger;
  
  constructor(options?: pino.LoggerOptions) {
    // Set up default options
    const defaultOptions: pino.LoggerOptions = {
      level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
      transport: process.env.NODE_ENV === 'development' 
        ? { target: 'pino-pretty' } 
        : undefined,
      formatters: {
        level: (label) => {
          return { level: label };
        },
      }
    };
    
    // Merge default options with provided options
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Create Pino logger
    this.logger = pino(mergedOptions);
  }
  
  /**
   * Log information message
   */
  info(message: string, ...args: any[]): void {
    this.logger.info({ data: args.length ? args : undefined }, message);
  }
  
  /**
   * Log debug message
   */
  debug(message: string, ...args: any[]): void {
    this.logger.debug({ data: args.length ? args : undefined }, message);
  }
  
  /**
   * Log warning message
   */
  warn(message: string, ...args: any[]): void {
    this.logger.warn({ data: args.length ? args : undefined }, message);
  }
  
  /**
   * Log error message
   */
  error(message: string, ...args: any[]): void {
    this.logger.error({ 
      data: args.length ? args : undefined,
      err: args[0] instanceof Error ? args[0] : undefined
    }, message);
  }
  
  /**
   * Log fatal error message
   */
  fatal(message: string, ...args: any[]): void {
    this.logger.fatal({ 
      data: args.length ? args : undefined,
      err: args[0] instanceof Error ? args[0] : undefined
    }, message);
  }
  
  /**
   * Create a child logger with additional context
   */
  child(bindings: object): ILogger {
    const childLogger = new PinoLogger();
    childLogger.logger = this.logger.child(bindings);
    return childLogger;
  }
}