/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };
    return config;
  },
  // Disable type checking during build for faster builds
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Configuration for Node.js runtime and disabling Edge Runtime warnings
  experimental: {
    serverComponentsExternalPackages: ['scheduler'],
    runtime: 'nodejs',
    serverComponents: true
  },
}

module.exports = nextConfig
