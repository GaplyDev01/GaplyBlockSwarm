// Simple prebuild script for Vercel deployments
console.log('Running prebuild script...');

// Check environment
console.log('Node environment:', process.env.NODE_ENV);
console.log('Vercel environment:', process.env.VERCEL_ENV);

// Ensure .vercel directory exists for Vercel deployments
if (process.env.VERCEL) {
  const fs = require('fs');
  const path = require('path');
  
  // Create .vercel/output directory if it doesn't exist
  const outputDir = path.join(process.cwd(), '.vercel', 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log('Created .vercel/output directory');
  }
  
  // Create config.json for Vercel
  const configPath = path.join(outputDir, 'config.json');
  fs.writeFileSync(configPath, JSON.stringify({ version: 2 }));
  console.log('Created Vercel config file');
}

console.log('Prebuild completed successfully');