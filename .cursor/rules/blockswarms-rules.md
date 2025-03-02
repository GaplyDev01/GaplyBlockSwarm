# BlockSwarms Coding Rules

## Architecture

- Follow clean architecture principles with domain-driven design
- Maintain clear separation between layers: core → application → infrastructure → presentation
- Use dependency inversion for layer interactions
- Keep business logic in core/application layers, UI logic in presentation layer

## Code Style

- Use TypeScript with strict type checking
- PascalCase for components, interfaces, and types
- camelCase for variables, functions, and instance properties
- Use explicit interfaces for props, state, and function parameters
- Add JSDoc comments for non-obvious functions and types
- Use functional components with hooks, not class components

## Imports

- Group imports: external libraries first, then internal modules
- Use absolute imports with module aliases:
  - @/core/* for domain models and interfaces
  - @/application/* for services and use cases
  - @/infrastructure/* for external service adapters
  - @/presentation/* for UI components
  - @/shared/* for utilities and types

## Error Handling

- Use try/catch blocks around async operations and external API calls
- Create custom error types for different error cases
- Use logger.error for reporting with appropriate context
- Provide fallback UI for error states

## State Management

- Use Zustand for global application state
- Use React hooks (useState, useContext) for component-level state
- Define specific store slices for different domains
- Keep store updates in dedicated actions/mutators

## UI Components

- Use TailwindCSS for styling with class-variance-authority for variants
- Create small, reusable components with single responsibilities
- Implement responsive design for all UI components
- Use proper semantic HTML elements