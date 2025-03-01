import { NextResponse } from 'next/server';
import { solanaServiceV2 } from '@/lib/solana/v2';

/**
 * GET /api/health
 * Health check endpoint for monitoring the application status
 */
export async function GET() {
  try {
    // Base health object
    const health: Record<string, any> = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {}
    };

    // Check Solana RPC connection
    let solanaStatus = 'unknown';
    try {
      // Try to get the Solana RPC health status
      const rpcHealth = await solanaServiceV2.getRpcHealth();
      solanaStatus = rpcHealth || 'unknown';
      
      // Also fetch block height to ensure we have a real connection
      const blockHeight = await solanaServiceV2.getBlockHeight();
      health.services.solana = {
        status: solanaStatus,
        blockHeight,
        endpoint: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'default'
      };
    } catch (solanaError) {
      health.services.solana = {
        status: 'error',
        error: solanaError instanceof Error ? solanaError.message : 'Unknown Solana RPC error'
      };
      
      // If Solana is down, set overall status to degraded
      health.status = 'degraded';
    }
    
    // Check token list API
    try {
      // Just check if we can get a list of tokens, don't care about the results
      const tokens = await solanaServiceV2.getTokenList();
      health.services.tokenList = {
        status: 'ok',
        count: tokens.length
      };
    } catch (tokenError) {
      health.services.tokenList = {
        status: 'error',
        error: tokenError instanceof Error ? tokenError.message : 'Unknown token list error'
      };
      
      // Set to degraded if not already
      if (health.status === 'ok') {
        health.status = 'degraded';
      }
    }

    // In a production app, you would add more service checks:
    // - Database connection
    // - Redis cache
    // - External API dependencies
    
    // Return appropriate status code based on overall health
    const httpStatus = health.status === 'ok' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;
    
    return NextResponse.json(health, { status: httpStatus });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Service unavailable',
        error: error instanceof Error ? error.message : 'Unknown error',
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
  try {
    // Minimal check - just verify Solana RPC is responding
    await solanaServiceV2.getRpcHealth();
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    // If RPC is down, return 503
    return new NextResponse(null, { status: 503 });
  }
}