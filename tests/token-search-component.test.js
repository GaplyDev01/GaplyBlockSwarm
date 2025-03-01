/**
 * Token Search Component Test
 * 
 * This is a client-side test script that should be run in the browser console
 * when viewing the dashboard page. It will test the TokenSearch component directly.
 */

// Copy and paste this test into your browser console while on the dashboard page

console.log('🧪 Starting TokenSearch Component Tests');
console.log('======================================');

// Utility function to wait for a specific amount of time
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test the token search component functionality
async function testTokenSearchComponent() {
  try {
    // Find the token search input
    const searchInput = document.querySelector('input[placeholder="Search for Solana tokens..."]');
    
    if (!searchInput) {
      throw new Error('Token search input not found on the page');
    }
    
    console.log('✅ Found token search input element');
    
    // Test 1: Search for a common token
    console.log('\n📝 Test 1: Searching for "sol"');
    
    // Simulate typing "sol" in the search box
    searchInput.value = 'sol';
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    searchInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Wait for search results
    console.log('Waiting for search results...');
    await wait(1500); // Wait for debounce and API request
    
    // Check for search results container
    const resultsContainer = document.querySelector('.absolute.z-50.mt-1.w-full.max-h-96.overflow-auto');
    
    if (!resultsContainer) {
      console.log('❌ Results container not visible');
    } else {
      console.log('✅ Results container is visible');
      
      // Check for token items
      const tokenItems = resultsContainer.querySelectorAll('div[class*="px-4 py-2 hover:bg-muted cursor-pointer"]');
      console.log(`Found ${tokenItems.length} token results`);
      
      if (tokenItems.length > 0) {
        // Log the first token
        const firstTokenName = tokenItems[0].querySelector('.font-bold.text-foreground').textContent;
        const firstTokenSymbol = tokenItems[0].querySelector('.text-muted-foreground').textContent;
        console.log(`✅ First result: ${firstTokenName} (${firstTokenSymbol})`);
      } else {
        console.log('⚠️ No token results found for "sol"');
      }
    }
    
    // Test 2: Clear the search
    console.log('\n📝 Test 2: Clearing the search');
    
    // Find and click the clear button
    const clearButton = document.querySelector('button[class*="absolute inset-y-0 right-0"]');
    
    if (clearButton) {
      clearButton.click();
      console.log('✅ Clicked clear button');
      
      // Check if input was cleared
      await wait(300);
      console.log(`Input value after clear: "${searchInput.value}"`);
      
      if (searchInput.value === '') {
        console.log('✅ Search input was successfully cleared');
      } else {
        console.log('❌ Search input was not cleared');
      }
      
      // Check if results were hidden
      const resultsAfterClear = document.querySelector('.absolute.z-50.mt-1.w-full.max-h-96.overflow-auto');
      if (!resultsAfterClear) {
        console.log('✅ Results container was hidden after clearing');
      } else {
        console.log('❌ Results container still visible after clearing');
      }
    } else {
      console.log('❌ Clear button not found');
    }
    
    // Test 3: Search for a less common token
    console.log('\n📝 Test 3: Searching for a specific token "jup"');
    
    // Simulate typing "jup" in the search box
    searchInput.value = 'jup';
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    searchInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Wait for search results
    console.log('Waiting for search results...');
    await wait(1500); // Wait for debounce and API request
    
    // Check for search results container again
    const resultsContainerJup = document.querySelector('.absolute.z-50.mt-1.w-full.max-h-96.overflow-auto');
    
    if (!resultsContainerJup) {
      console.log('❌ Results container not visible for "jup" search');
    } else {
      console.log('✅ Results container is visible for "jup" search');
      
      // Check for token items
      const tokenItemsJup = resultsContainerJup.querySelectorAll('div[class*="px-4 py-2 hover:bg-muted cursor-pointer"]');
      console.log(`Found ${tokenItemsJup.length} token results for "jup"`);
      
      if (tokenItemsJup.length > 0) {
        // Try to find Jupiter specifically
        let foundJupiter = false;
        
        for (const item of tokenItemsJup) {
          const name = item.querySelector('.font-bold.text-foreground').textContent;
          const symbol = item.querySelector('.text-muted-foreground').textContent;
          
          if (name.toLowerCase().includes('jupiter') || symbol.toLowerCase().includes('jup')) {
            console.log(`✅ Found Jupiter token: ${name} (${symbol})`);
            foundJupiter = true;
            
            // Test selecting the token
            console.log('\n📝 Test 4: Selecting a token');
            item.click();
            console.log('Clicked on Jupiter token');
            
            // Wait for token details to appear
            await wait(500);
            
            // Check if token details card was updated
            const tokenDetailsCard = document.querySelector('div.p-2 div.flex.items-center.mb-4');
            if (tokenDetailsCard) {
              const selectedTokenName = tokenDetailsCard.querySelector('h3.font-cyber').textContent;
              const selectedTokenSymbol = tokenDetailsCard.querySelector('div.text-xs.text-emerald-400\\/70').textContent;
              
              console.log(`Selected token details: ${selectedTokenName} (${selectedTokenSymbol})`);
              
              if (selectedTokenName.toLowerCase().includes('jupiter') || selectedTokenSymbol.toLowerCase().includes('jup')) {
                console.log('✅ Token selection worked correctly!');
              } else {
                console.log('❌ Token details don\'t match selected token');
              }
            } else {
              console.log('❌ Token details not found after selection');
            }
            
            break;
          }
        }
        
        if (!foundJupiter) {
          console.log('⚠️ Jupiter token not found in results');
        }
      } else {
        console.log('⚠️ No token results found for "jup"');
      }
    }
    
    console.log('\n🎉 All token search component tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testTokenSearchComponent();

// Instructions for manual test
console.log(`
📋 Manual Test Instructions:
---------------------------
1. Search for "sol" - You should see Solana in the results
2. Search for "jup" - You should see Jupiter in the results
3. Try clicking on a token - It should appear in the Token Details card
4. Try the X button to clear search - Results should disappear
5. Try searching for a non-existent token - You should see "No tokens found"
`);