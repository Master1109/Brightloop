/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow cross-origin images if needed
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  // Transpile packages if needed
  transpilePackages: [],
};

module.exports = nextConfig;