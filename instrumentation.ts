import tracker from '@middleware.io/agent-apm-nextjs';

export function register() {
  tracker.track({
    serviceName: "gaply-blockswarm",
    accessToken: process.env.MIDDLEWARE_ACCESS_TOKEN || "",
    target: "vercel",
  });
}

// The following functions can be used in API routes or server components for custom logging
export function logInfo(message: string, metadata?: Record<string, any>) {
  tracker.info(message, metadata);
}

export function logWarning(message: string, metadata?: Record<string, any>) {
  tracker.warn(message, metadata);
}

export function logError(message: string, metadata?: Record<string, any>) {
  tracker.error(message, metadata);
}

export function logDebug(message: string, metadata?: Record<string, any>) {
  tracker.debug(message, metadata);
}

// Example of how to use custom span for performance tracking
export async function withCustomSpan<T>(
  name: string, 
  operation: () => Promise<T>, 
  attributes?: Record<string, any>
): Promise<T> {
  const span = tracker.startSpan(name, attributes);
  try {
    const result = await operation();
    span.end();
    return result;
  } catch (error) {
    span.recordException(error as Error);
    span.setStatus({ code: 2 }); // Error status
    span.end();
    throw error;
  }
}
