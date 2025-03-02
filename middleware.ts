import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";

/**
 * BlockSwarms authentication middleware
 * Handles authentication, authorization, and security headers
 */
export default authMiddleware({
  // Public routes that don't require authentication
  publicRoutes: [
    "/",
    "/login", 
    "/signup",
    "/api/webhook",
    "/solana-v2-demo",
    "/api/public(.*)",
    "/api/health",
    "/api/status",
    "/api/token/search", // Add token search API endpoint as public
    "/dashboard", // Making dashboard public for demo purposes
    "/login/(.*)",
    "/signup/(.*)",
  ],
  
  // Optional custom handler for authentication logic
  async afterAuth(auth, req) {
    // Create security headers
    const securityHeaders = new Headers();
    securityHeaders.set('X-Content-Type-Options', 'nosniff');
    securityHeaders.set('X-Frame-Options', 'DENY');
    securityHeaders.set('X-XSS-Protection', '1; mode=block');
    securityHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    securityHeaders.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    if (process.env.NODE_ENV === 'production') {
      securityHeaders.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.blockswarms.xyz https://*.vercel.app; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.blockswarms.xyz https://*.clerk.accounts.dev https://api.clerk.dev https://*.solana.com wss://*.solana.com https://solana-mainnet.g.alchemy.com https://*.vercel.app;"
      );
    }

    // Handle authenticated requests
    if (auth.isPublicRoute) {
      // For public routes, allow the request to proceed
      return NextResponse.next({
        headers: securityHeaders,
      });
    }

    // For protected routes where the user is not authenticated
    if (!auth.userId && !auth.isPublicRoute) {
      const redirectUrl = new URL('/login', req.url);
      // Keep the original URL to redirect back after login
      redirectUrl.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(redirectUrl, {
        headers: securityHeaders,
      });
    }

    // Additional security checks for API routes
    if (req.nextUrl.pathname.startsWith('/api/') && 
        !req.nextUrl.pathname.startsWith('/api/public') && 
        !req.nextUrl.pathname.startsWith('/api/webhook') &&
        !req.nextUrl.pathname.startsWith('/api/token/search')) {
      // Check if session is valid for sensitive API routes
      if (!auth.sessionId) {
        return new NextResponse(
          JSON.stringify({ error: "Unauthorized: Invalid session" }),
          { 
            status: 401, 
            headers: { 
              ...Object.fromEntries(securityHeaders),
              'content-type': 'application/json' 
            } 
          }
        );
      }
    }
    
    // Return the next response with the security headers
    return NextResponse.next({
      headers: securityHeaders,
    });
  },
});

export const config = {
  matcher: [
    // Match all routes except static files and _next
    "/((?!.+\\.[\\w]+$|_next).*)",
    // Match API routes
    "/(api|trpc)(.*)",
    // Explicitly match application routes
    "/dashboard",
    "/dashboard/(.*)",
    "/ai-chat",
    "/ai-chat/(.*)",
    "/wallet",
    "/wallet/(.*)",
    "/settings",
    "/settings/(.*)",
    "/login",
    "/login/(.*)",
    "/signup",
    "/signup/(.*)"
  ],
};