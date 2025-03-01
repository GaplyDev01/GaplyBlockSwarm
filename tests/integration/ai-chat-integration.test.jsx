import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import AIChatPage from '../../src/app/ai-chat/page';

// Mock the chat container component
jest.mock('../../src/presentation/components/ai/chat-container', () => ({
  ChatContainer: ({ chatId, providers, initialProvider, initialModel, showProviderSelector }) => (
    <div className="chat-container" data-testid="chat-container">
      <div data-testid="chat-id">{chatId}</div>
      <div data-testid="provider">{initialProvider}</div>
      <div data-testid="model">{initialModel}</div>
      <div data-testid="show-selector">{showProviderSelector ? 'true' : 'false'}</div>
    </div>
  ),
}));

// Mock the AI context
jest.mock('../../src/presentation/context/ai-context', () => ({
  useAIContext: () => ({
    isLoading: false,
    createNewChat: jest.fn(() => Promise.resolve({ id: 'new-chat-123' })),
    availableProviders: [
      {
        id: 'anthropic',
        name: 'Anthropic',
        models: [{ id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' }],
      },
    ],
    currentChat: null,
    setCurrentChat: jest.fn(),
  }),
}));

describe('AI Chat Integration', () => {
  test('renders AI chat page with token context', async () => {
    render(<AIChatPage />);
    
    // Wait for the component to initialize
    await waitFor(() => {
      expect(screen.getByText('AI Chat about SOL')).toBeInTheDocument();
    });
    
    // Check token context is displayed
    expect(screen.getByText('So11...1112')).toBeInTheDocument();
    
    // Check chat container is rendered
    expect(screen.getByTestId('chat-container')).toBeInTheDocument();
    
    // Verify correct provider is selected
    expect(screen.getByTestId('provider')).toHaveTextContent('anthropic');
  });
  
  test('AI chat initializes with claude model', async () => {
    render(<AIChatPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('model')).toBeInTheDocument();
    });
    
    // Verify correct model is selected
    expect(screen.getByTestId('model')).toHaveTextContent('claude-3-opus-20240229');
    
    // Since token context is provided, provider selector should be hidden
    expect(screen.getByTestId('show-selector')).toHaveTextContent('false');
  });
  
  test('back button navigates to dashboard', () => {
    render(<AIChatPage />);
    
    // Check back button exists
    const backButton = screen.getByRole('link', { name: /back to dashboard/i });
    expect(backButton).toHaveAttribute('href', '/dashboard');
  });
});