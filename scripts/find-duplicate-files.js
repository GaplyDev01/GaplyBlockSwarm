/**
 * Script to find duplicate files across the codebase
 * This helps identify files that exist in multiple locations
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const glob = require('glob');

// Directories to search for duplicates
const directories = [
  'app',
  'src/app',
  'components',
  'src/presentation/components',
  'core',
  'src/core',
  'application',
  'src/application',
  'infrastructure',
  'src/infrastructure',
  'presentation',
  'src/presentation',
  'shared',
  'src/shared',
  'lib',
  'src/shared'
];

// Function to calculate file hash
function getFileHash(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(content).digest('hex');
}

// Find all TypeScript and TSX files in the specified directories
const findAllFiles = () => {
  let files = [];
  
  directories.forEach(dir => {
    if (fs.existsSync(dir)) {
      const pattern = path.join(dir, '**/*.{ts,tsx}');
      const dirFiles = glob.sync(pattern, { ignore: ['**/node_modules/**', '**/.next/**'] });
      files = [...files, ...dirFiles];
    }
  });
  
  return files;
}

// Main function
function findDuplicates() {
  console.log('Searching for duplicate files...');
  
  const files = findAllFiles();
  console.log(`Found ${files.length} TypeScript/TSX files to examine`);
  
  // Map to store file hashes
  const hashMap = new Map();
  
  // Track duplicates
  const duplicates = [];
  
  // Calculate hash for each file and check for duplicates
  files.forEach(file => {
    try {
      const hash = getFileHash(file);
      
      if (hashMap.has(hash)) {
        const existingFile = hashMap.get(hash);
        duplicates.push({ file1: existingFile, file2: file });
      } else {
        hashMap.set(hash, file);
      }
    } catch (error) {
      console.error(`Error processing file ${file}:`, error.message);
    }
  });
  
  // Print results
  console.log(`\nFound ${duplicates.length} duplicate file pairs:\n`);
  
  // Group duplicates by primary location
  const groupedDuplicates = {};
  
  duplicates.forEach(({ file1, file2 }) => {
    // Extract the base name for grouping
    const name1 = path.basename(file1);
    const name2 = path.basename(file2);
    
    // Use the file name as the group key
    const key = name1 === name2 ? name1 : `${name1} / ${name2}`;
    
    if (!groupedDuplicates[key]) {
      groupedDuplicates[key] = [];
    }
    
    groupedDuplicates[key].push({ file1, file2 });
  });
  
  // Output the grouped duplicates
  for (const [filename, instances] of Object.entries(groupedDuplicates)) {
    console.log(`\n${filename}:`);
    instances.forEach(({ file1, file2 }) => {
      console.log(`  ${file1}\n  ${file2}\n`);
    });
  }
  
  // Create a structured report
  let report = '# Duplicate Files Report\n\n';
  report += 'The following files have identical content but exist in multiple locations in the codebase.\n\n';
  
  for (const [filename, instances] of Object.entries(groupedDuplicates)) {
    report += `## ${filename}\n\n`;
    instances.forEach(({ file1, file2 }) => {
      report += `- ${file1}\n- ${file2}\n\n`;
      
      // Suggest which one to keep
      const keepSrc = file1.includes('/src/') ? file1 : (file2.includes('/src/') ? file2 : '');
      if (keepSrc) {
        report += `**Recommendation**: Keep \`${keepSrc}\` and update imports to reference this file.\n\n`;
      }
    });
  }
  
  // Write the report to a file
  fs.writeFileSync('duplicate-files-report.md', report);
  console.log('Report saved to duplicate-files-report.md');
}

// Run the script
findDuplicates();