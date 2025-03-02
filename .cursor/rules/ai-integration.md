# AI Integration Rules

## Architecture

- Use the IAIProvider interface for all AI provider implementations
- Implement provider-specific adapters in infrastructure/ai
- Use the AIProviderFactory for service creation with proper DI
- Keep provider-specific details isolated in the infrastructure layer

## Provider Management

- Register providers in the AIProviderRegistry
- Support multiple AI service providers (Anthropic, Groq, etc.)
- Implement transparent fallback between providers
- Properly handle provider-specific rate limits and quotas

## Chat Integration

- Use streaming responses where available
- Properly handle cancellation of in-flight requests
- Implement retry logic for transient failures
- Provide clear loading/error states to the user

## Tool Integration

- Implement blockchain-specific tools in infrastructure/ai/tools
- Use proper typing for tool inputs and outputs
- Validate tool inputs before execution
- Handle tool execution errors gracefully

## Security

- Never log or expose API keys or sensitive user data
- Validate all inputs before sending to AI providers
- Implement proper content filtering for both inputs and outputs
- Use server-side API key management, never client-side

## Testing

- Mock AI provider responses in unit tests
- Test error handling and fallback mechanisms
- Verify tool integration works as expected
- Test streaming and non-streaming response handling