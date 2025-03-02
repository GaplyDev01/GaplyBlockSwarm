'use client';

import { useState } from 'react';
import { getSolanaTools, TokenAnalytics, TradingSignal, SwapResult } from '@/lib/solana/tools';

export default function ToolTestPage() {
  const [tokenSymbol, setTokenSymbol] = useState('SOL');
  const [fromToken, setFromToken] = useState('SOL');
  const [toToken, setToToken] = useState('USDC');
  const [amount, setAmount] = useState(1);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<string>('');

  const handleTokenPriceClick = async () => {
    setLoading(true);
    setAction('Getting token price');
    try {
      const solanaTools = getSolanaTools();
      const tokenInfo = await solanaTools.getTokenInfo(tokenSymbol);
      setResult(tokenInfo);
    } catch (error) {
      setResult({ error: `Failed to get token price: ${error}` });
    } finally {
      setLoading(false);
    }
  };

  const handleTokenAnalyticsClick = async () => {
    setLoading(true);
    setAction('Getting token analytics');
    try {
      const solanaTools = getSolanaTools();
      const analytics = await solanaTools.getTokenAnalytics(tokenSymbol);
      setResult(analytics);
    } catch (error) {
      setResult({ error: `Failed to get token analytics: ${error}` });
    } finally {
      setLoading(false);
    }
  };

  const handleTradingSignalClick = async () => {
    setLoading(true);
    setAction('Getting trading signal');
    try {
      const solanaTools = getSolanaTools();
      const signal = await solanaTools.getTradingSignal(tokenSymbol);
      setResult(signal);
    } catch (error) {
      setResult({ error: `Failed to get trading signal: ${error}` });
    } finally {
      setLoading(false);
    }
  };

  const handleSwapSimulationClick = async () => {
    setLoading(true);
    setAction('Simulating token swap');
    try {
      const solanaTools = getSolanaTools();
      const swapResult = await solanaTools.swapTokens({
        fromToken,
        toToken,
        amount,
        slippageBps: 50,
      }, false);
      setResult(swapResult);
    } catch (error) {
      setResult({ error: `Failed to simulate swap: ${error}` });
    } finally {
      setLoading(false);
    }
  };

  const handleTopTokensClick = async () => {
    setLoading(true);
    setAction('Getting top tokens');
    try {
      const solanaTools = getSolanaTools();
      const tokens = await solanaTools.getTopTokens(10);
      setResult(tokens);
    } catch (error) {
      setResult({ error: `Failed to get top tokens: ${error}` });
    } finally {
      setLoading(false);
    }
  };

  return (    <div className="container mx-auto p-8 bg-sapphire-900 min-h-screen text-white">    
        <h1 className="text-3xl font-bold mb-8 text-emerald-400">Solana Tools Test</h1>    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">    
        <div className="bg-sapphire-800 border border-emerald-400/30 rounded-lg p-6">    
        <h2 className="text-xl font-bold mb-4 text-emerald-400">Tool Actions</h2>    <div className="space-y-6">    
        <div>    
        <label className="block mb-2">Token Symbol or Mint</label>    <input 
                type="text" 
                value={tokenSymbol} 
                onChange={(e) => setTokenSymbol(e.target.value)} 
                className="w-full p-2 bg-sapphire-700 border border-emerald-400/30 rounded text-white"
              />
            </div>    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">    
        <button 
                onClick={handleTokenPriceClick} 
                className="bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 rounded"
                disabled={loading}
              >
                Get Token Price
              </button>    <button 
                onClick={handleTokenAnalyticsClick} 
                className="bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 rounded"
                disabled={loading}
              >
                Get Token Analytics
              </button>    <button 
                onClick={handleTradingSignalClick} 
                className="bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 rounded"
                disabled={loading}
              >
                Get Trading Signal
              </button>    <button 
                onClick={handleTopTokensClick} 
                className="bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 rounded"
                disabled={loading}
              >
                Get Top Tokens
              </button>
            </div>    <div className="border-t border-emerald-400/30 pt-6">    
        <h3 className="text-lg font-semibold mb-4">Swap Simulation</h3>    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">    
        <div>    
        <label className="block mb-2">From Token</label>    <input 
                    type="text" 
                    value={fromToken} 
                    onChange={(e) => setFromToken(e.target.value)} 
                    className="w-full p-2 bg-sapphire-700 border border-emerald-400/30 rounded text-white"
                  />
                </div>    <div>    
        <label className="block mb-2">To Token</label>    <input 
                    type="text" 
                    value={toToken} 
                    onChange={(e) => setToToken(e.target.value)} 
                    className="w-full p-2 bg-sapphire-700 border border-emerald-400/30 rounded text-white"
                  />
                </div>    <div>    
        <label className="block mb-2">Amount</label>    <input 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(Number(e.target.value))} 
                    className="w-full p-2 bg-sapphire-700 border border-emerald-400/30 rounded text-white"
                  />
                </div>    <div className="flex items-end">    
        <button 
                    onClick={handleSwapSimulationClick} 
                    className="w-full bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 rounded"
                    disabled={loading}
                  >
                    Simulate Swap
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>    <div className="bg-sapphire-800 border border-emerald-400/30 rounded-lg p-6">    
        <h2 className="text-xl font-bold mb-4 text-emerald-400">Results</h2>
          
          {loading ? (    <div className="flex items-center justify-center h-64">    
        <div className="flex flex-col items-center">    
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-400 mb-4"></div>    <p className="text-emerald-400">{action}...</p>
              </div>
            </div>
          ) : result ? (    <pre className="bg-sapphire-700 p-4 rounded-lg overflow-auto h-[500px] text-sm text-emerald-200">
              {JSON.stringify(result, null, 2)}
            </pre>
          ) : (    <div className="flex items-center justify-center h-64 text-emerald-400/50">    
        <p>Select an action to see results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}