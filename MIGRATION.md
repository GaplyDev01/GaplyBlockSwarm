# BlockSwarms Codebase Migration Guide

This document outlines the changes made to reorganize the codebase structure.

## Directory Structure Changes

The codebase has been reorganized to follow clean architecture principles with all code now in the `src/` directory:

- **src/core**: Domain entities, interfaces, and business logic
- **src/application**: Application services and use cases
- **src/infrastructure**: External service implementations and technical concerns
- **src/presentation**: UI components and presentation logic
- **src/shared**: Shared utilities, types, and cross-cutting concerns
- **src/app**: Next.js app router structure

## Import Path Changes

The following import path mappings have been updated:

| Old Path | New Path |
|----------|----------|
| @/components/ui/ | @/src/presentation/components/ui/ |
| @/components/wallet/ | @/src/presentation/components/wallet/ |
| @/lib/context/ | @/src/presentation/context/ |
| @/lib/utils/logger/ | @/src/shared/utils/logger/ |
| @/lib/solana/ | @/src/infrastructure/blockchain/solana/ |
| @/lib/types/ | @/src/shared/types/ |
| @/lib/store | @/src/shared/store/app-store |
| @/core/ | @/src/core/ |
| @/application/ | @/src/application/ |
| @/infrastructure/ | @/src/infrastructure/ |
| @/presentation/ | @/src/presentation/ |
| @/shared/ | @/src/shared/ |
| @/app/ | @/src/app/ |

## Configuration Updates

The TypeScript configuration (tsconfig.json) now includes path aliases for the new directory structure while maintaining backwards compatibility.

## Next Steps

1. Remove duplicated files from root directories once all testing is complete
2. Update documentation to reflect new structure
3. Ensure all import paths are correctly updated
4. Review and refine clean architecture implementation
