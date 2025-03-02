import { logger } from './logger';

/**
 * Error tracking and monitoring utils
 * 
 * This is a simple implementation that logs errors.
 * In production, you would replace this with a real
 * error tracking service like Sentry, DataDog, etc.
 */

/**
 * Initialize error monitoring
 */
export function initializeMonitoring() {
  // Set up global error handlers
  if (typeof window !== 'undefined') {
    // Browser-side error handling
    window.addEventListener('error', captureError);
    window.addEventListener('unhandledrejection', capturePromiseRejection);
  } else {
    // Server-side error handling
    process.on('uncaughtException', (error) => {
      captureError(error);
    });
    
    process.on('unhandledRejection', (reason) => {
      capturePromiseRejection({ reason } as PromiseRejectionEvent);
    });
  }
  
  logger.info('Error monitoring initialized');
}

/**
 * Capture and report an error
 */
export function captureError(error: Error | ErrorEvent): void {
  // Extract the error object
  const errorObj = error instanceof Error ? error : error.error;
  
  // Log the error
  logger.error('Captured error:', errorObj);
  
  // In production, you would send this to your error monitoring service
  // Example with Sentry:
  // Sentry.captureException(errorObj);
}

/**
 * Capture and report a promise rejection
 */
export function capturePromiseRejection(event: PromiseRejectionEvent): void {
  const reason = event.reason;
  
  // Log the rejection reason
  logger.error('Unhandled promise rejection:', reason);
  
  // In production, you would send this to your error monitoring service
  // Example with Sentry:
  // Sentry.captureException(reason);
}

/**
 * Monitor API performance
 */
export function monitorApiPerformance(
  apiName: string, 
  startTime: number, 
  success: boolean,
  metadata?: Record<string, any>
): void {
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  logger.info(`API ${apiName} ${success ? 'succeeded' : 'failed'} in ${duration}ms`, {
    apiName,
    duration,
    success,
    ...metadata
  });
  
  // In production, you would send this to your metrics service
  // Example with DataDog:
  // datadog.timing(`api.${apiName}.duration`, duration);
  // datadog.increment(`api.${apiName}.${success ? 'success' : 'error'}`);
}

/**
 * Track AI tool usage 
 */
export function trackToolUsage(
  toolName: string,
  executionTime: number,
  success: boolean,
  metadata?: Record<string, any>
): void {
  logger.info(`AI tool ${toolName} ${success ? 'succeeded' : 'failed'} in ${executionTime}ms`, {
    toolName,
    executionTime,
    success,
    ...metadata
  });
  
  // In production, you would send this to your analytics service
  // Example with custom analytics:
  // analytics.track('ai_tool_usage', {
  //   toolName,
  //   executionTime,
  //   success,
  //   ...metadata
  // });
}