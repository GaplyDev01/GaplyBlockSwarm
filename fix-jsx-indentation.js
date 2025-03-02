const fs = require('fs');
const path = require('path');

// List of files to check and fix
const filesToFix = [
  path.join(__dirname, 'app', 'dashboard', 'page.tsx'),
  path.join(__dirname, 'src', 'app', 'dashboard', 'page.tsx'),
  path.join(__dirname, 'app', 'ai-chat', 'page.tsx'),
  path.join(__dirname, 'src', 'app', 'ai-chat', 'page.tsx'),
  path.join(__dirname, 'app', 'solana-v2-demo', 'page.tsx'),
  path.join(__dirname, 'src', 'app', 'solana-v2-demo', 'page.tsx')
];

const fixIndentation = (filePath) => {
  console.log(`Checking ${filePath}...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  // Fix common return statement indentation issues
  content = content.replace(/return \(\s+(<(?!\s))/g, 'return ($1');
  content = content.replace(/return \(\s+\s+(<)/g, 'return (\n    $1');
  
  // Fix inconsistent JSX indentation
  content = content.replace(/(\s{2,})<div/g, '    <div');
  
  if (content !== originalContent) {
    console.log(`Fixed indentation in ${filePath}`);
    fs.writeFileSync(filePath, content, 'utf8');
  } else {
    console.log(`No issues found in ${filePath}`);
  }
};

// Fix all files
filesToFix.forEach(fixIndentation);

console.log('JSX indentation fix complete!');