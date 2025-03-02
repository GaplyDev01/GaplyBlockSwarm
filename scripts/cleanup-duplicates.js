/**
 * Script to clean up duplicate files after consolidation
 * This should be run after thorough testing of the consolidated structure
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('Starting cleanup of duplicate files...');

// Directories to remove (after files have been consolidated to src/)
const directoriesToRemove = [
  'app',
  'components',
  'core',
  'application',
  'infrastructure',
  'presentation',
  'shared'
];

// Additional files to keep (even if they're in the directories to remove)
const filesToKeep = [
  'README.md',
  'CODEBASE-CLEANUP.md',
  'MIGRATION.md',
  'package.json',
  'package-lock.json',
  'next.config.js',
  'tsconfig.json',
  'middleware.ts'
];

// Function to safely remove a file
function removeFile(filePath) {
  try {
    fs.unlinkSync(filePath);
    console.log(`Removed: ${filePath}`);
  } catch (error) {
    console.error(`Error removing ${filePath}:`, error.message);
  }
}

// Function to remove a directory and its contents
function removeDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return;
  }

  // Check if directory is empty
  const files = fs.readdirSync(dirPath);
  if (files.length === 0) {
    fs.rmdirSync(dirPath);
    console.log(`Removed empty directory: ${dirPath}`);
    return;
  }

  console.log(`Directory not empty, skipping: ${dirPath}`);
}

// Process each directory
directoriesToRemove.forEach(dir => {
  if (!fs.existsSync(dir)) {
    console.log(`Directory ${dir} does not exist, skipping.`);
    return;
  }

  console.log(`Processing directory: ${dir}`);
  
  // Find all TypeScript files in the directory
  const pattern = path.join(dir, '**/*.{ts,tsx}');
  const files = glob.sync(pattern, { ignore: ['**/node_modules/**', '**/.next/**'] });
  
  // Check each file to see if it has been moved to src/
  files.forEach(file => {
    // Convert path to src equivalent
    const relativePath = file.replace(/^[^/]+\//, ''); // Remove the root directory part
    const srcPath = path.join('src', relativePath);
    
    // Check if the file exists in src/
    if (fs.existsSync(srcPath)) {
      // File has been moved to src/, so we can remove it
      removeFile(file);
    } else {
      console.log(`File has no equivalent in src/, keeping: ${file}`);
    }
  });
  
  // Try to remove the directory if it's empty
  removeDirectory(dir);
});

// Optionally remove lib/ directory (with caution, as it may contain unique files)
if (fs.existsSync('lib')) {
  console.log('\nProcessing lib/ directory:');
  console.log('CAUTION: lib/ directory may contain unique files not yet moved to src/');
  console.log('Please review the following files before manual deletion:');
  
  const libFiles = glob.sync('lib/**/*.{ts,tsx}');
  libFiles.forEach(file => {
    console.log(`- ${file}`);
  });
}

console.log('\nCleanup completed!');
console.log('Important: Please review any remaining files in the root directories before manual deletion.');
console.log('Run the application to ensure everything works correctly with the consolidated structure.');