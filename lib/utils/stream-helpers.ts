/**
 * Stream Helpers for Next.js Route Handlers
 * 
 * IMPORTANT STREAMING ROADMAP:
 * 
 * 1. CURRENT STATE:
 *    We're using a simplified approach without streaming to avoid build issues
 *    with ReadableStream/TransformStream in Next.js production builds.
 * 
 * 2. RECOMMENDED APPROACH FOR RESTORING STREAMING:
 *    - Move streaming functionality to client-side: Have the client handle the streaming
 *      display using fetch() with AbortController
 *    - Use web standard fetch() streams API on the client side
 *    - Keep the server-side route handlers simple and stable
 * 
 * 3. ALTERNATE SERVER-SIDE APPROACH (if needed):
 *    - Create environment-specific stream modules (one for Node.js, one for Edge)
 *    - Use Next.js's runtime configuration to select the appropriate module
 *    - Implement a compatibility layer that works in all runtime environments
 *    - Test extensively in different environments before production deployment
 * 
 * This is a simplified version that avoids using ReadableStream/TransformStream directly,
 * as they can cause compatibility issues between Node.js and Edge runtimes in Next.js.
 */

/**
 * A simple object to represent a streaming message
 */
export interface StreamingMessage {
  id?: string;
  content?: string;
  isComplete?: boolean;
  toolCalls?: any[];
  finishReason?: string;
  [key: string]: any;
}

/**
 * Creates a text encoder instance
 * This is used to encode strings into Uint8Array for the stream
 */
export function getTextEncoder(): TextEncoder {
  return new TextEncoder();
}

/**
 * Creates a response with SSE (Server-Sent Events) content type
 * This is a simple workaround that doesn't use ReadableStream/TransformStream
 * 
 * @param data The data to send in the response
 * @returns A Response with SSE headers
 */
export function createStreamingResponse(data: StreamingMessage): Response {
  // Convert the data to SSE format
  const encoder = getTextEncoder();
  const formattedData = formatSSEMessage(data);
  
  return new Response(encoder.encode(formattedData), {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}

/**
 * Formats a message in SSE format
 * 
 * @param data The data to format
 * @returns A string in SSE format
 */
function formatSSEMessage(data: StreamingMessage): string {
  const json = JSON.stringify(data);
  return `data: ${json}\n\n`;
}

/**
 * Creates a mock streaming response that uses standard JSON
 * This is useful when streaming is not available or causes issues
 * 
 * @param mockData The data to return in the response
 * @returns A Response with JSON content
 */
export function createMockStreamingResponse(mockData: any): Response {
  return Response.json({
    ...mockData,
    _streamingDisabled: true,
    _mockResponse: true
  });
}