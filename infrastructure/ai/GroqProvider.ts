import { BaseAIProvider } from '../../core/ai/BaseAIProvider';
import { Message } from '../../core/ai/interfaces/IAIProvider';

interface GroqOptions {
  model: string;
  apiKey?: string;
  systemPrompt?: string;
}

/**
 * Implementation of the Groq provider for LLMs
 */
export class GroqProvider extends BaseAIProvider {
  private readonly model: string;
  private readonly apiKey: string;
  private readonly systemPrompt: string;
  
  constructor(options: GroqOptions) {
    super('groq');
    this.model = options.model || 'llama3-70b-8192';
    this.apiKey = options.apiKey || process.env.GROQ_API_KEY || '';
    this.systemPrompt = options.systemPrompt || this.getDefaultSystemPrompt();
  }
  
  /**
   * Generate a chat completion using Groq API
   */
  async generateChatCompletion(messages: Message[], options: any = {}): Promise<string> {
    try {
      const groqMessages = this.formatMessages(messages);
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: groqMessages,
          max_tokens: options.maxTokens || 2048,
          temperature: options.temperature || 0.7,
          stream: false
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Groq API error: ${error.error?.message || 'Unknown error'}`);
      }
      
      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error generating chat completion with Groq:', error);
      throw error;
    }
  }
  
  /**
   * Generate a streaming chat completion using Groq API
   */
  async generateStreamingChatCompletion(
    messages: Message[],
    onChunk: (chunk: any) => void,
    options: any = {}
  ): Promise<void> {
    try {
      const groqMessages = this.formatMessages(messages);
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: groqMessages,
          max_tokens: options.maxTokens || 2048,
          temperature: options.temperature || 0.7,
          stream: true
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Groq API streaming error: ${error.error?.message || 'Unknown error'}`);
      }
      
      if (!response.body) {
        throw new Error('Response body is null');
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let streamBuffer = '';
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }
          
          // Decode the chunk and add to buffer
          streamBuffer += decoder.decode(value, { stream: true });
          
          // Process the buffer for complete server-sent events
          const lines = streamBuffer.split('\n\n');
          streamBuffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.trim() === 'data: [DONE]') {
              continue;
            }
            
            if (line.startsWith('data: ')) {
              try {
                const jsonData = JSON.parse(line.slice(6));
                
                if (jsonData.choices && jsonData.choices[0]?.delta?.content) {
                  onChunk({
                    id: jsonData.id,
                    content: jsonData.choices[0].delta.content,
                    isComplete: false
                  });
                }
              } catch (err) {
                console.error('Error parsing SSE chunk:', err);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
      
    } catch (error) {
      console.error('Error streaming chat completion with Groq:', error);
      throw error;
    }
  }
  
  /**
   * Format messages for the Groq API
   */
  private formatMessages(messages: Message[]): any[] {
    const formattedMessages = [];
    
    // Add system message if not present
    if (this.systemPrompt && !messages.some(m => m.role === 'system')) {
      formattedMessages.push({
        role: 'system',
        content: this.systemPrompt
      });
    }
    
    // Add the rest of the messages
    messages.forEach(message => {
      formattedMessages.push({
        role: message.role,
        content: message.content
      });
    });
    
    return formattedMessages;
  }
  
  /**
   * Get the default system prompt
   */
  private getDefaultSystemPrompt(): string {
    return `You are a helpful assistant specialized in blockchain technologies, particularly Solana. 
You provide clear, factual information in a concise and easy-to-understand manner. 
When responding to questions about cryptocurrency, always acknowledge the volatile nature of crypto markets and avoid making financial predictions.
For technical questions, provide accurate and helpful explanations while considering the user's technical level.`;
  }
}