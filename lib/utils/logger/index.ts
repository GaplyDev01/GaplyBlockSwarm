import { ILogger } from './ILogger';
import { PinoLogger } from './PinoLogger';

// Create a singleton logger instance
let loggerInstance: ILogger | null = null;

/**
 * Get the logger instance
 * @returns The logger instance
 */
export function getLogger(): ILogger {
  if (!loggerInstance) {
    loggerInstance = new PinoLogger();
  }
  return loggerInstance;
}

// Export a default logger for convenience
export const logger = getLogger();

// Export types
export { ILogger } from './ILogger';
export { PinoLogger } from './PinoLogger';