# syntax=docker/dockerfile:1
#
# Build context is the MONOREPO ROOT (see docs/deploy/coolify.md), not this
# directory - needed so npm workspaces / the shared root package-lock.json
# resolve correctly:
#   docker build -f web/Dockerfile -t capvmt-web .

FROM node:20-alpine AS build
WORKDIR /repo

# Copy just the manifests first for better layer caching. npm needs
# every workspace's package.json present to reconcile the lockfile,
# even though --workspace scopes the actual install to web.
COPY package.json package-lock.json ./
COPY web/package.json web/
RUN npm ci --workspace web --include-workspace-root=false

COPY web web

# Next.js inlines every NEXT_PUBLIC_* env var into the client JS bundle
# at `next build` time, not at container runtime (confirmed: grepped a
# built chunk and found the value literally present in the file), so
# this has to be a build arg, baked in per image build - setting it as
# a normal runtime environment variable does nothing.
ARG NEXT_PUBLIC_MAPBOX_TOKEN=""
ENV NEXT_PUBLIC_MAPBOX_TOKEN=$NEXT_PUBLIC_MAPBOX_TOKEN

RUN npm run build --workspace web

# --- runtime ---
# next.config.js sets output: 'standalone', which traces only the
# node_modules this app actually uses into .next/standalone - this is
# what keeps the image from needing (or trying to isolate) the shared
# monorepo node_modules, which also holds the legacy app's dependency
# tree. Standalone output doesn't include static assets or public/;
# those are copied in separately below. The nested `web/` path here
# mirrors this app's location in the monorepo - see Next's own
# monorepo Docker guidance.
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=build /repo/web/.next/standalone ./
COPY --from=build /repo/web/.next/static ./web/.next/static
COPY --from=build /repo/web/public ./web/public

# SOCRATA_*, VMT_DATA_KEY, and ASANA_* are read from process.env at
# request time by the app/api Route Handlers (web/lib/env.ts) - real
# runtime secrets, set as normal container environment variables (in
# Coolify's app settings), not build args like NEXT_PUBLIC_MAPBOX_TOKEN
# above.

EXPOSE 3000
USER node
CMD ["node", "web/server.js"]
