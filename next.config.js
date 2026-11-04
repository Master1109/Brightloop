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
    const backendUrl = process.env.BACKEND_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://127.0.0.1:8080');
    if (process.env.NODE_ENV === 'production' && (!backendUrl || /localhost|127\.0\.0\.1|railway\.internal/i.test(backendUrl))) {
      throw new Error('BACKEND_URL must be the public Railway HTTPS URL in production');
    }
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
