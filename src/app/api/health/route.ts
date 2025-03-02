import { NextResponse } from 'next/server';

/**
 * GET /api/health
 * Health check endpoint for monitoring the application status
 */
export async function GET() {
  try {
    // Simplified health object for initial deployment
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
    
    return NextResponse.json(health, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Service unavailable',
        timestamp: new Date().toISOString()
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