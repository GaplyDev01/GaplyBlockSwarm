import { ChatHistory } from '../../application/ai/AIChatService';
import { ILogger } from '../../shared/utils/logger/ILogger';

/**
 * Interface for chat repository
 */
export interface IChatRepository {
  /**
   * Get chat by ID
   * @param id Chat ID
   */
  getById(id: string): Promise<ChatHistory | null>;
  
  /**
   * Get all chats for user
   * @param userId User ID
   */
  getByUserId(userId: string): Promise<ChatHistory[]>;
  
  /**
   * Save chat
   * @param chat Chat history to save
   */
  save(chat: ChatHistory): Promise<void>;
  
  /**
   * Save multiple chats
   * @param chats Chat histories to save
   */
  saveMany(chats: ChatHistory[]): Promise<void>;
  
  /**
   * Delete chat
   * @param id Chat ID
   */
  delete(id: string): Promise<boolean>;
  
  /**
   * Delete all chats for user
   * @param userId User ID
   */
  deleteByUserId(userId: string): Promise<boolean>;
}

/**
 * In-memory chat repository for development/testing
 */
export class InMemoryChatRepository implements IChatRepository {
  private chats: Map<string, ChatHistory> = new Map();
  private logger: ILogger;
  
  constructor(logger: ILogger) {
    // Safely create child logger if method exists
    this.logger = logger;
    if (logger && typeof logger.child === 'function') {
      try {
        this.logger = logger.child({ module: 'InMemoryChatRepository' });
      } catch (error) {
        // Fall back to original logger
        console.warn('Failed to create child logger');
      }
    }
  }
  
  async getById(id: string): Promise<ChatHistory | null> {
    const chat = this.chats.get(id) || null;
    return chat ? structuredClone(chat) : null;
  }
  
  async getByUserId(userId: string): Promise<ChatHistory[]> {
    const userChats = Array.from(this.chats.values())
      .filter(chat => chat.userId === userId);
      
    return structuredClone(userChats);
  }
  
  async save(chat: ChatHistory): Promise<void> {
    this.chats.set(chat.id, structuredClone(chat));
    this.logger.info(`Saved chat: ${chat.id}`);
  }
  
  async saveMany(chats: ChatHistory[]): Promise<void> {
    for (const chat of chats) {
      await this.save(chat);
    }
    this.logger.info(`Saved ${chats.length} chats`);
  }
  
  async delete(id: string): Promise<boolean> {
    const result = this.chats.delete(id);
    if (result) {
      this.logger.info(`Deleted chat: ${id}`);
    }
    return result;
  }
  
  async deleteByUserId(userId: string): Promise<boolean> {
    const chatIdsToDelete = Array.from(this.chats.values())
      .filter(chat => chat.userId === userId)
      .map(chat => chat.id);
      
    let success = true;
    for (const chatId of chatIdsToDelete) {
      const result = await this.delete(chatId);
      if (!result) success = false;
    }
    
    this.logger.info(`Deleted ${chatIdsToDelete.length} chats for user: ${userId}`);
    return success;
  }
}

/**
 * ChatRepository factory
 */
export class ChatRepositoryFactory {
  /**
   * Create a chat repository
   * @param type Repository type
   * @param logger Logger instance
   */
  static create(type: 'memory', logger: ILogger): IChatRepository {
    switch (type) {
      case 'memory':
        return new InMemoryChatRepository(logger);
      // Add other repository types here (e.g., Firebase, MongoDB)
      default:
        throw new Error(`Unsupported repository type: ${type}`);
    }
  }
}