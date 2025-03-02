# Codebase Consolidation Guidelines

## Directory Structure

- All application code must reside in the `src/` directory
- Follow clean architecture folder structure:
  - `src/core/` - Domain models, interfaces, business logic
  - `src/application/` - Services and use cases
  - `src/infrastructure/` - External service adapters, tools
  - `src/presentation/` - UI components, contexts, hooks
  - `src/shared/` - Utilities, types, cross-cutting concerns
  - `src/app/` - Next.js App Router pages and layouts

## Import Paths

- Use absolute imports with path aliases defined in tsconfig.json
- Preferred import order:
  1. External libraries
  2. Core layer imports (@/src/core/*)
  3. Application layer imports (@/src/application/*)
  4. Infrastructure layer imports (@/src/infrastructure/*)
  5. Presentation layer imports (@/src/presentation/*)
  6. Shared utilities and types (@/src/shared/*)
  7. Relative imports (only when necessary)

## Migration Guidelines

- Legacy file locations (app/, components/, lib/) are being consolidated into src/
- When updating files, always place them in the src/ directory structure
- Update import paths to reference the new locations
- Use the path mappings in tsconfig.json to maintain compatibility

## Deployment Process

- The `deploy-consolidated.sh` script is used for deployment
- Before deployment, run `npm run typecheck` to verify type correctness
- Use `npm run lint` to ensure code quality
- Run tests to verify functionality

## Component Placement

- UI components go in `src/presentation/components/ui/`
- Wallet components go in `src/presentation/components/wallet/`
- AI-related components go in `src/presentation/components/ai/`
- Context providers go in `src/presentation/context/`
- Hooks go in `src/presentation/hooks/`

## File Naming Conventions

- React components: PascalCase.tsx (e.g., ConnectWalletButton.tsx)
- Services, repositories: PascalCase.ts (e.g., SolanaService.ts)
- Interfaces: Prefixed with I (e.g., ISolanaService.ts)
- Utilities, helpers: camelCase.ts (e.g., rateLimit.ts)
- Next.js pages: page.tsx inside corresponding directories