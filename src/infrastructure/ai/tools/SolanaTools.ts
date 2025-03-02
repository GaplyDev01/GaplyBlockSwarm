import { AITool } from '../../../core/ai/interfaces/IAIProvider';
import { ISolanaService } from '../../../core/blockchain/solana/ISolanaService';

/**
 * Solana tools factory for AI providers
 */
// Added missing tools interfaces to ensure compatibility
interface SolanaToolOptions {
  solanaService: ISolanaService;
}

export class SolanaTool {
  private solanaService: ISolanaService;

  /**
   * Create a new SolanaTools instance
   * @param solanaService Solana service
   */
  constructor(solanaService: ISolanaService) {
    this.solanaService = solanaService;
  }

  /**
   * Get wallet functions for AI tools
   */
  public getWalletTools(): AITool[] {
    return [
      {
        type: 'function',
        function: {
          name: 'connectWallet',
          description: 'Connect to a Solana wallet',
          parameters: {
            type: 'object',
            properties: {
              publicKey: {
                type: 'string',
                description: 'Optional public key to connect to',
              },
            },
            required: [],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'disconnectWallet',
          description: 'Disconnect the current Solana wallet',
          parameters: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'getWalletBalances',
          description: 'Get balances for the connected Solana wallet',
          parameters: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
      },
    ];
  }

  /**
   * Get trading functions for AI tools
   */
  public getTradingTools(): AITool[] {
    return [
      {
        type: 'function',
        function: {
          name: 'getTokenList',
          description: 'Get list of tokens from the Solana ecosystem',
          parameters: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'executeTrade',
          description: 'Execute a trade (buy/sell) on Solana',
          parameters: {
            type: 'object',
            properties: {
              token: {
                type: 'string',
                description: 'Token symbol or address',
              },
              type: {
                type: 'string',
                enum: ['buy', 'sell'],
                description: 'Trade type',
              },
              amount: {
                type: 'number',
                description: 'Amount to trade',
              },
              price: {
                type: 'number',
                description: 'Price to trade at',
              },
            },
            required: ['token', 'type', 'amount', 'price'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'getTransactionHistory',
          description: 'Get transaction history for the connected wallet',
          parameters: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
      },
    ];
  }

  /**
   * Get all Solana tools for AI
   */
  public getAllTools(): AITool[] {
    return [...this.getWalletTools(), ...this.getTradingTools()];
  }

  /**
   * Handle tool call
   * @param toolName Tool name
   * @param args Tool arguments
   * @returns Tool call result
   */
  public async handleToolCall(toolName: string, args: any): Promise<any> {
    try {
      // Ensure solanaService exists and methods are available
      if (!this.solanaService) {
        throw new Error('Solana service not initialized');
      }

      // Safely access methods with proper checks
      switch (toolName) {
        case 'connectWallet':
          if (typeof this.solanaService.connectWallet !== 'function') {
            throw new Error('connectWallet method not available');
          }
          return await this.solanaService.connectWallet(args?.publicKey);

        case 'disconnectWallet':
          if (typeof this.solanaService.disconnectWallet !== 'function') {
            throw new Error('disconnectWallet method not available');
          }
          return await this.solanaService.disconnectWallet();

        case 'getWalletBalances':
          if (typeof this.solanaService.getWalletBalances !== 'function') {
            throw new Error('getWalletBalances method not available');
          }
          return await this.solanaService.getWalletBalances();

        case 'getTokenList':
          if (typeof this.solanaService.getTokenList !== 'function') {
            throw new Error('getTokenList method not available');
          }
          return await this.solanaService.getTokenList();

        case 'executeTrade':
          if (typeof this.solanaService.executeTrade !== 'function') {
            throw new Error('executeTrade method not available');
          }
          return await this.solanaService.executeTrade(
            args?.token,
            args?.type,
            args?.amount,
            args?.price
          );

        case 'getTransactionHistory':
          if (typeof this.solanaService.getTransactionHistory !== 'function') {
            throw new Error('getTransactionHistory method not available');
          }
          return await this.solanaService.getTransactionHistory();

        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      // Return error as part of the result for better handling
      return { error: error instanceof Error ? error.message : 'Unknown error in tool call' };
    }
  }
}