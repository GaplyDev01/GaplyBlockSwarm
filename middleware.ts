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
    "/api/token/search", 
    "/api/ai/chat",  // Make AI chat endpoint publicly accessible
    "/dashboard",    // Making dashboard public for demo purposes
    "/ai-chat",      // Making AI chat page public for demo purposes
    "/login/(.*)",
    "/signup/(.*)",
    "/_next/(.*)",   // Allow Next.js assets
    "/favicon.ico",
    "/images/(.*)"
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
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.blockswarms.xyz https://*.clerk.accounts.dev https://mature-python-7.accounts.dev https://*.vercel.app https://*.clerk.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://api.blockswarms.xyz https://*.clerk.accounts.dev https://mature-python-7.accounts.dev https://api.clerk.dev https://*.clerk.com https://*.solana.com wss://*.solana.com https://solana-mainnet.g.alchemy.com https://*.vercel.app; frame-src https://mature-python-7.accounts.dev https://*.clerk.accounts.dev; worker-src 'self' blob:;"
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
      // Check if we're in demo mode (using query parameter demo=true)
      const url = new URL(req.url);
      const demoMode = url.searchParams.get('demo') === 'true';
      
      if (demoMode) {
        // In demo mode, allow access to protected routes without authentication
        console.log('Demo mode enabled, allowing access to protected route:', req.nextUrl.pathname);
        return NextResponse.next({
          headers: securityHeaders,
        });
      }
      
      // Normal authentication flow for non-demo mode
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
      // Check for demo mode
      const url = new URL(req.url);
      const demoMode = url.searchParams.get('demo') === 'true';
      
      // Check if session is valid for sensitive API routes (unless in demo mode)
      if (!auth.sessionId && !demoMode) {
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