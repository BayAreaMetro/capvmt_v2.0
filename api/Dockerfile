# syntax=docker/dockerfile:1
#
# Build context is the MONOREPO ROOT (see docs/deploy/ecs.md), not this
# directory - needed so npm workspaces / the shared root package-lock.json
# resolve correctly:
#   docker build -f api/Dockerfile -t capvmt-api .

FROM node:20-alpine AS build
WORKDIR /repo

# Copy just the manifests first for better layer caching. npm needs
# every workspace's package.json present to reconcile the lockfile,
# even though --workspace scopes the actual install to api.
COPY package.json package-lock.json ./
COPY web/package.json web/
COPY api/package.json api/
RUN npm ci --workspace api --include-workspace-root=false

COPY api api
# esbuild bundles api's one runtime dependency (express) directly into
# dist/server.js, so the runtime stage below needs no node_modules at
# all - sidesteps copying anything out of the shared monorepo
# node_modules tree, which also holds the legacy app's dependencies.
RUN npm run bundle --workspace api

# --- runtime ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

COPY --from=build /repo/api/dist/server.js ./server.js

EXPOSE 4000
USER node
CMD ["node", "server.js"]
