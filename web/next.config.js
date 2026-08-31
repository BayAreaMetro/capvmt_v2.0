const path = require('node:path');

// Loads the monorepo-root .env (documented in .env.example) into
// process.env - Next.js only auto-loads .env files from this app's own
// directory (web/), not the monorepo root where .env actually lives.
// Silently does nothing if the file doesn't exist, which is correct in
// Docker/ECS builds (build args are used there instead - see
// docs/deploy/ecs.md).
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Traces only the node_modules this app actually uses into
  // .next/standalone, so the production Docker image doesn't need to
  // ship (or figure out how to isolate) this monorepo's shared,
  // legacy-dependency-laden node_modules tree. See web/Dockerfile.
  output: 'standalone',

  // @bayareametro/mtc-ui's own .module.scss files (and this app's shell
  // components, which follow the same convention) reference the shared
  // Bootstrap config/token partial without an explicit @use - matches the
  // MTC-UI reference implementation's next.config.
  sassOptions: {
    additionalData: '@use "@bayareametro/mtc-ui/config.bootstrap.scss" as *;',
  },

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
