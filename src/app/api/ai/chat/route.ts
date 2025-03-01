import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { z } from 'zod';
import { AIProviderFactory } from '../../../../infrastructure/ai/AIProviderFactory';
import { AIProviderRegistry } from '../../../../core/ai/AIProviderRegistry';
import { AIChatService } from '../../../../application/ai/AIChatService';
import { PinoLogger } from '../../../../shared/utils/logger';

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
  const registry = new AIProviderRegistry();
  
  // Register providers
  const anthropicProvider = AIProviderFactory.createAnthropicProvider();
  const groqProvider = AIProviderFactory.createGroqProvider();
  
  registry.registerProvider(anthropicProvider);
  registry.registerProvider(groqProvider);
  
  // Create chat service
  return new AIChatService(registry, logger);
};

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
      const newChat = chatService.createChat('New Chat');
      activeChatId = newChat.id;
    }
    
    // Process request based on streaming option
    if (stream) {
      // For streaming, return a stream
      const encoder = new TextEncoder();
      const customReadable = new ReadableStream({
        async start(controller) {
          // Function to send events to the stream
          const sendEvent = (event: any) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
            );
            
            if (event.isComplete) {
              controller.close();
            }
          };
          
          try {
            await chatService.getStreamingCompletion(
              {
                messages,
                chatId: activeChatId,
                provider,
                model,
              },
              sendEvent
            );
          } catch (error) {
            console.error('Streaming error:', error);
            
            // Send error event
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  error: true,
                  message: 'An error occurred during streaming',
                })}\n\n`
              )
            );
            
            controller.close();
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
      const completion = await chatService.getCompletion({
        messages,
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