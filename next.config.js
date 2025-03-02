/** @type {import('next').NextConfig} */
const path = require('path');
const webpack = require('webpack');

const nextConfig = {
  reactStrictMode: false, // Disable React strict mode to reduce hydration issues in production
  experimental: {
    // Simplify experimental features for initial deployment
    serverActions: {
      allowedOrigins: ['localhost:3000', '*.vercel.app']
    },
    // Keep only essential optimizations
    optimizePackageImports: [
      'lucide-react'
    ]
  },
  images: {
    unoptimized: true, // Disable image optimization for now to avoid build issues
  },
  
  // Configure source directory and output directory
  distDir: '.next',
  
  // Optimize bundle size with compression
  compress: true,
  
  // Set to false for Vercel deployment
  trailingSlash: false,
  
  // Use a timestamp-based build ID
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
  
  // Add additional configuration for Vercel environment
  env: {
    VERCEL_DEPLOYMENT: 'true',
  },
  
  // Transpile specific packages that need it
  transpilePackages: [
    '@solana/wallet-adapter-base',
    '@solana/wallet-adapter-react',
    '@solana/wallet-adapter-react-ui',
    '@solana/wallet-adapter-wallets',
    '@solana/web3.js',
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
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        zlib: require.resolve('browserify-zlib'),
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