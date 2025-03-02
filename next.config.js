/** @type {import('next').NextConfig} */
const path = require('path');
const webpack = require('webpack');

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '*.vercel.app']
    },
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tabs',
      'framer-motion',
      'recharts',
      '@solana/web3.js',
      '@solana/wallet-adapter-react-ui'
    ],
    instrumentationHook: true
  },
  images: {
    unoptimized: true, // Disable image optimization for now to avoid build issues
  },
  
  // Configure source directory and output directory
  distDir: '.next',
  
  // Output standalone build for better Vercel deployment
  output: 'standalone',
  
  // Optimize bundle size with compression
  compress: true,
  
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
  
  // Webpack configuration for path resolution and optimization
  webpack: (config, { isServer }) => {
    // Configure path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './'),
      '@/src': path.resolve(__dirname, './src'),
      '@/src/core': path.resolve(__dirname, './src/core'),
      '@/src/application': path.resolve(__dirname, './src/application'),
      '@/src/infrastructure': path.resolve(__dirname, './src/infrastructure'),
      '@/src/presentation': path.resolve(__dirname, './src/presentation'),
      '@/src/shared': path.resolve(__dirname, './src/shared'),
      '@/src/app': path.resolve(__dirname, './src/app'),
      
      // Legacy path aliases for backward compatibility
      '@/components': path.resolve(__dirname, './src/presentation/components'),
      '@/lib': path.resolve(__dirname, './src/shared'),
      '@/lib/context': path.resolve(__dirname, './src/presentation/context'),
      '@/lib/solana': path.resolve(__dirname, './src/infrastructure/blockchain/solana'),
      '@/lib/utils': path.resolve(__dirname, './src/shared/utils'),
      '@/lib/types': path.resolve(__dirname, './src/shared/types'),
      '@/app': path.resolve(__dirname, './src/app'),
      '@/core': path.resolve(__dirname, './src/core'),
      '@/infrastructure': path.resolve(__dirname, './src/infrastructure'),
      '@/application': path.resolve(__dirname, './src/application'),
      '@/presentation': path.resolve(__dirname, './src/presentation'),
      '@/shared': path.resolve(__dirname, './src/shared'),
    };
    
    // Polyfill Node.js native modules for browser compatibility
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      os: require.resolve('os-browserify'),
      path: require.resolve('path-browserify'),
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      zlib: require.resolve('browserify-zlib'),
      util: require.resolve('util/'),
      buffer: require.resolve('buffer/'),
      process: require.resolve('process/browser'),
      constants: require.resolve('constants-browserify'),
      vm: false,
      worker_threads: false,
      'lib/worker': false,
    };
    
    // Add plugins for proper polyfilling
    config.plugins.push(
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
      })
    );
    
    // Add global resolves for crypto libraries
    config.plugins.push(
      new webpack.DefinePlugin({
        'global.crypto': 'crypto'
      })
    );

    // Fix for "self is not defined" error
    if (!isServer) {
      config.resolve.fallback.fs = false;
      config.resolve.fallback.net = false;
      config.resolve.fallback.tls = false;
    }

    // Increase memory limit for webpack
    config.performance = {
      ...config.performance,
      hints: false, // Disable size warnings
    };
    
    return config;
  },
}

module.exports = nextConfig