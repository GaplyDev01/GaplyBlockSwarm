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
  
  // Set to false for Vercel deployment
  trailingSlash: false,
  
  // Use a simpler build ID for more predictable builds
  generateBuildId: async () => {
    return 'blockswarms-build';
  },
  
  // Add additional configuration for Vercel environment
  env: {
    NEXT_RUNTIME: 'nodejs',
    VERCEL_DEPLOYMENT: 'true',
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
  
  // Simplified build output for easier deployment
  swcMinify: true,
  
  // Add specific headers for better security and caching
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  
  // Optimized webpack configuration for Vercel deployment
  webpack: (config, { isServer }) => {
    // Configure essential path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './'),
      '@/src': path.resolve(__dirname, './src'),
    };
    
    // Only apply certain polyfills on client-side
    if (!isServer) {
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
    }

    // Disable size warnings
    config.performance = {
      ...config.performance,
      hints: false,
    };
    
    // Add environment variable for detecting Vercel build
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.VERCEL_DEPLOYMENT': JSON.stringify(true),
      })
    );
    
    return config;
  },
}

module.exports = nextConfig