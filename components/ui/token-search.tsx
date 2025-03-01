'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { getPriceChangeColor } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { Token, TokenInfo } from '@/lib/types/tokens';

// Token interface is now imported from '@/lib/types/tokens'

interface TokenSearchProps {
  onSelectToken: (token: Token) => void;
  onSelect?: (token: TokenInfo) => void; // Updated to use TokenInfo instead of any
  className?: string;
}

export function TokenSearch({ onSelectToken, onSelect, className = '' }: TokenSearchProps) {
  const [query, setQuery] = useState('');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Ref for managing search timeouts
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Search for tokens when query changes
  useEffect(() => {
    let mounted = true;
    
    // Clear any existing timeouts to prevent rapid API calls
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    async function searchTokens() {
      if (query.trim().length === 0) {
        setTokens([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        logger.info(`Searching for tokens with query: ${query}`);

        // Make fetch request timeout after 8 seconds (increased from 5)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        try {
          // Add cachebusting parameter to avoid cached responses
          const timestamp = new Date().getTime();
          const url = `/api/token/search?query=${encodeURIComponent(query)}&_=${timestamp}`;
          
          logger.info(`Fetching from URL: ${url}`);
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            },
            cache: 'no-store',
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
          
          if (!mounted) return;
          
          logger.info(`Search response status: ${response.status}, ok: ${response.ok}`);

          if (response.ok) {
            try {
              // Use response.json() directly instead of text() + parse
              const data = await response.json();
              
              if (!mounted) return;
              
              console.log(`Found ${Array.isArray(data) ? data.length : 0} tokens`);

              if (Array.isArray(data)) {
                setTokens(data);
              } else {
                console.warn('API returned invalid data format, expected array but got:', typeof data);
                setTokens([]);
              }
            } catch (jsonError) {
              logger.error('Error parsing JSON response:', jsonError);
              
              // Fallback to text in case of JSON parse error
              try {
                const responseText = await response.text();
                console.error('Raw response that failed to parse:', responseText);
              } catch (e) {} // Ignore text parsing errors
              
              if (!mounted) return;
              setTokens([]);
            }
          } else {
            // Get detailed error information
            try {
              const errorData = await response.json().catch(() => response.text());
              logger.error(`Error response from search API (${response.status}):`, errorData);
            } catch (textError) {
              logger.error(`Could not read error response: ${textError}`);
            }

            if (!mounted) return;
            logger.info('Search API error, no results available');
            setTokens([]);
          }
        } catch (fetchError) {
          logger.error('Fetch operation failed:', fetchError);
          // No fallback, just set empty tokens array
          logger.info('Fetch error, no results available');
          setTokens([]);
        }
      } catch (error) {
        logger.error('Error searching tokens:', error);
        // No fallback, set empty array
        setTokens([]);
      } finally {
        setLoading(false);
      }
    }

    searchTimeoutRef.current = setTimeout(searchTokens, 300);
    
    return () => {
      // Clean up by clearing timeout and marking component as unmounted
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      mounted = false;
    };
  }, [query]);

  // Handle click outside to close results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setFocused(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle token selection
  function handleSelectToken(token: Token) {
    if (onSelectToken) {
      onSelectToken(token);
    }
    
    // For backward compatibility with existing code
    if (onSelect) {
      // Map to the shape expected by the old component
      const tokenInfo: TokenInfo = {
        name: token.name,
        symbol: token.symbol,
        mint: token.id, // Use id as mint
        logoURI: token.image,
        price: token.current_price,
        change24h: token.price_change_percentage_24h,
        marketCap: 0, // These would need to be populated if present in the API response
        volume24h: 0,
        supply: 0,
        totalSupply: 0,
        decimals: 9
      };
      onSelect(tokenInfo);
    }
    
    setQuery('');
    setFocused(false);
  }

  // Clear search
  function clearSearch() {
    setQuery('');
    inputRef.current?.focus();
  }

  return (<div className={`relative w-full ${className}`}>    <div className="relative">    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">    <Search className="h-5 w-5 text-muted-foreground" />
        </div>    <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Search for Solana tokens..."
          className="px-10 py-3 bg-background text-foreground border border-input rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-primary"
        />

        {query && (    <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 flex items-center pr-3"
          >    <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      {focused && query.trim().length > 0 && (    <div
          ref={resultsRef}
          className="absolute z-50 mt-1 w-full max-h-96 overflow-auto bg-card border border-border rounded-lg shadow-xl"
        >
          {loading && (    <div className="py-4 px-3 text-center">    <div className="flex justify-center items-center space-x-2">    <div
                  className="h-2 w-2 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                ></div>    <div
                  className="h-2 w-2 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                ></div>    <div
                  className="h-2 w-2 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                ></div>
              </div>
            </div>
          )}

          {!loading && tokens.length === 0 && (    <div className="py-4 px-3 text-center text-muted-foreground">
              No tokens found. Try a different search term.
            </div>
          )}

          {!loading &&
            tokens.map(token => (    <div
                key={token.id}
                className="px-4 py-2 hover:bg-muted cursor-pointer border-b border-border last:border-b-0"
                onClick={() => handleSelectToken(token)}
              >    <div className="flex items-center">    <img src={token.image} alt={token.name} className="w-8 h-8 rounded-full mr-3" />    <div className="flex-1">    <div className="flex justify-between">    <div className="font-bold text-foreground">{token.name}</div>    <div className="font-mono text-foreground">
                        {token.current_price ? `$${token.current_price.toLocaleString()}` : "No price data"}
                      </div>
                    </div>    <div className="flex justify-between text-sm">    <div className="text-muted-foreground">{token.symbol.toUpperCase()}</div>
                      {token.price_change_percentage_24h !== undefined && token.price_change_percentage_24h !== null ? (    <div className={getPriceChangeColor(token.price_change_percentage_24h)}>
                          {token.price_change_percentage_24h > 0 ? '+' : ''}
                          {token.price_change_percentage_24h.toFixed(2)}%
                        </div>
                      ) : (    <div className="text-muted-foreground italic text-xs">
                          {token.is_jupiter_token ? "From Jupiter API" : "No change data"}
                        </div>
                      )}
                    </div>
                    {token.searchNote && (    <div className="mt-1 text-xs text-amber-400">{token.searchNote}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}