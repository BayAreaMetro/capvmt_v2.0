/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxy /api/* to the api workspace server-side, so the browser only
  // ever talks to this app's own origin - no CORS configuration needed
  // on the api server (see the design doc's "frontend-only" API decision).
  async rewrites() {
    const apiInternalUrl = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';
    return [
      {
        source: '/api/:path*',
        destination: `${apiInternalUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
