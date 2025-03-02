import { NextRequest, NextResponse } from 'next/server';
import tracker from '@middleware.io/agent-apm-nextjs';
import { logInfo, logWarning, logError, withCustomSpan } from '../../../../instrumentation';

// Example API route that demonstrates middleware.io APM tracing
export async function GET(request: NextRequest) {
  // Create a sample trace
  return await withCustomSpan('api-traces-demo', async () => {
    try {
      // Log information
      logInfo('Traces API endpoint called', { 
        path: request.nextUrl.pathname,
        searchParams: Object.fromEntries(request.nextUrl.searchParams.entries()),
        timestamp: new Date().toISOString()
      });
      
      // Simulate some workload
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Create a child span for a specific operation
      const childSpan = tracker.startSpan('database-query-simulation');
      
      try {
        // Simulate database operation
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Add attributes to the span
        childSpan.setAttribute('db.operation', 'select');
        childSpan.setAttribute('db.collection', 'traces');
        childSpan.setAttribute('db.query.duration_ms', 100);
        
        // Log a successful operation
        logInfo('Database query completed successfully');
      } catch (error) {
        // Record any exceptions that occur during the operation
        childSpan.recordException(error as Error);
        childSpan.setStatus({ code: 2 }); // Error status
        throw error;
      } finally {
        // Always end the span
        childSpan.end();
      }
      
      // Sample a warning log
      if (Math.random() > 0.7) {
        logWarning('Occasional warning for demo purposes', { 
          randomValue: Math.random(),
          source: 'traces-api'
        });
      }
      
      // Return a successful response
      return NextResponse.json({
        status: 'success',
        message: 'Traces API endpoint called successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Log errors
      logError('Error in traces API endpoint', { 
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Return an error response
      return NextResponse.json({
        status: 'error',
        message: 'An error occurred in the traces API endpoint',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  });
}