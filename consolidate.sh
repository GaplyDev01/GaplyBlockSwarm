#!/bin/bash

# Consolidation script for BlockSwarms codebase
# This script will reorganize the codebase to follow clean architecture principles
# and fix duplicated files between root and src directories

echo "Starting codebase consolidation..."

# Create backup directory
mkdir -p backup
echo "Created backup directory"

# Backup key directories
echo "Backing up app directory..."
cp -r app backup/app
echo "Backing up components directory..."
cp -r components backup/components
echo "Backing up lib directory..."
cp -r lib backup/lib
echo "Backing up core directory..."
cp -r core backup/core
echo "Backing up application directory..."
cp -r application backup/application
echo "Backing up infrastructure directory..."
cp -r infrastructure backup/infrastructure
echo "Backing up presentation directory..."
cp -r presentation backup/presentation
echo "Backing up shared directory..."
cp -r shared backup/shared

# Create any missing directories in src structure
echo "Creating directory structure..."
mkdir -p src/presentation/components/ui
mkdir -p src/presentation/components/wallet
mkdir -p src/shared/utils/logger
mkdir -p src/shared/types
mkdir -p src/app/dashboard/layout
mkdir -p src/app/signup/layout
mkdir -p src/app/error
mkdir -p src/app/login/layout

# Move UI components to src/presentation/components/ui
echo "Moving UI components..."
for file in $(find components/ui -type f -name "*.tsx"); do
  target_file="src/presentation/components/ui/$(basename $file)"
  if [ ! -f "$target_file" ]; then
    echo "Moving $file to $target_file"
    cp "$file" "$target_file"
  else
    echo "$target_file already exists, skipping"
  fi
done

# Move wallet components to src/presentation/components/wallet
echo "Moving wallet components..."
for file in $(find components/wallet -type f -name "*.tsx"); do
  # Convert snake-case to PascalCase for component names
  filename=$(basename $file)
  base=${filename%.tsx}
  # Convert to PascalCase
  new_name=""
  IFS='-' read -ra PARTS <<< "$base"
  for part in "${PARTS[@]}"; do
    new_name+="$(tr '[:lower:]' '[:upper:]' <<< ${part:0:1})${part:1}"
  done
  
  target_file="src/presentation/components/wallet/${new_name}.tsx"
  
  if [ ! -f "$target_file" ]; then
    echo "Moving $file to $target_file"
    cp "$file" "$target_file"
  else
    echo "$target_file already exists, skipping"
  fi
done

# Move lib files to appropriate locations in src
echo "Moving lib files..."

# Move context files to src/presentation/context
mkdir -p src/presentation/context
for file in $(find lib/context -type f -name "*.tsx"); do
  target_file="src/presentation/context/$(basename $file)"
  if [ ! -f "$target_file" ]; then
    echo "Moving $file to $target_file"
    cp "$file" "$target_file"
  else
    echo "$target_file already exists, skipping"
  fi
done

# Move logger to src/shared/utils/logger
for file in $(find lib/utils/logger -type f -name "*.ts"); do
  target_file="src/shared/utils/logger/$(basename $file)"
  if [ ! -f "$target_file" ]; then
    echo "Moving $file to $target_file"
    cp "$file" "$target_file"
  else
    echo "$target_file already exists, skipping"
  fi
done

# Move type definitions to src/shared/types
mkdir -p src/shared/types
for file in $(find lib/types -type f -name "*.ts"); do
  target_file="src/shared/types/$(basename $file)"
  if [ ! -f "$target_file" ]; then
    echo "Moving $file to $target_file"
    cp "$file" "$target_file"
  else
    echo "$target_file already exists, skipping"
  fi
done

# Move Solana-related files to src/infrastructure/blockchain/solana
mkdir -p src/infrastructure/blockchain/solana
for file in $(find lib/solana -type f -name "*.ts"); do
  target_file="src/infrastructure/blockchain/solana/$(basename $file)"
  if [ ! -f "$target_file" ]; then
    echo "Moving $file to $target_file"
    cp "$file" "$target_file"
  else
    echo "$target_file already exists, skipping"
  fi
done

# Move store.ts to src/shared/store
if [ -f "lib/store.ts" ] && [ ! -f "src/shared/store/app-store.ts" ]; then
  echo "Moving lib/store.ts to src/shared/store/app-store.ts"
  cp "lib/store.ts" "src/shared/store/app-store.ts"
fi

# Copy missing app files from root app to src/app
echo "Copying missing app files..."
if [ -f "app/error.tsx" ] && [ ! -f "src/app/error.tsx" ]; then
  echo "Copying app/error.tsx to src/app/error.tsx"
  cp "app/error.tsx" "src/app/error.tsx"
fi

if [ -f "app/dashboard/layout.tsx" ] && [ ! -f "src/app/dashboard/layout.tsx" ]; then
  echo "Copying app/dashboard/layout.tsx to src/app/dashboard/layout.tsx"
  cp "app/dashboard/layout.tsx" "src/app/dashboard/layout.tsx"
fi

if [ -f "app/login/layout.tsx" ] && [ ! -f "src/app/login/layout.tsx" ]; then
  echo "Copying app/login/layout.tsx to src/app/login/layout.tsx"
  cp "app/login/layout.tsx" "src/app/login/layout.tsx"
fi

if [ -f "app/signup/layout.tsx" ] && [ ! -f "src/app/signup/layout.tsx" ]; then
  echo "Copying app/signup/layout.tsx to src/app/signup/layout.tsx"
  cp "app/signup/layout.tsx" "src/app/signup/layout.tsx"
fi

if [ -f "app/provider.tsx" ] && [ ! -f "src/app/provider.tsx" ]; then
  echo "Copying app/provider.tsx to src/app/provider.tsx"
  cp "app/provider.tsx" "src/app/provider.tsx"
fi

# Ensure all core files are in src/core
echo "Consolidating core layer..."
for file in $(find core -type f -name "*.ts"); do
  rel_path=${file#core/}
  target_file="src/core/$rel_path"
  target_dir=$(dirname "$target_file")
  
  if [ ! -d "$target_dir" ]; then
    mkdir -p "$target_dir"
  fi
  
  if [ ! -f "$target_file" ]; then
    echo "Moving $file to $target_file"
    cp "$file" "$target_file"
  else
    echo "$target_file already exists, skipping"
  fi
done

# Ensure all application files are in src/application
echo "Consolidating application layer..."
for file in $(find application -type f -name "*.ts" -o -name "*.tsx"); do
  rel_path=${file#application/}
  target_file="src/application/$rel_path"
  target_dir=$(dirname "$target_file")
  
  if [ ! -d "$target_dir" ]; then
    mkdir -p "$target_dir"
  fi
  
  if [ ! -f "$target_file" ]; then
    echo "Moving $file to $target_file"
    cp "$file" "$target_file"
  else
    echo "$target_file already exists, skipping"
  fi
done

# Ensure all infrastructure files are in src/infrastructure
echo "Consolidating infrastructure layer..."
for file in $(find infrastructure -type f -name "*.ts"); do
  rel_path=${file#infrastructure/}
  target_file="src/infrastructure/$rel_path"
  target_dir=$(dirname "$target_file")
  
  if [ ! -d "$target_dir" ]; then
    mkdir -p "$target_dir"
  fi
  
  if [ ! -f "$target_file" ]; then
    echo "Moving $file to $target_file"
    cp "$file" "$target_file"
  else
    echo "$target_file already exists, skipping"
  fi
done

# Create a list of duplicated files
echo "Creating report of duplicated files..."
echo "# Duplicated Files Report" > duplicated_files.md
echo "" >> duplicated_files.md
echo "## App Directory" >> duplicated_files.md
echo "" >> duplicated_files.md
for file in $(find app -type f -name "*.tsx" -o -name "*.ts"); do
  rel_path=${file#app/}
  src_file="src/app/$rel_path"
  if [ -f "$src_file" ]; then
    echo "- $file and $src_file" >> duplicated_files.md
  fi
done

echo "" >> duplicated_files.md
echo "## Core Layer" >> duplicated_files.md
echo "" >> duplicated_files.md
for file in $(find core -type f -name "*.ts"); do
  rel_path=${file#core/}
  src_file="src/core/$rel_path"
  if [ -f "$src_file" ]; then
    echo "- $file and $src_file" >> duplicated_files.md
  fi
done

echo "" >> duplicated_files.md
echo "## Application Layer" >> duplicated_files.md
echo "" >> duplicated_files.md
for file in $(find application -type f -name "*.ts" -o -name "*.tsx"); do
  rel_path=${file#application/}
  src_file="src/application/$rel_path"
  if [ -f "$src_file" ]; then
    echo "- $file and $src_file" >> duplicated_files.md
  fi
done

echo "" >> duplicated_files.md
echo "## Infrastructure Layer" >> duplicated_files.md
echo "" >> duplicated_files.md
for file in $(find infrastructure -type f -name "*.ts"); do
  rel_path=${file#infrastructure/}
  src_file="src/infrastructure/$rel_path"
  if [ -f "$src_file" ]; then
    echo "- $file and $src_file" >> duplicated_files.md
  fi
done

echo "Consolidation complete! See duplicated_files.md for a report of duplicated files."
echo "Next steps:"
echo "1. Update imports to reference files from src/"
echo "2. Update tsconfig.paths.json to include new src structure"
echo "3. Test the application to make sure everything works"
echo "4. Remove duplicated files from root directories"