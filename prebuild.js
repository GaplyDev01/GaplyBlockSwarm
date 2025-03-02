// Enhanced prebuild script for Vercel deployments
console.log('╔════════════════════════════════════════╗');
console.log('║  BlockSwarms - Vercel Prebuild Script   ║');
console.log('╚════════════════════════════════════════╝');

// Check and log environment details for debugging deployment issues
console.log('Node environment:', process.env.NODE_ENV);
console.log('Vercel environment:', process.env.VERCEL_ENV || 'local');
console.log('Deployment URL:', process.env.VERCEL_URL || 'local');
console.log('Branch:', process.env.VERCEL_GIT_COMMIT_REF || 'local');

// Check for required environment variables
const requiredEnvVars = ['NODE_ENV'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.warn('⚠️ Missing environment variables:', missingEnvVars.join(', '));
}

// Log Solana RPC endpoint if available
if (process.env.NEXT_PUBLIC_SOLANA_RPC_URL) {
  console.log('Using Solana RPC URL:', process.env.NEXT_PUBLIC_SOLANA_RPC_URL);
} else {
  console.log('No custom Solana RPC URL set, will use default endpoint');
}

// Import required modules
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Create a unique build ID for caching purposes
const buildId = crypto.randomBytes(6).toString('hex');
console.log('Generated build ID:', buildId);

// Check for Next.js installation
const nextPackageJson = path.join(process.cwd(), 'node_modules/next/package.json');
if (fs.existsSync(nextPackageJson)) {
  const nextVersion = require(nextPackageJson).version;
  console.log('Using Next.js version:', nextVersion);
} else {
  console.warn('⚠️ Could not find Next.js package.json');
}

// Ensure .vercel directory exists for Vercel deployments
if (process.env.VERCEL) {
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

// Create a public/404.html file if it doesn't exist
const notFoundPath = path.join(process.cwd(), 'public', '404.html');
if (!fs.existsSync(notFoundPath)) {
  const notFoundContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Page Not Found - BlockSwarms</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background-color: #0f172a;
      color: #10b981;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
    }
    .container {
      text-align: center;
      padding: 2rem;
      max-width: 500px;
      border: 1px solid rgba(16, 185, 129, 0.2);
      border-radius: 0.5rem;
      background-color: rgba(15, 23, 42, 0.7);
    }
    h1 { font-size: 3rem; margin-bottom: 1rem; }
    p { margin-bottom: 1.5rem; color: rgba(255, 255, 255, 0.7); }
    a {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      background-color: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 0.25rem;
      color: #10b981;
      text-decoration: none;
      margin: 0.5rem;
    }
    a:hover { background-color: rgba(16, 185, 129, 0.2); }
  </style>
</head>
<body>
  <div class="container">
    <h1>404 - Not Found</h1>
    <p>The page you're looking for doesn't exist or has been moved.</p>
    <div>
      <a href="/">Return to Home</a>
      <a href="/api/health">Check API Status</a>
    </div>
  </div>
</body>
</html>
  `;
  fs.writeFileSync(notFoundPath, notFoundContent);
  console.log('Created 404.html file in public directory');
}

// Create a fallback index.html file in the public directory
const indexPath = path.join(process.cwd(), 'public', 'index.html');
if (!fs.existsSync(indexPath)) {
  const indexContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="0;url=/" />
  <title>BlockSwarms</title>
</head>
<body>
  <p>Redirecting to home page...</p>
  <script>window.location.href = '/';</script>
</body>
</html>
  `;
  fs.writeFileSync(indexPath, indexContent);
  console.log('Created index.html file in public directory');
}

// Create .nojekyll file to prevent GitHub Pages issues (if deployed there)
fs.writeFileSync(path.join(process.cwd(), 'public', '.nojekyll'), '');

// Create a build-info.json file for debugging
const buildInfo = {
  timestamp: new Date().toISOString(),
  buildId,
  nodeEnv: process.env.NODE_ENV,
  vercelEnv: process.env.VERCEL_ENV || 'local',
  nextVersion: require(path.join(process.cwd(), 'node_modules/next/package.json')).version,
};

fs.writeFileSync(
  path.join(process.cwd(), 'public', 'build-info.json'),
  JSON.stringify(buildInfo, null, 2)
);

// Create an empty mock file for SSR specific imports
fs.writeFileSync(
  path.join(process.cwd(), 'src', 'env-constants.js'),
  'export const IS_VERCEL = true;\nexport const BUILD_ID = "' + buildId + '";'
);

console.log('✅ Prebuild completed successfully');
console.log('═══════════════════════════════════════');