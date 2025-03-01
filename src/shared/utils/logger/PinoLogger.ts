import pino from 'pino';
import { ILogger } from './ILogger';

/**
 * PinoLogger implementation of ILogger using Pino
 */
export class PinoLogger implements ILogger {
  private logger: pino.Logger;

  /**
   * Create a new PinoLogger
   * @param options Options for the logger
   */
  constructor(options?: { 
    module?: string; 
    level?: string; 
    pretty?: boolean;
    [key: string]: unknown;
  }) {
    const isProduction = process.env.NODE_ENV === 'production';
    const defaultLevel = isProduction ? 'info' : 'debug';
    
    const pinoOptions: pino.LoggerOptions = {
      level: options?.level || defaultLevel,
      base: { module: options?.module || 'app' },
    };

    // Add additional context if provided
    if (options) {
      const { module, level, pretty, ...rest } = options;
      pinoOptions.base = {
        ...pinoOptions.base,
        ...rest,
      };
    }

    // Use pretty printing in development
    if (!isProduction || options?.pretty) {
      this.logger = pino({
        ...pinoOptions,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
      });
    } else {
      this.logger = pino(pinoOptions);
    }
  }

  /**
   * Log an informational message
   * @param message The message to log
   * @param context Optional context object
   */
  info(message: string, context?: unknown): void {
    this.logger.info(context || {}, message);
  }

  /**
   * Log a warning message
   * @param message The message to log
   * @param context Optional context object
   */
  warn(message: string, context?: unknown): void {
    this.logger.warn(context || {}, message);
  }

  /**
   * Log an error message
   * @param message The message to log
   * @param error Optional error object
   * @param context Optional context object
   */
  error(message: string, error?: unknown, context?: unknown): void {
    // Combine error with context if both are provided
    let combinedContext: Record<string, unknown> = context ? 
      (typeof context === 'object' ? { ...context as Record<string, unknown> } : { context }) 
      : {};
    
    if (error) {
      if (error instanceof Error) {
        combinedContext = {
          ...combinedContext,
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
          },
        };
      } else {
        combinedContext = {
          ...combinedContext,
          error,
        };
      }
    }

    this.logger.error(combinedContext, message);
  }

  /**
   * Log a debug message
   * @param message The message to log
   * @param context Optional context object
   */
  debug(message: string, context?: unknown): void {
    this.logger.debug(context || {}, message);
  }

  /**
   * Create a child logger with additional context
   * @param options Options for the child logger
   * @returns A new logger instance with the parent's context
   */
  child(options: { module: string; [key: string]: unknown }): ILogger {
    const childLogger = this.logger.child(options);
    
    // Return a new PinoLogger wrapping the child
    return new ChildPinoLogger(childLogger, options.module);
  }
}

/**
 * Child logger implementation that wraps a Pino child logger
 */
class ChildPinoLogger implements ILogger {
  constructor(private logger: pino.Logger, private module: string) {}

  info(message: string, context?: unknown): void {
    this.logger.info(context || {}, message);
  }

  warn(message: string, context?: unknown): void {
    this.logger.warn(context || {}, message);
  }

  error(message: string, error?: unknown, context?: unknown): void {
    let combinedContext: Record<string, unknown> = context ? 
      (typeof context === 'object' ? { ...context as Record<string, unknown> } : { context }) 
      : {};
    
    if (error) {
      if (error instanceof Error) {
        combinedContext = {
          ...combinedContext,
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
          },
        };
      } else {
        combinedContext = {
          ...combinedContext,
          error,
        };
      }
    }

    this.logger.error(combinedContext, message);
  }

  debug(message: string, context?: unknown): void {
    this.logger.debug(context || {}, message);
  }

  child(options: { module: string; [key: string]: unknown }): ILogger {
    const nestedModule = `${this.module}:${options.module}`;
    const childOptions = { ...options, module: nestedModule };
    const childLogger = this.logger.child(childOptions);
    
    return new ChildPinoLogger(childLogger, nestedModule);
  }
}

// Create and export a default logger instance
export const logger = new PinoLogger({ 
  module: 'blockswarms',
  pretty: true,
});