import { NextResponse } from 'next/server';

interface RateLimitOptions {
  interval: number;
  uniqueTokenPerInterval: number;
}

export default function rateLimit(options: RateLimitOptions) {
  const { interval, uniqueTokenPerInterval } = options;
  
  // Simple in-memory cache implementation
  const cache = new Map<string, number[]>();
  
  // Cleanup function to remove old entries
  const cleanup = () => {
    const now = Date.now();
    for (const [token, timestamps] of cache.entries()) {
      const validTimestamps = timestamps.filter(ts => now - ts < interval);
      if (validTimestamps.length === 0) {
        cache.delete(token);
      } else {
        cache.set(token, validTimestamps);
      }
    }
  };
  
  // Set up periodic cleanup
  setInterval(cleanup, interval);
  
  return {
    /**
     * Check if the token is rate limited
     * @param response The NextResponse object to modify with rate limit headers
     * @param limit The maximum number of requests allowed per interval
     * @param token The token to rate limit (e.g. IP address, user ID)
     */
    check: async (response: NextResponse, limit: number, token: string): Promise<void> => {
      // Get the current time
      const now = Date.now();
      
      // Initialize this token if it doesn't exist
      const tokenTimestamps = cache.get(token) || [];
      
      // Filter out timestamps that are outside the current interval
      const validTimestamps = tokenTimestamps.filter(
        (timestamp: number) => now - timestamp < interval
      );
      
      // Add current request timestamp
      validTimestamps.push(now);
      
      // Update the cache with valid timestamps
      cache.set(token, validTimestamps);
      
      // Count how many requests this token has made in the interval
      const requestCount = validTimestamps.length;
      
      // Set rate limit headers
      response.headers.set('X-RateLimit-Limit', limit.toString());
      response.headers.set('X-RateLimit-Remaining', Math.max(0, limit - requestCount).toString());
      
      if (requestCount >= limit) {
        // Get the oldest timestamp in the current window
        const oldestTimestamp = validTimestamps[0];
        const reset = Math.ceil((oldestTimestamp + interval - now) / 1000);
        
        response.headers.set('X-RateLimit-Reset', reset.toString());
        throw new Error('Rate limit exceeded');
      }
    }
  };
}