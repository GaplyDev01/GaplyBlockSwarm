import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { AIChatService } from '../../../../application/ai/AIChatService';
import { PinoLogger } from '../../../../shared/utils/logger/PinoLogger';
import { AIProviderRegistry } from '../../../../core/ai/AIProviderRegistry';
import { AnthropicProvider } from '../../../../infrastructure/ai/AnthropicProvider';
import { GroqProvider } from '../../../../infrastructure/ai/GroqProvider';
import { AIMessage, AITool } from '../../../../core/ai/interfaces/IAIProvider';
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
  
  // Register Anthropic and Groq providers
  const anthropicLogger = new PinoLogger({ module: 'anthropic' });
  const anthropicProvider = new AnthropicProvider(
    anthropicLogger,
    process.env.ANTHROPIC_API_KEY || '',
    'claude-3-7-sonnet-20240229'
  );
  
  // Set tools after initialization if the provider supports it
  if (anthropicProvider.supportsTools()) {
    anthropicProvider.setTools(solanaToolSchema);
  }
  
  const groqLogger = new PinoLogger({ module: 'groq' });
  const groqProvider = new GroqProvider(
    groqLogger,
    process.env.GROQ_API_KEY || '',
    'llama3-70b-8192'
  );
  
  // Set tools after initialization if the provider supports it
  if (groqProvider.supportsTools()) {
    groqProvider.setTools(solanaToolSchema);
  }
  
  // Create new registry instance
  const registry = new AIProviderRegistry(logger);
  
  // Register providers
  registry.registerProvider(anthropicProvider, true); // Anthropic as default
  registry.registerProvider(groqProvider);
  
  // Create chat service with the registry and logger
  return new AIChatService(registry, logger);
};

// GET handler - retrieve chat history
export async function GET(request: NextRequest) {
  // Check for wallet authentication from request cookie
  const walletCookie = request.cookies.get('wallet_connected');
  const userId = walletCookie?.value;
  
  // Check authentication
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized - Wallet not connected' }, { status: 401 });
  }
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const chatId = searchParams.get('chatId');
    
    const chatService = initializeServices();
    
    if (chatId) {
      // Get specific chat
      const chat = chatService.getChat(chatId);
      
      if (!chat) {
        return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
      }
      
      return NextResponse.json(chat);
    } else {
      // Get all chats
      const chats = chatService.getAllChats();
      return NextResponse.json({ chats });
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
  // Check for wallet authentication from request cookie
  const walletCookie = request.cookies.get('wallet_connected');
  const userId = walletCookie?.value;
  
  // Check authentication
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized - Wallet not connected' }, { status: 401 });
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
      const newChat = chatService.createChat('New Chat');
      activeChatId = newChat.id;
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
            
            await chatService.getStreamingCompletion(
              {
                messages: aiMessages,
                chatId: activeChatId,
                provider,
                model,
              },
              sendEvent
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
      
      const completion = await chatService.getCompletion({
        messages: aiMessages,
        chatId: activeChatId,
        provider,
        model,
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
  // Check for wallet authentication from request cookie
  const walletCookie = request.cookies.get('wallet_connected');
  const userId = walletCookie?.value;
  
  // Check authentication
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized - Wallet not connected' }, { status: 401 });
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
    
    const chatService = initializeServices();
    const success = chatService.deleteChat(chatId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Chat not found or could not be deleted' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return NextResponse.json(
      { error: 'Failed to delete chat' },
      { status: 500 }
    );
  }
}