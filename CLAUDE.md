# BlockSwarms Development Guide

## Build Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Run production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Type check with TypeScript
- `npm run test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run format` - Format code with Prettier

## Code Style Guidelines
- **Component Names**: PascalCase for components (e.g., `ConnectWalletButton.tsx`)
- **File Organization**: Domain-driven structure (core, infrastructure, presentation)
- **Typing**: Strong TypeScript typing with interfaces, generics, and JSDoc comments
- **Imports**: Group external libraries first, then internal with absolute paths using @/ prefix
- **Error Handling**: Try/catch with specific handlers, use logger for errors, provide fallback UI
- **Components**: React functional components with explicit prop interfaces and return types
- **State Management**: Zustand for global state, React hooks for local state
- **Styling**: TailwindCSS utility classes for styling

## Design System
- **Theme**: Cyberpunk-inspired with dark backgrounds (#0f172a) and neon accents (emerald #10b981)
- **Typography**: Custom "font-cyber" for headers, sans-serif for body text, monospace for numbers/code
- **Components**: Card system (Base, Glass, Neon), Button system (Primary, Secondary, Outline, Subtle)
- **Animations**: Skeleton loading, smooth transitions, subtle hover effects, typing indicators
- **Responsiveness**: Mobile-first with stack layouts, tablet optimizations, desktop multi-column layouts

This project uses Next.js App Router with React and follows clean architecture principles. All new code should maintain typing discipline and follow existing patterns closely.