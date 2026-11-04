/** @type {import('next').NextConfig} */
const rawBackend = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:4000';
const cleanBackend = rawBackend.replace(/\/+$/, '');
const dest = cleanBackend.startsWith('http') ? cleanBackend : `https://${cleanBackend}`;

const nextConfig = {
  // Allow cross-origin images if needed
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  // Proxy backend calls to avoid CORS and keep credentials secure
  async rewrites() {
    return [
      // Auth endpoints
      { source: '/backend/auth/:action*', destination: `${dest}/auth/:action*` },
      // API endpoints
      { source: '/backend/api/:path*', destination: `${dest}/api/:path*` },
      // Health check
      { source: '/backend/health', destination: `${dest}/health` },
      // Catch-all backend proxy
      { source: '/backend/:path*', destination: `${dest}/:path*` },
    ];
  },
  // Transpile packages if needed
  transpilePackages: [],
};

module.exports = nextConfig;
