import { 
  AIMessage, 
  AITool,
  ChatCompletionOptions,
  ChatCompletionResponse,
  StreamHandler
} from '../../core/ai/interfaces/IAIProvider';
import { AIProviderRegistry } from '../../core/ai/AIProviderRegistry';
import { ILogger } from '../../shared/utils/logger/ILogger';
import { generateId } from '../../shared/utils/helpers';
import { SolanaTools } from '../../infrastructure/ai/tools/SolanaTools';
import { ISolanaService } from '../../core/blockchain/solana/ISolanaService';

/**
 * Chat history interface
 */
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
  private solanaTools?: SolanaTools;
  private toolHandlers: Map<string, ToolHandler> = new Map();
  
  /**
   * Create a new AIChatService
   * @param registry AIProviderRegistry instance
   * @param logger Logger instance
   * @param solanaService Optional Solana service for blockchain integration
   */
  constructor(registry: AIProviderRegistry, logger: ILogger, solanaService?: ISolanaService) {
    this.registry = registry;
    this.logger = logger.child({ module: 'AIChatService' });
    
    // Initialize Solana tools if service is provided
    if (solanaService) {
      this.solanaTools = new SolanaTools(solanaService);
      
      // Register Solana tool handlers
      const solanaHandler: ToolHandler = async (name, args) => {
        return await this.solanaTools!.handleToolCall(name, args);
      };
      
      // Register handlers for all Solana tools
      const solanaTools = this.solanaTools.getAllTools();
      for (const tool of solanaTools) {
        this.toolHandlers.set(tool.function.name, solanaHandler);
      }
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
      tools.push(...this.solanaTools.getAllTools());
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
      // Get the specified provider or default
      const aiProvider = provider 
        ? this.registry.getProvider(provider)
        : this.registry.getDefaultProvider();
      
      // Determine which tools to include
      const availableTools = tools || this.getAvailableTools();
      
      // Check if tools should be included based on provider capability
      const finalTools = aiProvider.supportsTools() ? availableTools : undefined;
      
      // Create completion options
      const completionOptions: ChatCompletionOptions = {
        messages,
        model,
        temperature,
        maxTokens,
        tools: finalTools,
        toolChoice,
      };
      
      // Get completion from provider
      const completion = await aiProvider.createChatCompletion(completionOptions);
      
      // Handle any tool calls in the response
      if (completion.toolCalls && completion.toolCalls.length > 0) {
        const toolResults = await this.handleToolCalls(completion.toolCalls);
        
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
          if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
            const lastMessage = messages[messages.length - 1];
            if (chat.messages.length === 0 || 
                chat.messages[chat.messages.length - 1].content !== lastMessage.content) {
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
    onEvent: StreamHandler
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
      // Get the specified provider or default
      const aiProvider = provider 
        ? this.registry.getProvider(provider)
        : this.registry.getDefaultProvider();
      
      // Determine which tools to include
      const availableTools = tools || this.getAvailableTools();
      
      // Check if tools should be included based on provider capability
      const finalTools = aiProvider.supportsTools() ? availableTools : undefined;
      
      // Create completion options
      const completionOptions: ChatCompletionOptions = {
        messages,
        model,
        temperature,
        maxTokens,
        stream: true,
        tools: finalTools,
        toolChoice,
      };
      
      // Variables for accumulating the response
      let fullContent = '';
      let toolCalls: any[] = [];
      
      // Wrap the event handler to accumulate the complete response
      const wrappedHandler: StreamHandler = async (event) => {
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
              if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
                const lastMessage = messages[messages.length - 1];
                if (chat.messages.length === 0 || 
                    chat.messages[chat.messages.length - 1].content !== lastMessage.content) {
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
              chat.modelName = event.model || aiProvider.getDefaultModel();
              
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
      
      // Get streaming completion from provider
      await aiProvider.createStreamingChatCompletion(completionOptions, wrappedHandler);
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
      const aiProvider = provider 
        ? this.registry.getProvider(provider)
        : this.registry.getDefaultProvider();
        
      return await aiProvider.getAvailableModels();
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
    return this.registry.getAvailableProviders();
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
      const aiProvider = provider 
        ? this.registry.getProvider(provider)
        : this.registry.getDefaultProvider();
        
      return await aiProvider.getTokenCount(messages);
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
      const aiProvider = provider 
        ? this.registry.getProvider(provider)
        : this.registry.getDefaultProvider();
        
      return aiProvider.getContextWindowSize(model);
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
   * Export chats for persistence
   * @param userId Optional user ID to filter by
   * @returns Array of chat histories
   */
  exportChats(userId?: string): ChatHistory[] {
    return this.getAllChats(userId);
  }
}