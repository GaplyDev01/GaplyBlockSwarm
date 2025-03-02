# BlockSwarms Codebase Cleanup

This document provides an overview of the codebase cleanup and consolidation process.

## Current State

The BlockSwarms codebase was originally structured with files in both the root directory and the `src/` directory, which led to duplication and confusion. The cleanup process has consolidated all code into the `src/` directory following clean architecture principles.

## Directory Structure

The new consolidated structure follows clean architecture principles:

- **src/core**: Domain entities, interfaces and business logic
- **src/application**: Application services and use cases
- **src/infrastructure**: External service implementations
- **src/presentation**: UI components and hooks
- **src/shared**: Utilities, types, and shared functionality
- **src/app**: Next.js app router pages and layouts

## What Has Been Done

1. **File Consolidation**: Files have been moved from root-level directories (`app/`, `components/`, etc.) to their corresponding locations in the `src/` directory structure.

2. **Import Path Updates**: Import statements have been updated to reference files from the `src/` directory.

3. **Configuration Updates**:
   - `tsconfig.json` has been updated with path mappings for both the new structure and backward compatibility
   - `next.config.js` has been updated to work with the new structure

4. **Build Scripts**: Build scripts have been updated to work with the new structure.

## What Remains To Be Done

1. **Remove Duplicate Files**: After thorough testing, the duplicate files in the root directory should be removed.

2. **Testing**: Comprehensive testing of the application to ensure all functionality works with the new structure.

3. **Documentation Update**: Update any remaining documentation to reflect the new structure.

## How to Complete the Cleanup

Run the following command to remove duplicate files:

```bash
npm run clean
node scripts/cleanup-duplicates.js
```

This will:
1. Remove the .next directory
2. Delete duplicate files from root directories that have been moved to src/
3. Update any remaining imports that need to be fixed

## Rationale for Changes

The cleanup and consolidation process addresses several key issues in the codebase:

1. **Eliminated Duplication**: The codebase had many duplicated files and components, leading to confusion about which version to use.

2. **Clean Architecture**: The new structure enforces clean architecture principles, with clear separation between domains, application logic, infrastructure, and presentation.

3. **Simplified Imports**: Path aliases now consistently point to the proper locations in the src/ directory.

4. **Improved Maintainability**: With a single, well-organized structure, the codebase is easier to understand and maintain.

## Migration Guide

For any outstanding imports that need to be updated:

| Old Import | New Import |
|------------|------------|
| @/components/ui/... | @/src/presentation/components/ui/... |
| @/components/wallet/... | @/src/presentation/components/wallet/... |
| @/lib/context/... | @/src/presentation/context/... |
| @/lib/utils/... | @/src/shared/utils/... |
| @/lib/solana/... | @/src/infrastructure/blockchain/solana/... |
| @/lib/store | @/src/shared/store/app-store |
| @/lib/types/... | @/src/shared/types/... |
| @/app/... | @/src/app/... |
| @/core/... | @/src/core/... |
| @/infrastructure/... | @/src/infrastructure/... |
| @/application/... | @/src/application/... |
| @/presentation/... | @/src/presentation/... |
| @/shared/... | @/src/shared/... |