/**
 * Interface for Logger services
 * Defines the contract for logging across the application
 */
export interface ILogger {
  /**
   * Log an informational message
   * @param message The message to log
   * @param context Optional context object
   */
  info(message: string, context?: unknown): void;
  
  /**
   * Log a warning message
   * @param message The message to log
   * @param context Optional context object
   */
  warn(message: string, context?: unknown): void;
  
  /**
   * Log an error message
   * @param message The message to log
   * @param error Optional error object
   * @param context Optional context object
   */
  error(message: string, error?: unknown, context?: unknown): void;
  
  /**
   * Log a debug message (only in development)
   * @param message The message to log
   * @param context Optional context object
   */
  debug(message: string, context?: unknown): void;
  
  /**
   * Create a child logger with additional context
   * @param options Options for the child logger
   * @returns A new logger instance with the parent's context
   */
  child(options: { module: string; [key: string]: unknown }): ILogger;
}