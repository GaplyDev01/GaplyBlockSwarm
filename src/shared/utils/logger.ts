import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Logger configuration
 * - In development, pretty-print logs with more details
 * - In production, use a more compact format
 */

// Create a type that explicitly includes the log method
type LoggerWithLogMethod = pino.Logger & {
  log: pino.LogFn
};

// Create the base logger
const pinoLogger = pino({
  level: isDev ? 'debug' : 'info',
  transport: isDev 
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          levelFirst: true,
          translateTime: true,
        }
      }
    : undefined,
});

// Add the log method as an alias for info
(pinoLogger as LoggerWithLogMethod).log = pinoLogger.info;

// Export as a named export with the correct type
export const logger = pinoLogger as LoggerWithLogMethod;

if (typeof window !== 'undefined') {
  // Custom browser-side logger that maps to console methods
  // but also sends logs to the server in production if needed
  const browserLogger = {
    debug: (...args: unknown[]) => {
      if (isDev) console.debug(...args);
    },
    info: (...args: unknown[]) => {
      console.info(...args);
    },
    warn: (...args: unknown[]) => {
      console.warn(...args);
    },
    error: (...args: unknown[]) => {
      console.error(...args);
      // In production, you could send errors to a logging service
    },
    log: (...args: unknown[]) => {
      console.log(...args);
    },
  };

  // Replace the methods with browser equivalents in client context
  Object.assign(logger, {
    debug: browserLogger.debug,
    info: browserLogger.info,
    warn: browserLogger.warn,
    error: browserLogger.error,
    log: browserLogger.log
  });
}

export default logger;