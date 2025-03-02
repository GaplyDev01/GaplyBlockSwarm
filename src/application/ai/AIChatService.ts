// Import from relative paths with complete paths
import { 
  AIMessage, 
  AITool,
  Message
} from '../../core/ai/interfaces/IAIProvider';

// Define local types
interface ChatCompletionOptions {
  messages: AIMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: AITool[];
  toolChoice?: any;
}

interface ChatCompletionResponse {
  id: string;
  model: string;
  content: string;
  finishReason: string;
  toolCalls?: any[];
  role?: string;
}

type StreamHandler = (event: any) => void;
import { AIProviderRegistry } from '../../core/ai/AIProviderRegistry';
import { ILogger } from '../../shared/utils/logger/ILogger';

// Alias types to use imported interfaces
type CompletionOpts = ChatCompletionOptions;
type CompletionResp = ChatCompletionResponse;
type StreamEventHandler = StreamHandler;

// Helper function to generate random ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// Import SolanaTool
import { SolanaTool } from '../../infrastructure/ai/tools/SolanaTools';

// Import the actual ISolanaService interface to ensure type compatibility
import { ISolanaService as CoreISolanaService } from '../../core/blockchain/solana/ISolanaService';

/**
 * Chat history interface
 */
// Export the interface for use by other modules
export interface ChatHistory {
  id: string;
  name: string;
  messages: AIMessage[];
  createdAt: number;
  updatedAt: number;
  modelProvider?: string;
  modelName?: string;
  userId?: string; // User ID for persistence
}

/**
 * Options for creating a chat completion
 */
export interface CompletionOptions {
  messages: AIMessage[];
  chatId?: string;
  provider?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  tools?: AITool[];
  toolChoice?: 'auto' | 'required' | 'none' | { type: 'function'; function: { name: string } };
}

/**
 * Tool handler function type
 */
export type ToolHandler = (name: string, args: any) => Promise<any>;

/**
 * AIChatService class for handling AI chat interactions
 */
export class AIChatService {
  private registry: AIProviderRegistry;
  private logger: ILogger;
  private chatHistories: Map<string, ChatHistory> = new Map();
  private solanaTools?: SolanaTool;
  private toolHandlers: Map<string, ToolHandler> = new Map();
  
  /**
   * Create a new AIChatService
   * @param registry AIProviderRegistry instance
   * @param logger Logger instance
   * @param solanaService Optional Solana service for blockchain integration
   */
  // Constructor moved down for organization

  constructor(registry: AIProviderRegistry, logger: ILogger, solanaService?: Partial<CoreISolanaService>) {
    this.registry = registry;
    this.logger = logger;
    
    try {
      // Initialize Solana tools if service is provided
      if (solanaService) {
        // Use a type assertion to handle the partial implementation
        this.solanaTools = new SolanaTool(solanaService as CoreISolanaService);
        
        // Register Solana tool handlers for methods that exist
        const solanaHandler: ToolHandler = async (name, args) => {
          if (this.solanaTools) {
            if (typeof this.solanaTools.handleToolCall === 'function') {
              return await this.solanaTools.handleToolCall(name, args);
            }
          }
          return { error: 'Tool handler not available' };
        };
        
        // Register handlers for all Solana tools if available
        if (this.solanaTools && typeof this.solanaTools.getAllTools === 'function') {
          const solanaToolFunctions = this.solanaTools.getAllTools();
          for (const tool of solanaToolFunctions) {
            if (tool.function && tool.function.name) {
              this.toolHandlers.set(tool.function.name, solanaHandler);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to initialize Solana tools:', error);
    }
  }
  
  /**
   * Register a custom tool handler
   * @param toolName Tool name
   * @param handler Tool handler function
   */
  registerToolHandler(toolName: string, handler: ToolHandler): void {
    this.toolHandlers.set(toolName, handler);
  }
  
  /**
   * Get available tools
   * @returns Array of AI tools
   */
  getAvailableTools(): AITool[] {
    const tools: AITool[] = [];
    
    // Add Solana tools if available
    if (this.solanaTools) {
      try {
        // Check if solanaTools has a getAllTools method
        if (typeof this.solanaTools.getAllTools === 'function') {
          const solanaTools = this.solanaTools.getAllTools();
          if (Array.isArray(solanaTools)) {
            tools.push(...solanaTools);
          }
        } 
        // Fallback to manually getting tools if available
        else if (typeof this.solanaTools.getWalletTools === 'function' &&
                 typeof this.solanaTools.getTradingTools === 'function') {
          const walletTools = this.solanaTools.getWalletTools();
          const tradingTools = this.solanaTools.getTradingTools();
          
          if (Array.isArray(walletTools)) {
            tools.push(...walletTools);
          }
          
          if (Array.isArray(tradingTools)) {
            tools.push(...tradingTools);
          }
        }
      } catch (error) {
        console.error('Error getting Solana tools:', error);
      }
    }
    
    return tools;
  }
  
  /**
   * Handle tool calls from AI response
   * @param toolCalls Tool calls from AI response
   * @returns Results of tool calls
   */
  private async handleToolCalls(toolCalls: any[]): Promise<any[]> {
    if (!toolCalls || toolCalls.length === 0) {
      return [];
    }
    
    const results = [];
    
    for (const call of toolCalls) {
      try {
        const { name } = call.function;
        const args = JSON.parse(call.function.arguments || '{}');
        
        // Find handler for this tool
        const handler = this.toolHandlers.get(name);
        
        if (!handler) {
          throw new Error(`No handler registered for tool: ${name}`);
        }
        
        // Execute the tool call
        const result = await handler(name, args);
        results.push({
          tool: name,
          result,
        });
      } catch (error) {
        this.logger.error(`Error executing tool call`, error);
        results.push({
          tool: call.function?.name || 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    return results;
  }
  
  /**
   * Create a new chat
   * @param name Chat name
   * @param initialMessage Optional initial system message
   * @param userId Optional user ID for persistence
   * @returns Chat history
   */
  createChat(name: string, initialMessage?: string, userId?: string): ChatHistory {
    const id = generateId();
    const now = Date.now();
    
    const messages: AIMessage[] = [];
    if (initialMessage) {
      messages.push({
        role: 'system',
        content: initialMessage,
      });
    }
    
    const chat: ChatHistory = {
      id,
      name,
      messages,
      createdAt: now,
      updatedAt: now,
      userId,
    };
    
    this.chatHistories.set(id, chat);
    this.logger.info(`Created new chat: ${id} (${name})`);
    
    return chat;
  }
  
  /**
   * Get a chat by ID
   * @param chatId Chat ID
   * @returns Chat history
   */
  getChat(chatId: string): ChatHistory | null {
    return this.chatHistories.get(chatId) || null;
  }
  
  // Already defined later in the file

  /**
   * Delete a chat
   * @param chatId Chat ID
   * @returns Success status
   */
  deleteChat(chatId: string): boolean {
    const result = this.chatHistories.delete(chatId);
    if (result) {
      this.logger.info(`Deleted chat: ${chatId}`);
    }
    return result;
  }
  
  /**
   * Add a message to a chat
   * @param chatId Chat ID
   * @param message Message to add
   * @returns Updated chat history
   */
  addMessage(chatId: string, message: AIMessage): ChatHistory | null {
    const chat = this.chatHistories.get(chatId);
    if (!chat) return null;
    
    chat.messages.push(message);
    chat.updatedAt = Date.now();
    
    this.chatHistories.set(chatId, chat);
    return chat;
  }
  
  /**
   * Get completion from AI model
   * @param options Completion options
   * @returns Chat completion response
   */
  async getCompletion(options: CompletionOptions): Promise<ChatCompletionResponse> {
    const { 
      messages, 
      chatId, 
      provider, 
      model, 
      temperature, 
      maxTokens,
      tools,
      toolChoice
    } = options;
    
    try {
      // Use static methods from AIProviderRegistry to get the provider
      const aiProvider = provider 
        ? AIProviderRegistry.getProvider(provider)
        : AIProviderRegistry.getDefaultProvider();
        
      // Safety check - make sure we have a valid provider
      if (!aiProvider) {
        throw new Error(`No AI provider available${provider ? ` for ${provider}` : ''}`);
      }
      
      // Determine which tools to include
      const availableTools = tools || this.getAvailableTools();
      
      // Check if tools should be included based on provider capability
      const finalTools = (typeof aiProvider.supportsTools === "function" && (typeof aiProvider.supportsTools === "function" && aiProvider.supportsTools())) ? availableTools : undefined;
      
      // Create completion options
      const completionOptions: ChatCompletionOptions = {
        messages,
        model,
        temperature,
        maxTokens,
        tools: finalTools,
        toolChoice,
      };
      
      // Get completion from provider with safe type handling
      const completion = typeof aiProvider.generateChatCompletion === 'function'
        ? await aiProvider.generateChatCompletion(completionOptions)
        : { id: 'mock', model: 'unknown', content: 'Error: Provider not available', finishReason: 'error' };
      
      // Handle any tool calls in the response
      if (completion.toolCalls && completion.toolCalls.length > 0) {
        const toolResults = await this.handleToolCalls(completion?.toolCalls || []);
        
        // Add tool results as assistant message
        const toolResultsContent = `Tool results:\n${JSON.stringify(toolResults, null, 2)}`;
        
        // If chatId is provided, add tool results to chat history
        if (chatId) {
          this.addMessage(chatId, {
            role: 'assistant',
            content: toolResultsContent,
          });
        }
        
        // Append tool results to the completion content
        completion.content += `\n\n${toolResultsContent}`;
      }
      
      // If chatId is provided, add the response to the chat history
      if (chatId) {
        const chat = this.chatHistories.get(chatId);
        if (chat) {
          // Add user message if not already in history
          if (messages.length > 0 && messages[messages.length - 1]?.role === 'user') {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage && (
                chat.messages.length === 0 || 
                (chat.messages[chat.messages.length - 1]?.content !== lastMessage.content)
            )) {
              chat.messages.push(lastMessage);
            }
          }
          
          // Add assistant response (if not already added as part of tool results)
          if (!completion.toolCalls || completion.toolCalls.length === 0) {
            chat.messages.push({
              role: 'assistant',
              content: completion.content,
            });
          }
          
          // Update chat metadata
          chat.updatedAt = Date.now();
          chat.modelProvider = aiProvider.getName();
          chat.modelName = completion.model;
          
          this.chatHistories.set(chatId, chat);
        }
      }
      
      return completion;
    } catch (error) {
      this.logger.error('Error getting AI completion', error);
      throw error;
    }
  }
  
  /**
   * Get streaming completion from AI model
   * @param options Completion options
   * @param onEvent Stream event handler
   */
  async getStreamingCompletion(
    options: CompletionOptions,
    onEvent: (event: any) => void
  ): Promise<void> {
    const { 
      messages, 
      chatId, 
      provider, 
      model, 
      temperature, 
      maxTokens,
      tools,
      toolChoice
    } = options;
    
    try {
      // Use static methods from AIProviderRegistry to get the provider
      const aiProvider = provider 
        ? AIProviderRegistry.getProvider(provider)
        : AIProviderRegistry.getDefaultProvider();
        
      // Safety check - make sure we have a valid provider
      if (!aiProvider) {
        throw new Error(`No AI provider available${provider ? ` for ${provider}` : ''}`);
      }
      
      // Determine which tools to include
      const availableTools = tools || this.getAvailableTools();
      
      // Check if tools should be included based on provider capability
      const finalTools = (typeof aiProvider.supportsTools === "function" && (typeof aiProvider.supportsTools === "function" && aiProvider.supportsTools())) ? availableTools : undefined;
      
      // Create completion options (without stream property)
      const completionOptions: ChatCompletionOptions = {
        messages,
        model,
        temperature,
        maxTokens,
        tools: finalTools,
        toolChoice,
      };
      
      // Variables for accumulating the response
      let fullContent = '';
      let toolCalls: any[] = [];
      
      // Wrap the event handler to accumulate the complete response
      const wrappedHandler = async (event: any) => {
        // Add to the full content if there's content in the event
        if (event.content) {
          fullContent += event.content;
        }
        
        // Collect tool calls
        if (event.toolCalls && event.toolCalls.length > 0) {
          toolCalls = event.toolCalls;
        }
        
        // Check if the stream is complete
        if (event.isComplete) {
          // Handle any tool calls
          if (toolCalls.length > 0) {
            const toolResults = await this.handleToolCalls(toolCalls);
            
            // Add tool results as a separate event
            onEvent({
              content: `\n\nTool results:\n${JSON.stringify(toolResults, null, 2)}`,
              isComplete: false,
            });
            
            // Add tool results as assistant message
            const toolResultsContent = `Tool results:\n${JSON.stringify(toolResults, null, 2)}`;
            
            // If chatId is provided, add tool results to chat history
            if (chatId) {
              this.addMessage(chatId, {
                role: 'assistant',
                content: toolResultsContent,
              });
            }
            
            // Append tool results to the full content
            fullContent += `\n\n${toolResultsContent}`;
          }
          
          // If chatId is provided, add the response to the chat history
          if (chatId) {
            const chat = this.chatHistories.get(chatId);
            if (chat) {
              // Add user message if not already in history
              if (messages.length > 0 && messages[messages.length - 1]?.role === 'user') {
                const lastMessage = messages[messages.length - 1];
                if (lastMessage && (
                    chat.messages.length === 0 || 
                    (chat.messages[chat.messages.length - 1]?.content !== lastMessage.content)
                )) {
                  chat.messages.push(lastMessage);
                }
              }
              
              // Add assistant response (if not already added as part of tool results)
              if (!toolCalls || toolCalls.length === 0) {
                chat.messages.push({
                  role: 'assistant',
                  content: fullContent,
                });
              }
              
              // Update chat metadata
              chat.updatedAt = Date.now();
              chat.modelProvider = aiProvider.getName();
              chat.modelName = event.model || (typeof aiProvider.getDefaultModel === 'function' 
                                ? aiProvider.getDefaultModel() 
                                : 'unknown');
              
              this.chatHistories.set(chatId, chat);
            }
          }
          
          // Send final complete event
          onEvent({
            ...event,
            content: '',
            isComplete: true,
          });
        } else {
          // Forward the event
          onEvent(event);
        }
      };
      
      // Get streaming completion from provider with safe type handling
      if (typeof aiProvider.generateStreamingChatCompletion === 'function') {
        await aiProvider.generateStreamingChatCompletion(completionOptions, wrappedHandler);
      } else {
        // Fallback if streaming not supported
        wrappedHandler({ 
          content: "Streaming not supported by this provider", 
          isComplete: true 
        });
      }
    } catch (error) {
      this.logger.error('Error getting streaming AI completion', error);
      throw error;
    }
  }
  
  /**
   * Get available models from a provider
   * @param provider Provider name
   * @returns Array of model names
   */
  async getAvailableModels(provider?: string): Promise<string[]> {
    try {
      // Use static methods from AIProviderRegistry to get the provider
      const aiProvider = provider 
        ? AIProviderRegistry.getProvider(provider)
        : AIProviderRegistry.getDefaultProvider();
        
      // Safety check - make sure we have a valid provider
      if (!aiProvider) {
        throw new Error(`No AI provider available${provider ? ` for ${provider}` : ''}`);
      }
        
      // Check if the method exists and call it
      return typeof aiProvider.getAvailableModels === 'function' 
        ? await aiProvider.getAvailableModels() 
        : [];
    } catch (error) {
      this.logger.error('Error getting available models', error);
      return [];
    }
  }
  
  /**
   * Get available providers
   * @returns Array of provider names
   */
  getAvailableProviders(): string[] {
    // Get providers from registry instance
    const providers = this.registry.getAvailableProviders();
    return providers;
  }
  
  /**
   * Rename a chat
   * @param chatId Chat ID
   * @param name New name
   * @returns Updated chat history
   */
  renameChat(chatId: string, name: string): ChatHistory | null {
    const chat = this.chatHistories.get(chatId);
    if (!chat) return null;
    
    chat.name = name;
    chat.updatedAt = Date.now();
    
    this.chatHistories.set(chatId, chat);
    return chat;
  }
  
  /**
   * Get token count for messages
   * @param messages Messages to count
   * @param provider Provider name
   * @returns Token count
   */
  async getTokenCount(messages: AIMessage[], provider?: string): Promise<number> {
    try {
      // Use static methods from AIProviderRegistry to get the provider
      const aiProvider = provider 
        ? AIProviderRegistry.getProvider(provider)
        : AIProviderRegistry.getDefaultProvider();
        
      // Safety check - make sure we have a valid provider
      if (!aiProvider) {
        throw new Error(`No AI provider available${provider ? ` for ${provider}` : ''}`);
      }
        
      // Check if method exists and call it safely
      if (typeof aiProvider.getTokenCount === 'function') {
        return await aiProvider.getTokenCount(messages);
      }
      
      // Fallback token counting if method not available
      const totalChars = messages.reduce((sum, msg) => sum + msg.content.length, 0);
      return Math.ceil(totalChars / 4);
    } catch (error) {
      this.logger.error('Error getting token count', error);
      
      // Fallback to very rough estimate: 1 token ≈ 4 characters
      const totalChars = messages.reduce((sum, msg) => sum + msg.content.length, 0);
      return Math.ceil(totalChars / 4);
    }
  }
  
  /**
   * Get context window size for a model
   * @param provider Provider name
   * @param model Model name
   * @returns Context window size
   */
  getContextWindowSize(provider?: string, model?: string): number {
    try {
      // Use static methods from AIProviderRegistry to get the provider
      const aiProvider = provider 
        ? AIProviderRegistry.getProvider(provider)
        : AIProviderRegistry.getDefaultProvider();
        
      // Safety check - make sure we have a valid provider
      if (!aiProvider) {
        throw new Error(`No AI provider available${provider ? ` for ${provider}` : ''}`);
      }
        
      if (typeof aiProvider.getContextWindowSize === 'function') {
        return aiProvider.getContextWindowSize(model);
      }
      return 4096; // Fallback to a safe default
    } catch (error) {
      this.logger.error('Error getting context window size', error);
      return 4096; // Fallback to a conservative default
    }
  }
  
  /**
   * Import chats from persistent storage
   * @param chats Array of chat histories
   */
  importChats(chats: ChatHistory[]): void {
    for (const chat of chats) {
      this.chatHistories.set(chat.id, chat);
    }
    this.logger.info(`Imported ${chats.length} chats from storage`);
  }
  
  /**
   * Get all chats
   * @param userId Optional user ID to filter by
   * @returns Array of chat histories
   */
  getAllChats(userId?: string): ChatHistory[] {
    const chats = Array.from(this.chatHistories.values());
    
    if (userId) {
      return chats.filter(chat => chat.userId === userId);
    }
    
    return chats;
  }
  
  /**
   * Export chats for persistence
   * @param userId Optional user ID to filter by
   * @returns Array of chat histories
   */
  exportChats(userId?: string): ChatHistory[] {
    return this.getAllChats(userId);
  }
}