import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { z } from 'zod';
// Use relative paths instead of aliases for Vercel
import { AIChatService } from '../../../../application/ai/AIChatService';
import { PinoLogger } from '../../../../lib/utils/logger';
import { AIProviderRegistry } from '../../../../core/ai/AIProviderRegistry';
import { AnthropicProvider } from '../../../../infrastructure/ai/AnthropicProvider';
import { GroqProvider } from '../../../../infrastructure/ai/GroqProvider';
import { 
  AIMessage, 
  AITool, 
  ChatCompletionStreamEvent, 
  StreamHandler,
  ChatCompletionOptions,
  ChatCompletionResponse
} from '../../../../src/core/ai/interfaces/IAIProvider';
// The solanaToolSchema import will be defined directly since it's causing issues
const solanaToolSchema: AITool[] = [
  {
    type: "function",
    function: {
      name: "get_token_price",
      description: "Get the current price and basic information for any Solana token on the blockchain.",
      parameters: {
        type: "object",
        properties: {
          token: {
            type: "string",
            description: "The token symbol (e.g., 'SOL', 'BONK') or mint address"
          }
        },
        required: ["token"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_token_analytics",
      description: "Get detailed market analytics for a Solana token.",
      parameters: {
        type: "object",
        properties: {
          token: {
            type: "string",
            description: "The token symbol or mint address"
          }
        },
        required: ["token"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_trading_signal",
      description: "Generate trading recommendations for a token.",
      parameters: {
        type: "object",
        properties: {
          token: {
            type: "string",
            description: "The token symbol or mint address"
          }
        },
        required: ["token"]
      }
    }
  }
];

// Define AIMessage type from schema
type ValidatedAIMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

// Schema for request validation
const chatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
    })
  ),
  chatId: z.string().optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
  stream: z.boolean().optional(),
});

// Initialize services
const initializeServices = () => {
  const logger = new PinoLogger();
  
  // Create a simple logger for the providers
  const providerLogger = {
    info: (message: string, ...args: any[]) => console.info(message, ...args),
    debug: (message: string, ...args: any[]) => console.debug(message, ...args),
    warn: (message: string, ...args: any[]) => console.warn(message, ...args),
    error: (message: string, ...args: any[]) => console.error(message, ...args)
  };
  
  // Register Anthropic provider (using options object format)
  const anthropicProvider = new AnthropicProvider({
    model: 'claude-3-7-sonnet-20240229',
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    tools: solanaToolSchema,
    logger: providerLogger
  });
  
  // Register Groq provider (using options object format)
  const groqProvider = new GroqProvider({
    model: 'llama3-70b-8192',
    apiKey: process.env.GROQ_API_KEY || '',
    logger: providerLogger
  });
  
  // Statically register providers with the registry
  AIProviderRegistry.setLogger(logger);
  AIProviderRegistry.register(anthropicProvider);
  AIProviderRegistry.register(groqProvider);
  
  // Create chat service with default configuration
  return new AIChatService({});
}

// GET handler - retrieve chat history
export async function GET(request: NextRequest) {
  const { userId } = auth();
  
  // Check authentication
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const chatId = searchParams.get('chatId');
    
    const chatService = initializeServices();
    
    if (chatId) {
      // Get specific chat by ID
      // Note: Simplified to return a placeholder since the actual method isn't implemented yet
      // TODO: Implement proper chat retrieval
      return NextResponse.json({
        id: chatId,
        title: 'Chat Session',
        messages: []
      });
    } else {
      // Get all chats
      // TODO: Implement proper chat retrieval from database
      return NextResponse.json({ 
        chats: [] 
      });
    }
  } catch (error) {
    console.error('Error retrieving chat:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve chat data' },
      { status: 500 }
    );
  }
}

// POST handler - send a message or create a chat
export async function POST(request: NextRequest) {
  const { userId } = auth();
  
  // Check authentication
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    
    // Validate request
    const validatedData = chatRequestSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validatedData.error.format() },
        { status: 400 }
      );
    }
    
    const { messages, chatId, provider, model, stream } = validatedData.data;
    
    const chatService = initializeServices();
    
    // Create a new chat if no chatId provided
    let activeChatId = chatId;
    if (!activeChatId) {
      // Create new chat with generated ID
      // TODO: Implement proper chat creation
      activeChatId = `chat_${Date.now()}`;
    }
    
    // Process request based on streaming option
    if (stream) {
      // For streaming, return a stream
      const encoder = new TextEncoder();
      const customReadable = new ReadableStream({
        async start(controller) {
          if (!controller || typeof controller.enqueue !== 'function') {
            console.error('Stream controller is invalid');
            throw new Error('Invalid stream controller');
          }
          
          // Function to send events to the stream
          const sendEvent = (event: any) => {
            if (controller && typeof controller.enqueue === 'function') {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
              );
              
              if (event.isComplete && typeof controller.close === 'function') {
                controller.close();
              }
            }
          };
          
          try {
            // Convert validated messages to AIMessage type
            const aiMessages = messages.map(msg => ({
              role: msg.role,
              content: msg.content
            })) as AIMessage[];
            
            // Get provider from registry based on user preference
            const selectedProvider = provider 
              ? AIProviderRegistry.getProvider(provider)
              : AIProviderRegistry.getDefaultProvider();
              
            if (!selectedProvider) {
              throw new Error('No AI provider available');
            }
            
            // Use provider's streaming API directly
            // Define the proper type for the chunk parameter using the ChatCompletionStreamEvent interface
            // Also, use the correct format for options as ChatCompletionOptions
            await selectedProvider.generateStreamingChatCompletion(
              {
                messages: aiMessages,
                model: model,  // Pass model in the options object
                stream: true
              },
              (chunk: ChatCompletionStreamEvent) => {
                sendEvent({
                  id: chunk.id || `chunk_${Date.now()}`,
                  content: chunk.content || '',
                  isComplete: chunk.isComplete || false
                });
              }
            );
          } catch (error) {
            console.error('Streaming error:', error);
            
            // Send error event
            if (controller && typeof controller.enqueue === 'function') {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    error: true,
                    message: 'An error occurred during streaming',
                  })}\n\n`
                )
              );
              
              if (typeof controller.close === 'function') {
                controller.close();
              }
            }
          }
        },
      });
      
      return new Response(customReadable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // For non-streaming, return regular JSON response
      // Convert validated messages to AIMessage type
      const aiMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })) as AIMessage[];
      
      // Get provider from registry based on user preference
      const selectedProvider = provider 
        ? AIProviderRegistry.getProvider(provider)
        : AIProviderRegistry.getDefaultProvider();
        
      if (!selectedProvider) {
        throw new Error('No AI provider available');
      }
      
      // Get completion directly from the provider
      // Use the correct format for options as ChatCompletionOptions
      const completion = await selectedProvider.generateChatCompletion({
        messages: aiMessages,
        model: model
      });
      
      return NextResponse.json({
        completion,
        chatId: activeChatId,
      });
    }
  } catch (error) {
    console.error('Error processing chat request:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}

// DELETE handler - delete a chat
export async function DELETE(request: NextRequest) {
  const { userId } = auth();
  
  // Check authentication
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const chatId = searchParams.get('chatId');
    
    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID is required' },
        { status: 400 }
      );
    }
    
    // Initialize services (not actually used for delete yet)
    initializeServices();
    
    // TODO: Implement proper chat deletion in database
    // Return success for now
    const success = true;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return NextResponse.json(
      { error: 'Failed to delete chat' },
      { status: 500 }
    );
  }
}