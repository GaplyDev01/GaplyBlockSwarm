import { Message } from '../../core/ai/interfaces/IAIProvider';

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Repository for storing chat history
 * This is a mock implementation using in-memory storage
 * In production, it would use a database
 */
export class DatabaseChatRepository {
  private chats: Map<string, Chat> = new Map();
  
  /**
   * Save a chat to the repository
   */
  async saveChat(chat: Chat): Promise<void> {
    this.chats.set(chat.id, {
      ...chat,
      updatedAt: new Date()
    });
  }
  
  /**
   * Get a chat by ID
   */
  async getChat(chatId: string): Promise<Chat | null> {
    return this.chats.get(chatId) || null;
  }
  
  /**
   * Get all chats
   */
  async getAllChats(): Promise<Chat[]> {
    return Array.from(this.chats.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
  
  /**
   * Delete a chat
   */
  async deleteChat(chatId: string): Promise<boolean> {
    return this.chats.delete(chatId);
  }
  
  /**
   * Add a message to a chat
   */
  async addMessageToChat(chatId: string, message: Message): Promise<boolean> {
    const chat = this.chats.get(chatId);
    
    if (!chat) {
      return false;
    }
    
    chat.messages.push(message);
    chat.updatedAt = new Date();
    
    this.chats.set(chatId, chat);
    return true;
  }
  
  /**
   * Update chat title
   */
  async updateChatTitle(chatId: string, title: string): Promise<boolean> {
    const chat = this.chats.get(chatId);
    
    if (!chat) {
      return false;
    }
    
    chat.title = title;
    chat.updatedAt = new Date();
    
    this.chats.set(chatId, chat);
    return true;
  }
}