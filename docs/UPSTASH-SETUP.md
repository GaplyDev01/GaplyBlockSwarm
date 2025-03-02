# Upstash Database Integration

This project uses Upstash for two database needs:

1. **Redis KV (Key-Value) Store**: For caching, session management, and general storage
2. **Vector Database**: For similarity search and vector embeddings storage

## Integration Points

The database clients are located in:
- `src/shared/db/kv.ts` - Redis KV store implementation
- `src/shared/db/vector.ts` - Vector database implementation
- `src/shared/db/index.ts` - Centralized exports

## Environment Variables

The following environment variables must be set in your Vercel deployment and local environment:

### Redis KV Store
```
KV_URL=rediss://default:password@hostname.upstash.io:6379
KV_REST_API_URL=https://hostname.upstash.io
KV_REST_API_TOKEN=your-api-token
KV_REST_API_READ_ONLY_TOKEN=your-read-only-token
```

### Vector Database
```
UPSTASH_VECTOR_REST_URL=https://instance-name-region-vector.upstash.io
UPSTASH_VECTOR_REST_TOKEN=your-vector-api-token
UPSTASH_VECTOR_REST_READONLY_TOKEN=your-vector-read-only-token
```

## Testing the Integration

A test endpoint is available at `/api/db-test` to verify the connections:

- Test both databases: `/api/db-test?type=all`
- Test Redis KV only: `/api/db-test?type=kv`
- Test Vector DB only: `/api/db-test?type=vector`

## Example Usage

### Redis KV Store

```typescript
import { kv } from '@/src/shared/db';

// Store a value
await kv.set('user:123', { name: 'Alice', role: 'admin' });

// Retrieve a value
const user = await kv.get('user:123');

// Store with expiration (TTL in seconds)
await kv.set('session:abc', { userId: '123' }, 3600); // Expires in 1 hour

// Work with lists
await kv.push('notifications:123', { message: 'New message' });
const notifications = await kv.getList('notifications:123');

// Work with hashes
await kv.hset('user:profile:123', 'email', 'alice@example.com');
const email = await kv.hget('user:profile:123', 'email');
const profile = await kv.hgetall('user:profile:123');
```

### Vector Database

```typescript
import { vectorStore } from '@/src/shared/db';

// Create an index (if not exists)
await vectorStore.createIndex('documents', 1536); // 1536 dimensions for OpenAI embeddings

// Store document embeddings
await vectorStore.upsert('documents', [
  {
    id: 'doc1',
    vector: [0.1, 0.2, ...], // Your embedding vector
    metadata: {
      title: 'Sample Document',
      content: 'This is the document content',
      tags: ['sample', 'document']
    }
  }
]);

// Search for similar documents
const results = await vectorStore.query(
  'documents',
  [0.1, 0.2, ...], // Query vector
  {
    topK: 5,
    includeMetadata: true,
    filter: { tags: 'sample' } // Optional metadata filtering
  }
);

// Get index statistics
const stats = await vectorStore.stats('documents');
```

## Recommendations

1. **Connection Reuse**: The database clients implement a singleton pattern to reuse connections.
2. **Error Handling**: All operations have built-in error handling and will return null/false on failure.
3. **Observability**: All operations are logged and can be traced in the Middleware.io dashboard.
4. **Security**: Use read-only tokens for read operations in client-side code.

## Limitations

1. **Vector Dimensions**: Once an index is created with a specific dimension, it cannot be changed.
2. **Query Performance**: Vector search performance decreases with larger indices. Use metadata filtering to narrow searches.
3. **Rate Limits**: Be aware of Upstash plan limits for production usage.
