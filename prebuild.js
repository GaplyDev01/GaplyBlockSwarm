// Simple prebuild script for Vercel deployments
console.log('Running prebuild script...');

// Check environment
console.log('Node environment:', process.env.NODE_ENV);
console.log('Vercel environment:', process.env.VERCEL_ENV);

// Create a minimal src/app/page.tsx file if we're on Vercel and having build issues
const fs = require('fs');
const path = require('path');

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

console.log('Prebuild completed successfully');