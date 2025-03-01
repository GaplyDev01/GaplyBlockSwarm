import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Logger configuration
 * - In development, pretty-print logs with more details
 * - In production, use a more compact format
 */
export const logger = pino({
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
  mixin() {
    return {
      log: this.info.bind(this)
    };
  }
});

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

  // @ts-expect-error - Replace the logger with browser version in client
  logger.debug = browserLogger.debug;
  logger.info = browserLogger.info;
  logger.warn = browserLogger.warn;
  logger.error = browserLogger.error;
  logger.log = browserLogger.log;
}

export default logger;