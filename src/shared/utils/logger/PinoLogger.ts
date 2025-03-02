import pino from 'pino';
import { ILogger } from './ILogger';
import tracker from '@middleware.io/agent-apm-nextjs';

/**
 * PinoLogger implementation of ILogger using Pino with Middleware.io integration
 */
export class PinoLogger implements ILogger {
  private logger: pino.Logger;
  private moduleName: string;

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
    
    // Store module name for middleware.io logs
    this.moduleName = options?.module || 'app';
    
    const pinoOptions: pino.LoggerOptions = {
      level: options?.level || defaultLevel,
      base: { module: this.moduleName },
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
    
    // Send to middleware.io as well
    if (typeof tracker?.info === 'function') {
      const metadata = { 
        ...(typeof context === 'object' ? context as Record<string, unknown> : { context }),
        module: this.moduleName
      };
      tracker.info(message, metadata);
    }
  }

  /**
   * Log a warning message
   * @param message The message to log
   * @param context Optional context object
   */
  warn(message: string, context?: unknown): void {
    this.logger.warn(context || {}, message);
    
    // Send to middleware.io as well
    if (typeof tracker?.warn === 'function') {
      const metadata = { 
        ...(typeof context === 'object' ? context as Record<string, unknown> : { context }),
        module: this.moduleName
      };
      tracker.warn(message, metadata);
    }
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
    
    // Send to middleware.io as well
    if (typeof tracker?.error === 'function') {
      tracker.error(message, { 
        ...combinedContext, 
        module: this.moduleName 
      });
    }
  }

  /**
   * Log a debug message
   * @param message The message to log
   * @param context Optional context object
   */
  debug(message: string, context?: unknown): void {
    this.logger.debug(context || {}, message);
    
    // Send to middleware.io as well
    if (typeof tracker?.debug === 'function') {
      const metadata = { 
        ...(typeof context === 'object' ? context as Record<string, unknown> : { context }),
        module: this.moduleName
      };
      tracker.debug(message, metadata);
    }
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
    
    // Send to middleware.io as well
    if (typeof tracker?.info === 'function') {
      const metadata = { 
        ...(typeof context === 'object' ? context as Record<string, unknown> : { context }),
        module: this.module
      };
      tracker.info(message, metadata);
    }
  }

  warn(message: string, context?: unknown): void {
    this.logger.warn(context || {}, message);
    
    // Send to middleware.io as well
    if (typeof tracker?.warn === 'function') {
      const metadata = { 
        ...(typeof context === 'object' ? context as Record<string, unknown> : { context }),
        module: this.module
      };
      tracker.warn(message, metadata);
    }
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
    
    // Send to middleware.io as well
    if (typeof tracker?.error === 'function') {
      tracker.error(message, { 
        ...combinedContext, 
        module: this.module 
      });
    }
  }

  debug(message: string, context?: unknown): void {
    this.logger.debug(context || {}, message);
    
    // Send to middleware.io as well
    if (typeof tracker?.debug === 'function') {
      const metadata = { 
        ...(typeof context === 'object' ? context as Record<string, unknown> : { context }),
        module: this.module
      };
      tracker.debug(message, metadata);
    }
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