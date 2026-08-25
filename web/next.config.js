/** @type {import('next').NextConfig} */
const nextConfig = {
  // Traces only the node_modules this app actually uses into
  // .next/standalone, so the production Docker image doesn't need to
  // ship (or figure out how to isolate) this monorepo's shared,
  // legacy-dependency-laden node_modules tree. See web/Dockerfile.
  output: 'standalone',

  // Proxy /api/* to the api workspace server-side in local dev, so the
  // browser only ever talks to this app's own origin - no CORS
  // configuration needed on the api server (see the design doc's
  // "frontend-only" API decision). In ECS, the ALB does this same job
  // at the infrastructure level (path-based routing straight to the
  // api service - see docs/deploy/ecs.md), so this rewrite is mostly
  // a local-dev convenience there, but is harmless to leave active.
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
