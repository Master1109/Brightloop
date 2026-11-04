/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow cross-origin images if needed
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  // Ensure API routes can make external calls
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:4000';
    const dest = backendUrl.startsWith('http') ? backendUrl : `https://${backendUrl}`;
    return [
      // Backend health check passthrough (optional)
      {
        source: '/api/backend/health',
        destination: `${dest}/health`,
      },
    ];
  },
  // Transpile packages if needed
  transpilePackages: [],
};

module.exports = nextConfig;