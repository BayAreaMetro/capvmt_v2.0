# syntax=docker/dockerfile:1
#
# Build context is the MONOREPO ROOT (see docs/deploy/ecs.md), not this
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
COPY api/package.json api/
RUN npm ci --workspace web --include-workspace-root=false

COPY web web

# Next.js resolves rewrites() destinations at build time and freezes
# them into .next/routes-manifest.json - reading process.env at
# container *runtime* does not work, confirmed by testing this against
# a real running container (a plain runtime env var was silently
# ignored). So this has to be a build arg, baked in per image build.
# In real ECS use this doesn't matter at runtime anyway - the ALB
# routes /api/* straight to the api service's target group without
# passing through this container at all (see docs/deploy/ecs.md); this
# only matters for docker-compose / standalone `docker run` testing.
ARG API_INTERNAL_URL=http://localhost:4000
ENV API_INTERNAL_URL=$API_INTERNAL_URL

# Same build-time-only story applies to every NEXT_PUBLIC_* var -
# Next.js inlines these into the client JS bundle at `next build`
# (confirmed: grepped a built chunk and found the value literally
# present in the file). Setting this as an ECS task-definition runtime
# environment variable would do nothing; it must be a build arg here.
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

EXPOSE 3000
USER node
CMD ["node", "web/server.js"]
