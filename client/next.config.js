// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for dynamic routes in App Router
  trailingSlash: true,
  
  // Environment variables configuration
  env: {
    API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  },

   // Configure allowed image domains
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'api.webtech.mobi.np',
        pathname: '/uploads/**',
      },
      // Add more patterns as needed
    ],
  },

  // Rewrites for API calls
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL}/:path*`,
      },
    ]
  },
  
  // Enable CORS for API calls
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  }
}

module.exports = nextConfig