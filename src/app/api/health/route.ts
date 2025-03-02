import { NextResponse } from 'next/server';

// Force dynamic for debugging deployment
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

/**
 * GET /api/health
 * Health check endpoint for monitoring the application status
 */
export async function GET() {
  try {
    // Enhanced health check with more diagnostic information
    const healthInfo = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      deployment: {
        platform: 'vercel',
        region: process.env.VERCEL_REGION || 'unknown',
        url: process.env.VERCEL_URL || 'unknown',
      },
      runtime: {
        node: process.versions ? process.versions.node : 'unknown',
      },
      debug: {
        middleware: 'simplified',
        caching: 'reduced',
        webpack: 'minimal',
        buildTime: new Date().toISOString(),
      },
      routes: {
        home: '/',
        dashboard: '/dashboard',
        login: '/login',
        aiChat: '/ai-chat',
      }
    };
    
    return NextResponse.json(healthInfo, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Service unavailable',
        timestamp: new Date().toISOString(),
        error: String(error)
      }, 
      { status: 503 }
    );
  }
}

/**
 * HEAD /api/health
 * Lightweight health check for monitoring systems
 */
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}