import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

/**
 * Simplified middleware for initial deployment troubleshooting
 * Only adds security headers without authentication checks
 */
export default function middleware(req: NextRequest) {
  // Create security headers
  const securityHeaders = new Headers();
  securityHeaders.set('X-Content-Type-Options', 'nosniff');
  securityHeaders.set('X-Frame-Options', 'DENY');
  securityHeaders.set('X-XSS-Protection', '1; mode=block');
  securityHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Set CSP headers for production with relaxed settings for troubleshooting
  if (process.env.NODE_ENV === 'production') {
    securityHeaders.set(
      'Content-Security-Policy',
      "default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline';"
    );
  }
  
  // Check if the request is for a non-existent route
  const url = req.nextUrl.clone();
  
  // Diagnostic logging for troubleshooting
  console.log(`Middleware processing: ${url.pathname}`);

  // Allow all requests to proceed with security headers
  return NextResponse.next({
    headers: securityHeaders,
  });
}

// Apply middleware only to the homepage and API routes
export const config = {
  matcher: [
    "/",
    "/api/:path*"
  ],
};