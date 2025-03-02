/** @type {import('next').NextConfig} */
const path = require('path');
const webpack = require('webpack');

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '*.vercel.app']
    }
  },
  images: {
    unoptimized: true,
  },
  // Set the app directory to src/app for Next.js
  distDir: '.next',
  
  // Critical: Skip the static generation phase for authenticated routes
  // This should prevent "UserContext not found" errors 
  output: 'standalone',
  
  // Ensure that pages with client components are not pre-rendered statically
  // This helps prevent the "UserContext not found" errors during build
  staticPageGenerationTimeout: 1000,
  transpilePackages: [
    '@solana/wallet-adapter-base',
    '@solana/wallet-adapter-react',
  ],
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  
  // Webpack configuration for path resolution
  webpack: (config) => {
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
      vm: false
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

    // Increase memory limit for webpack
    config.performance = {
      ...config.performance,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    };
    
    return config;
  },
}

module.exports = nextConfig