/**
 * This script completely reformats specific JSX files to ensure
 * proper formatting and indentation for the Vercel build process.
 */

const fs = require('fs');
const path = require('path');

// The main dashboard page that has been causing problems
const dashboardPath = path.join(__dirname, 'app', 'dashboard', 'page.tsx');
const srcDashboardPath = path.join(__dirname, 'src', 'app', 'dashboard', 'page.tsx');

// Fixed correct JSX for the dashboard page return statement
const fixedReturnStatement = `  return (
    <div className="min-h-screen bg-sapphire-900 text-white">
        {/* Header */}
        <header className="bg-sapphire-900/80 backdrop-blur-sm border-b border-emerald-400/20 p-4 fixed top-0 left-0 right-0 z-10">
          <div className="container mx-auto flex justify-between items-center">
            <Link href="/" className="font-cyber text-2xl text-emerald-400">BlockSwarms</Link>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomizeModal(true)}
                className="text-emerald-400 border-emerald-400/30"
              >
                <Layout size={16} className="mr-2" />
                Customize
              </Button>
              <ConnectWalletButton />
              <UserButton />
            </div>
          </div>
        </header>`;

// Function to fix a specific file's return statement
function fixDashboardFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find the return statement beginning
  const returnMatch = content.match(/\n\s*return\s*\(/);
  if (!returnMatch) {
    console.log(`Could not find return statement in ${filePath}`);
    return;
  }

  // Get the position of the return statement
  const returnPos = returnMatch.index;
  
  // Find where the return statement ends its opening (div opening tag)
  const divMatch = content.slice(returnPos).match(/return\s*\(\s*<div[^>]*>/);
  if (!divMatch) {
    console.log(`Could not find opening div tag in return statement in ${filePath}`);
    return;
  }

  // Get the start of the JSX content (header div)
  const headerComment = content.slice(returnPos + divMatch[0].length).indexOf('{/* Header */}');
  if (headerComment === -1) {
    console.log(`Could not find Header comment in ${filePath}`);
    return;
  }

  // Replace the messy return statement with our clean version
  const beforeReturn = content.slice(0, returnPos);
  const afterOpeningDiv = content.slice(returnPos + divMatch[0].length + headerComment);
  
  // Reconstruct the file
  const newContent = beforeReturn + fixedReturnStatement + afterOpeningDiv;
  
  // Write the fixed file
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`Fixed ${filePath} return statement`);
}

// Fix both dashboard file versions
console.log('Reformatting critical JSX files...');
fixDashboardFile(dashboardPath);
fixDashboardFile(srcDashboardPath);
console.log('JSX reformatting complete!');