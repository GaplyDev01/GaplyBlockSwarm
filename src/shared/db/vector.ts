import { Upstash } from '@upstash/vector';
import { logInfo, logError } from '../../../instrumentation';

/**
 * Vector database client for similarity search and document embeddings
 */

let vectorClient: Upstash | null = null;

/**
 * Get the Vector database client instance
 * @returns Upstash Vector client
 */
export function getVectorClient(): Upstash {
  if (!vectorClient) {
    try {
      if (!process.env.UPSTASH_VECTOR_REST_URL || !process.env.UPSTASH_VECTOR_REST_TOKEN) {
        throw new Error('Upstash Vector credentials not found in environment variables');
      }

      vectorClient = new Upstash({
        url: process.env.UPSTASH_VECTOR_REST_URL,
        token: process.env.UPSTASH_VECTOR_REST_TOKEN,
      });
      
      logInfo('Vector database client initialized', { provider: 'upstash-vector' });
    } catch (error) {
      logError('Failed to initialize Vector database client', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }
  
  return vectorClient;
}

/**
 * Release the vector client (not typically needed)
 */
export function releaseVectorClient(): void {
  vectorClient = null;
  logInfo('Vector database client released', { provider: 'upstash-vector' });
}

/**
 * IndexDocument represents a document to be stored in the vector index
 */
export interface IndexDocument {
  id: string;
  vector: number[];
  metadata?: Record<string, any>;
}

/**
 * SearchResult represents a result from a vector search
 */
export interface SearchResult<T = any> {
  id: string;
  score: number;
  vector?: number[];
  metadata?: T;
}

/**
 * Vector store operations wrapper
 */
export const vectorStore = {
  /**
   * Create an index if it doesn't exist
   * @param indexName The name of the index
   * @param dimensions The vector dimensions (must match your embedding model)
   * @returns true if successful
   */
  createIndex: async (indexName: string, dimensions: number): Promise<boolean> => {
    try {
      const client = getVectorClient();
      await client.createIndex({ name: indexName, dimensions });
      logInfo('Vector index created', { indexName, dimensions });
      return true;
    } catch (error) {
      // Check if the error is because the index already exists
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('already exists')) {
        logInfo('Vector index already exists', { indexName });
        return true;
      }
      
      logError('Error creating vector index', { indexName, dimensions, error: errorMessage });
      return false;
    }
  },
  
  /**
   * Upsert documents into the vector index
   * @param indexName The name of the index
   * @param documents Array of documents to insert or update
   * @returns true if successful
   */
  upsert: async (indexName: string, documents: IndexDocument[]): Promise<boolean> => {
    try {
      const client = getVectorClient();
      const index = client.index(indexName);
      await index.upsert(documents);
      logInfo('Documents upserted to vector index', { indexName, count: documents.length });
      return true;
    } catch (error) {
      logError('Error upserting documents to vector index', { 
        indexName, 
        count: documents.length, 
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  },
  
  /**
   * Query the vector index for similar vectors
   * @param indexName The name of the index
   * @param vector The query vector
   * @param options Optional parameters like topK, includeMetadata, and includeVectors
   * @returns Array of search results
   */
  query: async <T = any>(
    indexName: string, 
    vector: number[], 
    options: { 
      topK?: number, 
      includeMetadata?: boolean, 
      includeVectors?: boolean,
      filter?: Record<string, any>
    } = {}
  ): Promise<SearchResult<T>[]> => {
    try {
      const client = getVectorClient();
      const index = client.index(indexName);
      
      const results = await index.query({
        vector,
        topK: options.topK || 10,
        includeMetadata: options.includeMetadata !== false,
        includeVectors: options.includeVectors || false,
        filter: options.filter,
      });
      
      logInfo('Vector query executed', { 
        indexName, 
        topK: options.topK || 10, 
        resultsCount: results.length 
      });
      
      return results as SearchResult<T>[];
    } catch (error) {
      logError('Error querying vector index', { 
        indexName, 
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  },
  
  /**
   * Delete documents from the vector index
   * @param indexName The name of the index
   * @param ids Array of document IDs to delete
   * @returns true if successful
   */
  delete: async (indexName: string, ids: string[]): Promise<boolean> => {
    try {
      const client = getVectorClient();
      const index = client.index(indexName);
      await index.delete(ids);
      logInfo('Documents deleted from vector index', { indexName, count: ids.length });
      return true;
    } catch (error) {
      logError('Error deleting documents from vector index', { 
        indexName, 
        ids,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  },
  
  /**
   * Reset an index by deleting all documents
   * @param indexName The name of the index
   * @returns true if successful
   */
  reset: async (indexName: string): Promise<boolean> => {
    try {
      const client = getVectorClient();
      const index = client.index(indexName);
      await index.reset();
      logInfo('Vector index reset', { indexName });
      return true;
    } catch (error) {
      logError('Error resetting vector index', { 
        indexName, 
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  },
  
  /**
   * Get information about an index
   * @param indexName The name of the index
   * @returns Index information or null if error
   */
  stats: async (indexName: string): Promise<{ dimensions: number; count: number } | null> => {
    try {
      const client = getVectorClient();
      const index = client.index(indexName);
      const stats = await index.stats();
      return stats;
    } catch (error) {
      logError('Error getting vector index stats', { 
        indexName, 
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }
};