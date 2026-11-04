/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow cross-origin images if needed
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  // Proxy backend calls to avoid CORS and keep credentials secure
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:4000';
    const dest = backendUrl.startsWith('http') ? backendUrl : `https://${backendUrl}`;
    return [
      // Auth endpoints
      { source: '/backend/auth/:action*', destination: `${dest}/auth/:action*` },
      // API endpoints
      { source: '/backend/api/:path*', destination: `${dest}/api/:path*` },
      // Health check
      { source: '/backend/health', destination: `${dest}/health` },
    ];
  },
  // Transpile packages if needed
  transpilePackages: [],
};

module.exports = nextConfig;