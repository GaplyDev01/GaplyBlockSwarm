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
  
  // Use a more specific CSP for production
  if (process.env.NODE_ENV === 'production') {
    securityHeaders.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https://*.solana.com https://*.vercel.app; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; font-src 'self' data:;"
    );
  }

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