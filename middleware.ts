import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

/**
 * BlockSwarms wallet-based authentication middleware
 * Handles security headers and demo mode access
 */
export default function middleware(req: NextRequest) {
  // Create security headers
  const securityHeaders = new Headers();
  securityHeaders.set('X-Content-Type-Options', 'nosniff');
  securityHeaders.set('X-Frame-Options', 'DENY');
  securityHeaders.set('X-XSS-Protection', '1; mode=block');
  securityHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  securityHeaders.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Set CSP headers for production
  if (process.env.NODE_ENV === 'production') {
    securityHeaders.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.vercel.app; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://api.blockswarms.xyz https://*.solana.com wss://*.solana.com https://solana-mainnet.g.alchemy.com https://*.vercel.app; worker-src 'self' blob:;"
    );
  }

  // Publicly accessible routes
  const publicPaths = [
    "/",
    "/login",
    "/api/webhook",
    "/api/public",
    "/api/health",
    "/api/status",
    "/api/token/search", 
    "/api/ai/chat",
    "/solana-v2-demo",
    "/_next",
    "/favicon.ico",
    "/images",
  ];

  // Check if current path is public
  const isPublicPath = publicPaths.some(path => 
    req.nextUrl.pathname === path || 
    req.nextUrl.pathname.startsWith(path + "/")
  );

  if (isPublicPath) {
    // Allow public paths
    return NextResponse.next({
      headers: securityHeaders,
    });
  }

  // Check for demo mode which bypasses authentication
  const url = new URL(req.url);
  const demoMode = url.searchParams.get('demo') === 'true';
  
  if (demoMode) {
    // In demo mode, allow access to all routes
    console.log('Demo mode enabled, allowing access to:', req.nextUrl.pathname);
    return NextResponse.next({
      headers: securityHeaders,
    });
  }

  // Check for wallet connection by examining cookies
  // This is a simple example - in production, you'd use proper token validation
  const hasWalletConnection = req.cookies.has('wallet_connected') || req.cookies.has('blockswarms-storage');
  const urlHasWalletParam = url.searchParams.has('wallet');
  
  if (hasWalletConnection || urlHasWalletParam) {
    // Wallet is connected, allow access
    return NextResponse.next({
      headers: securityHeaders,
    });
  }

  // No wallet connection, redirect to login page with return URL
  const loginUrl = new URL('/login', req.url);
  loginUrl.searchParams.set('redirect_url', req.url);
  
  return NextResponse.redirect(loginUrl, {
    headers: securityHeaders,
  });
}

export const config = {
  matcher: [
    // Match all routes except static files and _next
    "/((?!.+\\.[\\w]+$|_next).*)",
    // Match API routes
    "/(api|trpc)(.*)",
    // Explicitly match application routes we want to protect
    "/dashboard",
    "/dashboard/(.*)",
    "/ai-chat",
    "/ai-chat/(.*)",
    "/wallet",
    "/wallet/(.*)",
    "/settings",
    "/settings/(.*)"
  ],
};