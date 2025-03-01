import { getSolanaTools, EnhancedTokenInfo } from '../../lib/solana/tools';
import { solanaServiceV2 } from '../../lib/solana/v2';

/**
 * Get information about a token from its symbol or mint address
 * @param tokenIdOrSymbol Token symbol or mint address
 * @returns Promise with token information
 */
export async function getTokenInfo(tokenIdOrSymbol: string): Promise<EnhancedTokenInfo> {
  try {
    const solanaTools = getSolanaTools();
    return await solanaTools.getTokenInfo(tokenIdOrSymbol);
  } catch (error) {
    console.error(`Error fetching token info for ${tokenIdOrSymbol}:`, error);
    
    // Fallback to basic token info
    return {
      symbol: tokenIdOrSymbol.toUpperCase(),
      name: `Unknown ${tokenIdOrSymbol}`,
      mintAddress: tokenIdOrSymbol.length > 30 ? tokenIdOrSymbol : 'unknown',
      decimals: 9,
      price: 0
    };
  }
}

/**
 * Get wallet balances
 * @param walletAddress Optional wallet address (uses connected wallet if not provided)
 * @returns Promise with wallet balances
 */
export async function getWalletBalances(walletAddress?: string) {
  try {
    if (walletAddress) {
      await solanaServiceV2.connectWallet(walletAddress);
    }
    
    return await solanaServiceV2.getWalletBalances();
  } catch (error) {
    console.error('Error fetching wallet balances:', error);
    return [];
  }
}

/**
 * Get transaction history
 * @param walletAddress Optional wallet address (uses connected wallet if not provided)
 * @returns Promise with transaction history
 */
export async function getTransactionHistory(walletAddress?: string) {
  try {
    if (walletAddress) {
      await solanaServiceV2.connectWallet(walletAddress);
    }
    
    return await solanaServiceV2.getTransactionHistory();
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return [];
  }
}

/**
 * Connect to a wallet
 * @param publicKey Wallet public key
 * @returns Promise with connection result
 */
export async function connectWallet(publicKey: string) {
  try {
    return await solanaServiceV2.connectWallet(publicKey);
  } catch (error) {
    console.error('Error connecting wallet:', error);
    return { success: false, address: null };
  }
}

/**
 * Disconnect from wallet
 * @returns Promise with disconnect result
 */
export async function disconnectWallet() {
  try {
    return await solanaServiceV2.disconnectWallet();
  } catch (error) {
    console.error('Error disconnecting wallet:', error);
    return false;
  }
}

/**
 * Get Solana RPC health status
 * @returns Promise with health status
 */
export async function getSolanaHealth() {
  try {
    return await solanaServiceV2.getRpcHealth();
  } catch (error) {
    console.error('Error checking Solana health:', error);
    return 'error';
  }
}