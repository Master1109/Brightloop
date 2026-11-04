const backendUrl = process.env.BACKEND_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://127.0.0.1:8080');
if (process.env.NODE_ENV === 'production' && (!backendUrl || /localhost|127\.0\.0\.1|railway\.internal/i.test(backendUrl))) {
  throw new Error('BACKEND_URL must be the public Railway HTTPS URL in production');
}

export default {
  devIndicators: false,
  async rewrites() {
    return [{ source: '/backend/:path*', destination: `${backendUrl}/:path*` }];
  },
};
