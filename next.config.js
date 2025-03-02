/** @type {import('next').NextConfig} */
const path = require('path');
const webpack = require('webpack');

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Simplify experimental features for initial deployment
    serverActions: {
      allowedOrigins: ['localhost:3000', '*.vercel.app']
    },
    // Keep only essential optimizations
    optimizePackageImports: [
      'lucide-react'
    ]
    // Temporarily disable instrumentation hook for debugging
    // instrumentationHook: true
  },
  images: {
    unoptimized: true, // Disable image optimization for now to avoid build issues
  },
  
  // Configure source directory and output directory
  distDir: '.next',
  
  // Standard output for troubleshooting (remove standalone)
  // output: 'standalone',
  
  // Optimize bundle size with compression
  compress: true,
  
  // Set to true to catch all fallback routes
  trailingSlash: false,
  
  // Ensure routes manifest is generated and Next.js outputs proper build artifacts
  generateBuildId: async () => {
    return 'custom-build-id-' + Date.now();
  },
  
  // Transpile specific packages that need it
  transpilePackages: [
    '@solana/wallet-adapter-base',
    '@solana/wallet-adapter-react',
  ],
  
  // Allow production builds to complete even with errors
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Simplified webpack configuration for path resolution
  webpack: (config, { isServer }) => {
    // Configure essential path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './'),
      '@/src': path.resolve(__dirname, './src'),
    };
    
    // Minimal polyfills for browser compatibility
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      os: false,
      path: false,
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer/'),
    };
    
    // Add only essential plugins
    config.plugins.push(
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
      })
    );

    // Disable size warnings
    config.performance = {
      ...config.performance,
      hints: false,
    };
    
    return config;
  },
}

module.exports = nextConfig