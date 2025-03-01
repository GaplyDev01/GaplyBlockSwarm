/**
 * Dashboard Data Fetching Test
 * Tests the token data fetching logic from the dashboard page
 */

const axios = require('axios');

// Function to simulate the token data fetching logic from the dashboard
async function fetchRealTokenData() {
  console.log('🧪 Testing Token Data Fetching');
  console.log('==============================');
  
  try {
    console.log('Attempting to fetch from CoinGecko API...');
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/coins/markets',
      {
        params: {
          vs_currency: 'usd',
          category: 'solana-ecosystem',
          order: 'market_cap_desc',
          per_page: 10,
          page: 1,
          sparkline: false,
          price_change_percentage: '24h'
        },
        timeout: 5000
      }
    );
    
    if (response.status !== 200) {
      throw new Error(`CoinGecko API returned status ${response.status}`);
    }
    
    const data = response.data;
    
    if (!Array.isArray(data)) {
      throw new Error('CoinGecko API did not return an array');
    }
    
    console.log(`✅ CoinGecko API returned ${data.length} tokens`);
    
    if (data.length > 0) {
      // Transform data to match dashboard format
      const transformedData = data.map(token => ({
        symbol: token.symbol.toUpperCase(),
        name: token.name,
        mint: token.id,
        decimals: 9,
        price: token.current_price,
        change24h: token.price_change_percentage_24h,
        volume24h: token.total_volume,
        marketCap: token.market_cap,
        supply: token.circulating_supply,
        totalSupply: token.total_supply,
        logoURI: token.image
      }));
      
      // Display the first token as an example
      const firstToken = transformedData[0];
      console.log('\nExample token data:');
      console.log(`- Name: ${firstToken.name} (${firstToken.symbol})`);
      console.log(`- Price: $${firstToken.price}`);
      console.log(`- 24h Change: ${firstToken.change24h}%`);
      console.log(`- Market Cap: $${firstToken.marketCap}`);
      
      console.log('\n✅ Successfully transformed CoinGecko data to dashboard format');
      return { source: 'coingecko', data: transformedData };
    } else {
      console.warn('⚠️ CoinGecko API returned no tokens, trying fallback...');
      throw new Error('No tokens returned from CoinGecko');
    }
  } catch (coinGeckoError) {
    console.error(`❌ CoinGecko API Error: ${coinGeckoError.message}`);
    console.log('Attempting fallback to Jupiter API...');
    
    try {
      const jupiterResponse = await axios.get('https://token.jup.ag/strict', {
        timeout: 5000
      });
      
      if (jupiterResponse.status !== 200) {
        throw new Error(`Jupiter API returned status ${jupiterResponse.status}`);
      }
      
      const jupiterData = jupiterResponse.data;
      
      if (!Array.isArray(jupiterData)) {
        throw new Error('Jupiter API did not return an array');
      }
      
      console.log(`✅ Jupiter API returned ${jupiterData.length} tokens`);
      
      // Filter for popular tokens
      const popularTokens = jupiterData
        .filter(token => token.tags && (token.tags.includes('popular') || token.tags.includes('top-tokens')))
        .slice(0, 10);
      
      console.log(`✅ Found ${popularTokens.length} popular tokens from Jupiter`);
      
      if (popularTokens.length > 0) {
        // Transform Jupiter data
        const transformedJupiterData = popularTokens.map(token => ({
          symbol: token.symbol,
          name: token.name,
          mint: token.address,
          decimals: token.decimals,
          price: 0, // Not available from Jupiter
          change24h: 0,
          volume24h: 0,
          marketCap: 0,
          supply: 0,
          logoURI: token.logoURI
        }));
        
        // Display the first token as an example
        const firstJupToken = transformedJupiterData[0];
        console.log('\nExample token data from Jupiter:');
        console.log(`- Name: ${firstJupToken.name} (${firstJupToken.symbol})`);
        console.log(`- Token Address: ${firstJupToken.mint}`);
        console.log(`- Logo URL: ${firstJupToken.logoURI}`);
        
        console.log('\n✅ Successfully transformed Jupiter data to dashboard format');
        return { source: 'jupiter', data: transformedJupiterData };
      } else {
        throw new Error('No popular tokens found in Jupiter API response');
      }
    } catch (jupiterError) {
      console.error(`❌ Jupiter API Error: ${jupiterError.message}`);
      console.error('❌ Both primary and fallback data sources failed');
      throw new Error('Failed to fetch token data from both sources');
    }
  }
}

// Run the test
fetchRealTokenData()
  .then(result => {
    console.log(`\n🎉 Test passed! Successfully fetched data from ${result.source}`);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error.message);
  });