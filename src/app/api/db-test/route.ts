import { NextRequest, NextResponse } from 'next/server';
import { withCustomSpan } from '../../../../instrumentation';
import { kv, vectorStore } from '@/src/shared/db';

// API route to test Upstash Redis and Vector DB connections
export async function GET(request: NextRequest) {
  try {
    // Get the test type from the request query
    const searchParams = request.nextUrl.searchParams;
    const testType = searchParams.get('type') || 'all';
    
    const results: Record<string, any> = {
      timestamp: new Date().toISOString(),
      success: true,
    };

    // Run tests inside a custom span for observability
    await withCustomSpan('db-connection-test', async () => {
      // Test Redis KV Store
      if (testType === 'kv' || testType === 'all') {
        const testKey = `test:${Date.now()}`;
        const testValue = { test: true, timestamp: Date.now() };
        
        // Set a test value
        const setResult = await kv.set(testKey, testValue);
        
        // Get the value back
        const getValue = await kv.get(testKey);
        
        // Delete the test key
        const deleteResult = await kv.del(testKey);
        
        // Store results
        results.kv = {
          setResult,
          getValue,
          deleteResult,
          connectionSuccess: setResult && getValue && deleteResult,
        };
      }
      
      // Test Vector Database
      if (testType === 'vector' || testType === 'all') {
        const indexName = 'test-index';
        const dimensions = 3; // Small dimensionality for testing
        
        // Create test index
        const createResult = await vectorStore.createIndex(indexName, dimensions);
        
        // Prepare test document
        const testDoc = {
          id: `test-doc-${Date.now()}`,
          vector: [0.1, 0.2, 0.3],
          metadata: {
            content: "This is a test document",
            timestamp: Date.now()
          }
        };
        
        // Insert test document
        const upsertResult = await vectorStore.upsert(indexName, [testDoc]);
        
        // Query for the document
        const queryResults = await vectorStore.query(indexName, [0.1, 0.2, 0.3], {
          topK: 1,
          includeMetadata: true
        });
        
        // Get stats
        const statsResult = await vectorStore.stats(indexName);
        
        // Delete test document
        const deleteResult = await vectorStore.delete(indexName, [testDoc.id]);
        
        // Store results
        results.vector = {
          createResult,
          upsertResult,
          queryResults,
          statsResult,
          deleteResult,
          connectionSuccess: createResult && upsertResult && queryResults.length > 0 && deleteResult,
        };
      }
    }, { testType });
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Database test error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}