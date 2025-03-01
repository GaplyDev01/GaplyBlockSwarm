import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { logger } from '@/lib/logger';
import { CoinGeckoToken, JupiterToken, Token, CoinGeckoApiResponse, JupiterApiResponse } from '@/lib/types/tokens';

// Interfaces are now imported from '@/lib/types/tokens'

export async function GET(request: NextRequest) {
  try {
    // Set CORS headers to ensure the API is accessible
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json'
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { headers, status: 200 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query')?.toLowerCase() || '';
    
    console.log('Token search API received query:', query);
    
    if (!query) {
      console.log('Empty query, returning empty array');
      return NextResponse.json([], { headers });
    }
    
    try {
      // Try the search API first (better for finding specific tokens by name)
      const searchApiUrl = `https://api.coingecko.com/api/v3/search`;
      const searchResponse = await axios.get(searchApiUrl, {
        params: {
          query: query
        },
        headers: {
          // Add API key header if using CoinGecko Pro API
          ...(process.env.COINGECKO_API_KEY ? { 'x-cg-pro-api-key': process.env.COINGECKO_API_KEY } : {})
        },
        timeout: 5000
      });
      
      // Extract coins section from search results
      const searchResults = searchResponse.data.coins || [];
      
      // Filter to only include Solana platform tokens
      const solanaTokens = searchResults.filter((token: CoinGeckoToken) => 
        token.platforms && 
        (token.platforms.solana || token.name.toLowerCase().includes('solana') || token.symbol.toLowerCase() === 'sol')
      );
      
      if (solanaTokens.length > 0) {
        // For search results, we need to get the full data for each token
        const tokenIds = solanaTokens.map((token: CoinGeckoToken) => token.id).join(',');
        
        // Get detailed data for these tokens
        const apiUrl = `https://api.coingecko.com/api/v3/coins/markets`;
        const detailResponse = await axios.get(apiUrl, {
          params: {
            vs_currency: 'usd',
            ids: tokenIds,
            per_page: 50,
            sparkline: false,
            price_change_percentage: '24h'
          },
          headers: {
            // Add API key header if using CoinGecko Pro API
            ...(process.env.COINGECKO_API_KEY ? { 'x-cg-pro-api-key': process.env.COINGECKO_API_KEY } : {})
          },
          timeout: 5000
        });
        
        const tokenDetails = detailResponse.data;
        console.log(`Found ${tokenDetails.length} matching tokens for query "${query}" via search API`);
        
        return NextResponse.json(tokenDetails, { headers });
      }
      
      // Fallback to the markets API with Solana category filter
      const apiUrl = `https://api.coingecko.com/api/v3/coins/markets`;
      const response = await axios.get(apiUrl, {
        params: {
          vs_currency: 'usd',
          category: 'solana-ecosystem',
          per_page: 100,
          page: 1,
          sparkline: false,
          price_change_percentage: '24h'
        },
        headers: {
          // Add API key header if using CoinGecko Pro API
          ...(process.env.COINGECKO_API_KEY ? { 'x-cg-pro-api-key': process.env.COINGECKO_API_KEY } : {})
        },
        timeout: 5000 // 5 second timeout
      });
      
      const allTokens = response.data;
      
      // Filter tokens based on the query
      const filteredTokens = allTokens.filter((token: CoinGeckoToken) => 
        token.name.toLowerCase().includes(query) || 
        token.symbol.toLowerCase().includes(query) ||
        token.id.toLowerCase().includes(query)
      );
      
      console.log(`Found ${filteredTokens.length} matching tokens for query "${query}" via markets API`);
      
      return NextResponse.json(filteredTokens, { headers });
    } catch (apiError) {
      console.error('Error fetching from CoinGecko API:', apiError);
      
      // Try with Jupiter API as fallback (Solana token list)
      try {
        const jupiterApiUrl = 'https://token.jup.ag/all';
        const jupiterResponse = await axios.get(jupiterApiUrl, { timeout: 5000 });
        const jupiterTokens = jupiterResponse.data;
        
        // Get specific tokens from the Jupiter API
        const filteredJupiterTokens = jupiterTokens
          .filter((token: JupiterToken): boolean => {
            const nameMatch = token.name && token.name.toLowerCase().includes(query);
            const symbolMatch = token.symbol && token.symbol.toLowerCase().includes(query);
            const addressMatch = token.address && token.address.toLowerCase().includes(query);
            const tagMatch = token.tags && Array.isArray(token.tags) && 
                             token.tags.some((tag: string) => tag.toLowerCase().includes(query));
            
            return Boolean(nameMatch || symbolMatch || addressMatch || tagMatch);
          })
          .map((token: JupiterToken): JupiterToken => {
            // Try to find a logo URL, defaulting to a placeholder if not found
            let logoUrl = token.logoURI;
            if (!logoUrl || logoUrl.includes('unknown')) {
              logoUrl = `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${token.address}/logo.png`;
            }
            
            return {
              id: token.address ?? '',
              symbol: token.symbol ?? '',
              name: token.name || token.symbol || 'Unknown Token',
              image: logoUrl,
              current_price: 0, // Price not available from Jupiter
              price_change_percentage_24h: 0, // Price change not available from Jupiter
              market_cap: 0,
              total_volume: 0,
              circulating_supply: 0,
              total_supply: 0,
              // Add Jupiter-specific metadata
              tags: token.tags || [],
              extensions: token.extensions || {},
              is_jupiter_token: true
            };
          })
          .slice(0, 20); // Limit to 20 results to avoid overwhelming the UI
        
        // For popular searches, add extra context about which API found them
        if (filteredJupiterTokens.length > 0) {
          console.log(`Found ${filteredJupiterTokens.length} matching tokens from Jupiter API for query "${query}"`);
          
          // For specific tokens that we know are missing from CoinGecko, add a searchNote
          if (query.toLowerCase() === 'symx' || query.toLowerCase() === 'sy') {
            console.log('Found specialized token search for known tokens');
            
            // Add a note to indicate these are tokens without price data
            filteredJupiterTokens.forEach((token: JupiterToken) => {
              if (token.symbol.toLowerCase().includes(query)) {
                token.searchNote = 'This token is not listed on CoinGecko, so price data is unavailable';
              }
            });
          }
          
          return NextResponse.json(filteredJupiterTokens, { headers });
        }
        
        // If Jupiter also had no results, return empty array
        console.log(`No matching tokens found in either API for query "${query}"`);
        return NextResponse.json([], { headers });
      } catch (jupiterError) {
        console.error('Error fetching from Jupiter API:', jupiterError);
        // Return empty array if both APIs fail
        return NextResponse.json([], { headers });
      }
    }
  } catch (error) {
    console.error('Error in token search API:', error);
    return NextResponse.json(
      { error: 'Failed to search tokens', details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}