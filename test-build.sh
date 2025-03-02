#!/bin/bash

# Test build script for verifying Next.js build on Vercel
set -e

echo "🚀 Testing Next.js build process for Vercel deployment"
echo "---------------------------------------------------------"

# 1. Clean the environment
echo "♻️  Cleaning previous build artifacts..."
rm -rf .next
rm -rf .vercel/output

# 2. Run prebuild script
echo "🛠️  Running prebuild scripts..."
node prebuild.js
node reformat-jsx.js

# 3. Run the Next.js build
echo "🏗️  Building Next.js application..."
NODE_ENV=production VERCEL=1 VERCEL_ENV=production npx next build

# 4. Check if the build was successful
if [ -d ".next" ]; then
  echo "✅ Build completed successfully!"
  echo "Generated files in .next directory:"
  ls -la .next
  
  echo "Checking for routes-manifest.json..."
  if [ -f ".next/routes-manifest.json" ]; then
    echo "✅ routes-manifest.json found!"
  else
    echo "❌ routes-manifest.json not found!"
  fi
  
  echo "Checking for server directory..."
  if [ -d ".next/server" ]; then
    echo "✅ server directory found!"
  else
    echo "❌ server directory not found!"
  fi
else
  echo "❌ Build failed - .next directory not found!"
  exit 1
fi

echo "---------------------------------------------------------"
echo "✅ Build test completed. Your app should be ready for Vercel deployment."
echo "🚀 Deploy this branch (vercel-deploy) directly to Vercel to test."