import React from 'react';
import { TokenInfo as TokenInfoType } from '@/lib/solana/types';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { ExternalLink, MessageSquare } from 'lucide-react';
import Link from 'next/link';

// Handle formatting functions we need
const formatCurrency = (value: number): string => {
  if (!value && value !== 0) return 'N/A';
  
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  } else if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`;
  } else {
    return `$${value.toFixed(2)}`;
  }
};

const formatNumber = (value: number): string => {
  if (!value && value !== 0) return 'N/A';
  
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  } else if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  } else if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  } else {
    return `${value.toFixed(2)}`;
  }
};

const getPriceChangeColor = (change: number): string => {
  return change >= 0 ? 'text-green-400' : 'text-red-400';
};

interface TokenDetailsCardProps {
  token: TokenInfoType | null;
  isLoading?: boolean;
  className?: string;
}

export function TokenDetailsCard({ token, isLoading = false, className = '' }: TokenDetailsCardProps) {
  if (isLoading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-sapphire-800/80 animate-pulse mr-2"></div>
            <div className="h-6 w-32 bg-sapphire-800/80 animate-pulse rounded"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-8 w-24 bg-sapphire-800/80 animate-pulse rounded"></div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-sapphire-800/80 animate-pulse rounded"></div>
              <div className="h-4 w-full bg-sapphire-800/80 animate-pulse rounded"></div>
              <div className="h-4 w-3/4 bg-sapphire-800/80 animate-pulse rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!token) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader className="pb-2">
          <CardTitle>Token Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-emerald-400/70 mb-2">Search and select a token to view details</p>
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-emerald-400/30 flex items-center justify-center text-emerald-400/40">
              <MessageSquare size={24} />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Create chat URL with token info - ensure we use the correct path
  const chatUrl = `/ai-chat?token=${encodeURIComponent(token.symbol)}&mint=${encodeURIComponent(token.mint)}`;

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-sapphire-800 mr-2 overflow-hidden flex items-center justify-center">
            {token.logoURI ? (
              <img 
                src={token.logoURI} 
                alt={token.symbol} 
                className="h-full w-full object-cover"
                onError={(e) => {
                  // If image fails to load, show first letter as fallback
                  (e.target as HTMLImageElement).style.display = 'none';
                  e.currentTarget.parentElement!.innerText = token.symbol.charAt(0);
                }}
              />
            ) : (
              <span className="font-semibold text-emerald-400">{token.symbol.charAt(0)}</span>
            )}
          </div>
          <span>{token.name}</span>
        </CardTitle>
        <div className="flex items-center text-xs">
          <a 
            href={`https://solscan.io/token/${token.mint}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-emerald-400/70 hover:text-emerald-400 mr-2"
          >
            <ExternalLink size={12} className="mr-1" />
            Explorer
          </a>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-end">
              <div className="text-2xl font-mono font-semibold">
                ${token.price.toFixed(token.price < 0.01 ? 8 : 2)}
              </div>
              <div className={`${getPriceChangeColor(token.change24h)} text-sm`}>
                {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
              </div>
            </div>
            <div className="text-xs text-emerald-400/70 mt-1">
              Symbol: {token.symbol}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-emerald-400/50 mb-1">Market Cap</div>
              <div className="font-mono">{formatCurrency(token.marketCap)}</div>
            </div>
            <div>
              <div className="text-emerald-400/50 mb-1">Volume (24h)</div>
              <div className="font-mono">{formatCurrency(token.volume24h)}</div>
            </div>
            <div>
              <div className="text-emerald-400/50 mb-1">Supply</div>
              <div className="font-mono">{formatNumber(token.supply)}</div>
            </div>
            <div>
              <div className="text-emerald-400/50 mb-1">Decimals</div>
              <div className="font-mono">{token.decimals}</div>
            </div>
          </div>
          
          <Link href={chatUrl} passHref className="w-full block mt-4">
            <Button variant="primary" className="w-full flex items-center justify-center">
              <MessageSquare size={16} className="mr-2" />
              Chat About {token.symbol}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}