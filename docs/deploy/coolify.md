# Deploying to Coolify

## Decision (2026-08-31)

The app deploys to **Coolify** as a **single application** built from
`web/Dockerfile`. This supersedes the earlier two-service ECS plan
(`docs/deploy/ecs.md`) — see
`docs/superpowers/specs/2026-08-14-modernization-design.md`'s "Deployment"
section for the full rationale. In short: the `api` workspace has been
folded into `web/app/api/*` as Next.js Route Handlers, so there's only one
deployable service now.

## Coolify application settings

- **Build Pack:** Dockerfile (not Nixpacks — this repo's Dockerfile handles
  the npm-workspaces monorepo layout correctly; Nixpacks' auto-detection
  doesn't know about that).
- **Base Directory:** `/` (the repo root) — `web/Dockerfile` expects a
  repo-root build context (`COPY package.json package-lock.json ./`, etc.)
  so npm workspaces resolve correctly. Coolify defaults the build context to
  whatever Base Directory you set.
- **Dockerfile Location:** `web/Dockerfile`
- **Port:** `3000`
- **Health check path:** `/api/health` (returns `{"ok": true}`)

## Build-time vs. runtime configuration

Next.js inlines every `NEXT_PUBLIC_*` env var into the client JS bundle at
`next build` time, not at container runtime — confirmed by testing a real
running container (a plain runtime env var was silently ignored; grepping a
built chunk found the value literally present in the file). So:

- `NEXT_PUBLIC_MAPBOX_TOKEN` must be set as a **Docker build argument** in
  Coolify (Build Variables / build args), not a runtime environment
  variable — setting it as the latter does nothing.

Everything else the app needs is read from `process.env` at **request time**
by the `app/api/*` Route Handlers (`web/lib/env.ts`), so these are real
**runtime environment variables** in Coolify's app settings, not build args:

- `SOCRATA_USERNAME`
- `SOCRATA_PASSWORD`
- `SOCRATA_APP_TOKEN_MTC`
- `VMT_DATA_KEY`
- `ASANA_ACCESS_TOKEN`
- `ASANA_PROJECT_ID`

See `docs/data/socrata-integration.md` for what each Socrata variable does,
and `.env.example` at the repo root for the full list with comments.

## A known gap: private npm registry auth in the build

`web/package.json` depends on `@bayareametro/mtc-ui` and
`@fortawesome/pro-light-svg-icons`, both published to private registries
(configured in the repo-root `.npmrc` via `${BAYAREAMETRO_NPM_TOKEN}` /
`${FONTAWESOME_AUTH_TOKEN}` env var interpolation). **`web/Dockerfile` does
not currently copy `.npmrc` into the build stage or accept those tokens as
build secrets**, so `npm ci` fails inside the container with a 401 — verified
by actually running `docker build -f web/Dockerfile .` locally, not assumed.
This needs `COPY .npmrc ./` plus `--mount=type=secret` for the two tokens
(and the matching secrets configured in Coolify's build settings) before a
Coolify build of this image will succeed. Not yet done as of this writing.

## Verifying a build locally before pushing to Coolify

```bash
docker build -f web/Dockerfile -t capvmt-web \
  --build-arg NEXT_PUBLIC_MAPBOX_TOKEN=<your-token> .

docker run -p 3000:3000 \
  -e SOCRATA_USERNAME=... -e SOCRATA_PASSWORD=... \
  -e SOCRATA_APP_TOKEN_MTC=... -e VMT_DATA_KEY=... \
  -e ASANA_ACCESS_TOKEN=... -e ASANA_PROJECT_ID=... \
  capvmt-web
```

Build context is the **monorepo root**, not `web/` — same requirement as
before, unchanged by the ECS-to-Coolify switch.
