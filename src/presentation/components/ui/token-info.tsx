import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Skeleton } from "./skeleton"
import { formatCurrency, formatNumber, formatPercentage, getPriceChangeColor } from "@/src/shared/utils/utils"

export interface TokenInfoProps {
  token: {
    name: string
    symbol: string
    logoUrl: string
    price: number
    priceChange24h: number
    marketCap: number
    volume24h: number
    circulatingSupply: number
    totalSupply: number
    website?: string
    explorer?: string
  }
  isLoading?: boolean
}

export function TokenInfo({ token, isLoading = false }: TokenInfoProps) {
  if (isLoading) {
    return (    <Card className="w-full">    
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">    
        <div className="flex items-center space-x-2">    
        <Skeleton className="h-10 w-10 rounded-full" />    
        <div>    
        <Skeleton className="h-5 w-32" />    
        <Skeleton className="mt-1 h-4 w-24" />
            </div>
          </div>
        </CardHeader>    <CardContent>    
        <div className="grid gap-4">    
        <Skeleton className="h-8 w-28" />    
        <div className="grid grid-cols-2 gap-4">    
        <Skeleton className="h-20" />    
        <Skeleton className="h-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (    <Card className="w-full">    
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">    
        <div className="flex items-center space-x-2">
          {token.logoUrl ? (    <img
              src={token.logoUrl}
              alt={token.name}
              className="h-10 w-10 rounded-full"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.innerHTML = `<div class="h-10 w-10 rounded-full bg-sapphire-800 flex items-center justify-center text-emerald-400 font-semibold">${token.symbol.charAt(0)}</div>`;
              }}
            />
          ) : (    <div className="h-10 w-10 rounded-full bg-sapphire-800 flex items-center justify-center text-emerald-400 font-semibold">
              {token.symbol.charAt(0)}
            </div>
          )}    <div>    
        <CardTitle className="text-lg">{token.name}</CardTitle>    <p className="text-sm text-muted-foreground font-mono">{token.symbol}</p>
          </div>
        </div>    <div className="flex flex-col items-end">    
        <span className="text-xl font-semibold font-mono">
            {formatCurrency(token.price)}
          </span>    <span className={getPriceChangeColor(token.priceChange24h)}>
            {formatPercentage(token.priceChange24h)}
          </span>
        </div>
      </CardHeader>    <CardContent>    
        <div className="grid gap-4">    
        <h3 className="text-md font-cyber tracking-wide">Price Statistics</h3>    <div className="grid grid-cols-2 gap-4">    
        <div className="space-y-2">    
        <div className="flex justify-between">    
        <span className="text-muted-foreground">Market Cap</span>    <span className="font-mono">{formatCurrency(token.marketCap)}</span>
              </div>    <div className="flex justify-between">    
        <span className="text-muted-foreground">24h Volume</span>    <span className="font-mono">{formatCurrency(token.volume24h)}</span>
              </div>
            </div>    <div className="space-y-2">    
        <div className="flex justify-between">    
        <span className="text-muted-foreground">Circulating Supply</span>    <span className="font-mono">{formatNumber(token.circulatingSupply)}</span>
              </div>    <div className="flex justify-between">    
        <span className="text-muted-foreground">Total Supply</span>    <span className="font-mono">{formatNumber(token.totalSupply)}</span>
              </div>
            </div>
          </div>
          
          {(token.website || token.explorer) && (    <div className="mt-4 flex space-x-2">
              {token.website && (    <a
                  href={token.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-emerald-400 hover:text-emerald-300"
                >
                  Website
                </a>
              )}
              {token.explorer && (    <a
                  href={token.explorer}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-emerald-400 hover:text-emerald-300"
                >
                  Explorer
                </a>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}