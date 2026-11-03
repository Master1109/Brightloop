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
    return [
      // Backend health check passthrough (optional)
      {
        source: '/api/backend/health',
        destination: `${process.env.BACKEND_URL || 'http://127.0.0.1:4000'}/health`,
      },
    ];
  },
  // Transpile packages if needed
  transpilePackages: [],
};

module.exports = nextConfig;