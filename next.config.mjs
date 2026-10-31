const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:4000';

export default {
  devIndicators: false,
  async rewrites() {
    return [{ source: '/backend/:path*', destination: `${backendUrl}/:path*` }];
  },
};
