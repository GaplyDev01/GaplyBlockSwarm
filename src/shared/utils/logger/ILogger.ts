/**
 * Logger interface for application
 */
export interface ILogger {
  /**
   * Log information message
   */
  info(message: string, ...args: any[]): void;
  
  /**
   * Log debug message
   */
  debug(message: string, ...args: any[]): void;
  
  /**
   * Log warning message
   */
  warn(message: string, ...args: any[]): void;
  
  /**
   * Log error message
   */
  error(message: string, ...args: any[]): void;
  
  /**
   * Log fatal error message
   */
  fatal?(message: string, ...args: any[]): void;

  /**
   * Create a child logger with additional context
   */
  child?(bindings: object): ILogger;
}