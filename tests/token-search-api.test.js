/**
 * Token Search API Test
 * Tests the token search API endpoints with real API calls
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001'; // Adjust if your dev server is on a different port

async function testTokenSearchAPI() {
  console.log('🧪 Starting Token Search API Tests');
  console.log('==================================');
  
  // Test 1: Search for a common token (SOL)
  try {
    console.log('Test 1: Searching for "sol"');
    const response = await axios.get(`${BASE_URL}/api/token/search?query=sol`);
    
    if (response.status !== 200) {
      throw new Error(`API returned status code ${response.status}`);
    }
    
    if (!Array.isArray(response.data)) {
      throw new Error(`API did not return an array, got: ${typeof response.data}`);
    }
    
    console.log(`✅ API returned ${response.data.length} results`);
    
    if (response.data.length > 0) {
      const firstResult = response.data[0];
      console.log(`   First result: ${firstResult.name} (${firstResult.symbol})`);
      
      // Verify the result has all required properties
      const requiredProps = ['id', 'name', 'symbol', 'image', 'current_price', 'price_change_percentage_24h'];
      const missingProps = requiredProps.filter(prop => !(prop in firstResult));
      
      if (missingProps.length > 0) {
        console.warn(`⚠️ Missing properties in result: ${missingProps.join(', ')}`);
      } else {
        console.log('   ✅ Result contains all required properties');
      }
    } else {
      console.warn('⚠️ No results found for "sol", this is unexpected');
    }
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
  }
  
  // Test 2: Search for a less common token
  try {
    console.log('\nTest 2: Searching for "jup"');
    const response = await axios.get(`${BASE_URL}/api/token/search?query=jup`);
    
    if (response.status !== 200) {
      throw new Error(`API returned status code ${response.status}`);
    }
    
    console.log(`✅ API returned ${response.data.length} results`);
    
    if (response.data.length > 0) {
      const jupiterResult = response.data.find(token => 
        token.symbol.toLowerCase() === 'jup' || 
        token.name.toLowerCase().includes('jupiter')
      );
      
      if (jupiterResult) {
        console.log(`   Found Jupiter: ${jupiterResult.name} (${jupiterResult.symbol})`);
        console.log(`   Current price: $${jupiterResult.current_price}`);
      } else {
        console.warn('⚠️ No specific Jupiter token found in results');
      }
    } else {
      console.warn('⚠️ No results found for "jup"');
    }
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
  }
  
  // Test 3: Search for a non-existent token
  try {
    console.log('\nTest 3: Searching for a nonsense token "xyzabc123"');
    const response = await axios.get(`${BASE_URL}/api/token/search?query=xyzabc123`);
    
    if (response.status !== 200) {
      throw new Error(`API returned status code ${response.status}`);
    }
    
    if (!Array.isArray(response.data)) {
      throw new Error(`API did not return an array for invalid search`);
    }
    
    if (response.data.length === 0) {
      console.log('✅ API correctly returned empty array for nonsense search');
    } else {
      console.warn(`⚠️ API returned ${response.data.length} results for nonsense search, expected 0`);
    }
  } catch (error) {
    console.error('❌ Test 3 failed:', error.message);
  }
  
  // Test 4: Empty search query
  try {
    console.log('\nTest 4: Empty search query');
    const response = await axios.get(`${BASE_URL}/api/token/search?query=`);
    
    if (response.status !== 200) {
      throw new Error(`API returned status code ${response.status}`);
    }
    
    if (!Array.isArray(response.data)) {
      throw new Error(`API did not return an array for empty search`);
    }
    
    if (response.data.length === 0) {
      console.log('✅ API correctly returned empty array for empty search');
    } else {
      console.warn(`⚠️ API returned ${response.data.length} results for empty search, expected 0`);
    }
  } catch (error) {
    console.error('❌ Test 4 failed:', error.message);
  }
  
  console.log('\n==================================');
  console.log('🏁 Token Search API Tests Completed');
}

// Run the tests
testTokenSearchAPI().catch(error => {
  console.error('Error running tests:', error);
});