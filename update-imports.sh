#!/bin/bash

# Update imports to reference files from src/
echo "Updating imports to reference files from src/"

# Find all TypeScript and TypeScript JSX files in the src directory
files=$(find src -type f \( -name "*.ts" -o -name "*.tsx" \))

for file in $files; do
  echo "Processing $file..."
  
  # Update imports from @/components to @/src/presentation/components
  sed -i '' 's|@/components/|@/src/presentation/components/|g' "$file"
  
  # Update imports from @/lib to appropriate src paths
  sed -i '' 's|@/lib/context/|@/src/presentation/context/|g' "$file"
  sed -i '' 's|@/lib/utils/logger|@/src/shared/utils/logger|g' "$file"
  sed -i '' 's|@/lib/solana/|@/src/infrastructure/blockchain/solana/|g' "$file"
  sed -i '' 's|@/lib/types/|@/src/shared/types/|g' "$file"
  sed -i '' 's|@/lib/store|@/src/shared/store/app-store|g' "$file"
  
  # Update imports from @/core to @/src/core
  sed -i '' 's|@/core/|@/src/core/|g' "$file"
  
  # Update imports from @/application to @/src/application
  sed -i '' 's|@/application/|@/src/application/|g' "$file"
  
  # Update imports from @/infrastructure to @/src/infrastructure
  sed -i '' 's|@/infrastructure/|@/src/infrastructure/|g' "$file"
  
  # Update imports from @/presentation to @/src/presentation
  sed -i '' 's|@/presentation/|@/src/presentation/|g' "$file"
  
  # Update imports from @/shared to @/src/shared
  sed -i '' 's|@/shared/|@/src/shared/|g' "$file"
  
  # Update imports from @/app to @/src/app
  sed -i '' 's|@/app/|@/src/app/|g' "$file"
  
  # For any remaining instances of @/lib that weren't caught by specific rules
  sed -i '' 's|@/lib/|@/src/shared/utils/|g' "$file"
done

echo "Import paths updated!"
echo ""
echo "Now let's create a migration guide file for future reference"

cat > MIGRATION.md << 'EOL'
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
EOL

echo "Migration guide created: MIGRATION.md"