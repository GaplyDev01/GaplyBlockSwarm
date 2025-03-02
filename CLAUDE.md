# BlockSwarms Development Guide

## Build Commands
- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production 
- `pnpm run lint` - Run ESLint
- `pnpm run typecheck` - Type check with TypeScript
- `pnpm run test` - Run all tests
- `pnpm run test:watch` - Run tests in watch mode
- `pnpm run test -- -t "test name"` - Run a specific test by name
- `pnpm run test -- tests/path/to/specific.test.js` - Run specific test file
- `pnpm run format` - Format code with Prettier
- `pnpm run clean` - Remove .next directory
- `pnpm run update-imports` - Update import paths

## Code Style Guidelines
- **Architecture**: Clean architecture with domain-driven design (core → application → infrastructure → presentation)
- **Component Names**: PascalCase for components, camelCase for utilities
- **Typing**: Strong TypeScript with interfaces, generics, strict null checks and explicit return types
- **Imports**: External libraries first, then internal imports using path aliases (@/core/*, @/src/*)
- **Error Handling**: Try/catch with specific error types, logger.error for reporting with fallback UI
- **Testing**: Jest with React Testing Library, descriptive test names, proper mocking
- **Components**: React functional components with explicit prop interfaces
- **State Management**: Zustand for global state, React Context for shared state, local hooks for component state
- **Styling**: TailwindCSS with class-variance-authority for component variants

## Project Structure
- **src/core**: Domain models, interfaces, business logic
- **src/application**: Services and use cases orchestrating domain logic
- **src/infrastructure**: External services implementations, adapters, tools
- **src/presentation**: React components, hooks, contexts for UI
- **src/shared**: Cross-cutting concerns (logging, utilities, types)
- **tests**: Integration and unit tests with .test.{ts,tsx,js,jsx} extension

## Path Aliases
Use path aliases defined in tsconfig.json:
- `@/src/*` - Root source directory (preferred)
- `@/core/*`, `@/application/*`, `@/infrastructure/*`, `@/presentation/*`, `@/shared/*`

This Next.js App Router project follows clean architecture principles with strict TypeScript checking.