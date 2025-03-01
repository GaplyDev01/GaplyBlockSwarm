# BlockSwarms Development Guide

## Build Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Run production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Type check with TypeScript
- `npm run test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test -- -t "test name"` - Run a specific test by name
- `npm run test -- tests/path/to/specific.test.js` - Run a specific test file
- `npm run format` - Format code with Prettier

## Code Style Guidelines
- **Architecture**: Clean architecture with domain-driven design (core → application → infrastructure → presentation)
- **Component Names**: PascalCase for components (e.g., `ConnectWalletButton.tsx`), camelCase for utilities
- **File Organization**: Feature-first organization within clean architecture layers
- **Typing**: Strong TypeScript typing with explicit interfaces, generics, and JSDoc comments
- **Imports**: Group external libraries first, then internal imports using @/ aliases (see moduleNameMapper in jest.config.js)
- **Error Handling**: Use try/catch with specific error types, logger.error for reporting, provide fallback UI
- **Testing**: Jest with React Testing Library for components, use descriptive test names
- **Components**: React functional components with explicit prop interfaces and return types
- **State Management**: Zustand for global state, React hooks for local state
- **Styling**: TailwindCSS utility classes with class-variance-authority for component variants

## Project Structure
- **Core**: Domain models, interfaces, business logic
- **Application**: Services and use cases that orchestrate domain logic
- **Infrastructure**: External services implementations, adapters, tools
- **Presentation**: React components, hooks, contexts for UI
- **Shared**: Cross-cutting concerns like logging and utilities

This Next.js App Router project follows clean architecture principles, emphasizing strong typing and separation of concerns. Follow existing patterns when adding new code.