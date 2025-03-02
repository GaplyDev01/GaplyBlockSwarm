# Middleware.io Integration Guide

This document explains how the Middleware.io observability platform has been integrated into the BlockSwarms Trade XBT application.

## Overview

Middleware.io provides comprehensive observability with distributed tracing, logs, and metrics. The integration allows you to:

1. Track application performance
2. Monitor API endpoints and service health
3. Collect and analyze logs in a centralized location
4. Create custom traces for business-critical operations

## Configuration

### Environment Variables

The following environment variable must be added to your Vercel project:

```
MIDDLEWARE_ACCESS_TOKEN=your-middleware-access-token
```

Get this token from your Middleware.io dashboard.

### Integration Components

The following components have been integrated:

1. **instrumentation.ts** - Main configuration for Middleware.io APM
2. **next.config.js** - Added `instrumentationHook: true` to enable instrumentation
3. **PinoLogger** - Enhanced to send logs to Middleware.io
4. **API Test Endpoint** - `/api/traces` for testing trace functionality

## Features Added

### Automatic Tracing

All HTTP requests and API routes are automatically traced, including:
- Request duration
- Response status
- API endpoints called
- Database operations

### Structured Logging

Logs now flow to both the local console and Middleware.io with:
- Log level (info, warn, error, debug)
- Module context
- Structured metadata
- Correlation with traces

### Custom Spans

The `withCustomSpan` utility allows you to create custom spans for performance tracking:

```typescript
import { withCustomSpan } from '../../instrumentation';

// Usage example
const result = await withCustomSpan('operation-name', async () => {
  // Your code here
  return result;
}, { customAttribute: 'value' });
```

### Log Helpers

Helper functions for standardized logging:

```typescript
import { logInfo, logWarning, logError, logDebug } from '../../instrumentation';

// Usage examples
logInfo('Operation completed', { userId: '123' });
logWarning('Resource usage high', { memoryUsage: 85 });
logError('Operation failed', { errorCode: 500 });
```

## Testing the Integration

1. Start the application locally: `pnpm run dev`
2. Visit: `http://localhost:3000/api/traces`
3. Check your Middleware.io dashboard for the generated traces and logs

## Dashboard Access

Access your traces and logs in the Middleware.io dashboard:

1. Login to [app.middleware.io](https://app.middleware.io/)
2. Navigate to "Services" > "gaply-blockswarm"
3. View traces, logs, and performance metrics

## Troubleshooting

If traces or logs are not appearing:

1. Verify the `MIDDLEWARE_ACCESS_TOKEN` is correctly set
2. Check that the service name matches what's configured in the dashboard
3. Ensure the application is deployed with the latest changes
4. Check Vercel logs for any initialization errors

For additional help, consult the [Middleware.io Documentation](https://docs.middleware.io/)
