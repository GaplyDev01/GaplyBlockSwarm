const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all TSX files in the project
const findAllTsxFiles = () => {
  console.log('Finding all TSX files...');
  try {
    // Using glob pattern to find all TSX files
    return glob.sync(path.join(__dirname, '**/*.tsx'), {
      ignore: ['**/node_modules/**', '**/.next/**']
    });
  } catch (error) {
    console.error('Error finding files:', error);
    return [];
  }
};

const fixIndentation = (filePath) => {
  console.log(`Checking ${filePath}...`);
  
  try {
    // Read file content
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Fix common return statement indentation issues
    content = content.replace(/return \(\s*(<(?!\s))/g, 'return (\n    $1');
    content = content.replace(/return \(\s+\s+(<)/g, 'return (\n    $1');
    
    // Fix multiple elements on the same line (find JSX tags with only spaces between them)
    content = content.replace(/>\s+<([a-zA-Z])/g, '>\n          <$1');
    
    // Fix JSX comments on the same line as elements
    content = content.replace(/>\s+{\/\*([^*]*)\*\/}\s+</g, '>\n        {/* $1 */}\n        <');
    
    // Fix inconsistent JSX indentation
    content = content.replace(/(\s{2,})<div/g, '    <div');
    content = content.replace(/(\s{2,})<([a-zA-Z])/g, '    <$2');
    
    // Fix multiple tags on the same line with no newlines
    const multipleJsxTagsRegex = /(<[a-zA-Z][^>]*>)(\s*)([^<\n]*?)(<[a-zA-Z])/g;
    let match;
    while ((match = multipleJsxTagsRegex.exec(content)) !== null) {
      if (match[2].indexOf('\n') === -1) {
        // If there's no newline between tags, add one
        const replacement = `${match[1]}${match[2]}${match[3]}\n        ${match[4]}`;
        content = content.slice(0, match.index) + replacement + content.slice(match.index + match[0].length);
      }
    }
    
    // Fix missing closing div issues
    content = content.replace(/<div([^>]*)>\s*<\/div>/g, '<div$1></div>');
    
    // If file was modified, write changes back
    if (content !== originalContent) {
      console.log(`Fixed indentation in ${path.relative(__dirname, filePath)}`);
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
};

// Fix specific known problematic files first
const criticalFiles = [
  path.join(__dirname, 'app', 'dashboard', 'page.tsx'),
  path.join(__dirname, 'src', 'app', 'dashboard', 'page.tsx'),
  path.join(__dirname, 'app', 'ai-chat', 'page.tsx'),
  path.join(__dirname, 'src', 'app', 'ai-chat', 'page.tsx'),
  path.join(__dirname, 'app', 'solana-v2-demo', 'page.tsx'),
  path.join(__dirname, 'src', 'app', 'solana-v2-demo', 'page.tsx')
];

console.log('Starting prebuild file checks...');
let fixedCount = 0;

// Fix critical files first
criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    if (fixIndentation(file)) {
      fixedCount++;
    }
  }
});

// Fix all other TSX files
const allTsxFiles = findAllTsxFiles().filter(file => !criticalFiles.includes(file));
allTsxFiles.forEach(file => {
  if (fixIndentation(file)) {
    fixedCount++;
  }
});

console.log(`Prebuild complete! Fixed ${fixedCount} files.`);