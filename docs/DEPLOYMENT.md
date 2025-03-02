# Deployment Guide for BlockSwarms Trade XBT

This guide covers the essential configurations needed for a successful deployment of the platform with core features:
- AI Agent Integration
- Token Search Functionality
- MongoDB Database Connection
- Solana Blockchain Integration

## 1. Required Environment Variables

For your initial deployment to work properly with all core features, you must configure these environment variables in your Vercel project:

### Solana Integration
```
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```
Consider using a dedicated RPC provider like QuickNode, Alchemy, or Helius for production deployments.

### AI Integration (Claude)
```
ANTHROPIC_API_KEY=your-anthropic-api-key
ANTHROPIC_DEFAULT_MODEL=claude-3-sonnet-20240229
```

### MongoDB Database
```
MONGODB_URI=mongodb+srv://username:password@your-cluster.mongodb.net/blockswarms?retryWrites=true&w=majority
```
Make sure your MongoDB deployment allows connections from Vercel's IP ranges.

### Token Search API
```
COINGECKO_API_KEY=your-coingecko-api-key
```
The free tier may have rate limits. Consider a paid plan for production use.

## 2. Vercel Deployment Steps

1. **Create New Project**
   - Connect to your GitHub repository (GaplyDev01/GaplyBlockSwarm)
   - Vercel will automatically detect it as a Next.js project

2. **Configure Environment Variables**
   - Add all the required variables listed above
   - Add any optional variables from `.env.example` as needed

3. **Build Settings**
   - Build Command: `pnpm run build` (already configured in vercel.json)
   - Output Directory: `.next` (already configured)
   - Install Command: `pnpm install` (already configured)

4. **Deploy**
   - Click Deploy and Vercel will build and deploy your application

## 3. Post-Deployment Verification

After deployment, check these endpoints to verify each feature is working:

1. **Health Check**: Visit `/api/health` to see if the basic API is responding
2. **AI Chat**: Test the AI agent at `/ai-chat`
3. **Token Search**: Try searching for a token like "SOL" in the dashboard
4. **Wallet Connection**: Verify the wallet connection feature works

## 4. Production Optimization

For a production environment, consider:

1. **Solana RPC**: Use a dedicated RPC provider with higher rate limits
2. **Database Scaling**: Configure proper MongoDB connection pooling parameters
3. **API Keys Rotation**: Implement a secure strategy for API key rotation
4. **Monitoring**: Enable Vercel Analytics and consider adding Sentry

## 5. Troubleshooting

Common issues:

1. **AI API Failures**: Check rate limits and API key validity
2. **MongoDB Connection Issues**: Verify network access and authentication
3. **Solana RPC Errors**: Consider fallback RPC endpoints and rate limit handling
4. **Build Failures**: Check build logs for specific errors

## 6. Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Anthropic Claude Documentation](https://docs.anthropic.com/)
- [Solana Developer Documentation](https://docs.solana.com/)
