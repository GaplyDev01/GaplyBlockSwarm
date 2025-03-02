# Testing Rules

## General Testing Principles

- Write tests for all new features and bug fixes
- Maintain test coverage for critical application paths
- Organize tests to mirror the source code structure
- Use descriptive test names that explain what's being tested

## Test Structure

- Use Jest with React Testing Library for component tests
- Follow the AAA pattern (Arrange, Act, Assert)
- Group related tests with nested describe blocks
- Use beforeEach for common setup when appropriate

## Component Testing

- Test component rendering, interactions, and state changes
- Use screen queries (getBy*, findBy*, queryBy*) to assert on the DOM
- Test user interactions with userEvent when possible
- Test both success and error states

## Integration Testing

- Place integration tests in the tests/integration directory
- Test API endpoints with proper request/response mocking
- Test component integration with their context providers
- Verify that components work together as expected

## Mocking

- Mock external dependencies (APIs, services) in unit tests
- Use Jest mock functions (jest.fn()) for function mocks
- Set up proper mock implementations for complex behaviors
- Reset mocks between tests to prevent test pollution

## Testing Commands

- Run all tests: `npm run test`
- Run specific test: `npm run test -- -t "test name"`
- Run specific file: `npm run test -- path/to/file.test.js`
- Run in watch mode: `npm run test:watch`