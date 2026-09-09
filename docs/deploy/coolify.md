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

The app's configuration is read from `process.env` at **request time**
by the `app/api/*` Route Handlers (`web/lib/env.ts`), so these are real
**runtime environment variables** in Coolify's app settings, not build args:

- `SOCRATA_USERNAME`
- `SOCRATA_PASSWORD`
- `SOCRATA_APP_TOKEN_MTC`
- `VMT_DATA_KEY`

See `docs/data/socrata-integration.md` for what each Socrata variable does,
and `.env.example` at the repo root for the full list with comments.

## Private npm registry auth in the build

`web/package.json` depends on `@bayareametro/mtc-ui` and
`@fortawesome/pro-light-svg-icons`, both published to private registries
(configured in the repo-root `.npmrc` via `${BAYAREAMETRO_NPM_TOKEN}` /
`${FONTAWESOME_AUTH_TOKEN}` env var interpolation). `web/Dockerfile` copies
`.npmrc` into the build stage and supplies both tokens to the `npm ci` step
via **BuildKit secret mounts**, not build args — these are real npm
publish-scoped credentials, and a build arg would get baked into the image's
layer history and stay recoverable (`docker history`) after the build
finishes. A secret mount exists only for the one `RUN` step that reads it.

Coolify needs these supplied via its **build secrets** (a separate concept
from its regular environment variables — check your Coolify instance's
current UI for the exact label), with these exact ids, matching the
`--mount=type=secret,id=...` names in `web/Dockerfile`:

- `bayareametro_npm_token`
- `fontawesome_auth_token`

Verified with a real `docker build` using both real tokens end-to-end: `npm
ci` fetched the private packages, `next build` succeeded, `docker history`
confirmed neither token value appears anywhere in the image, and the
resulting container correctly served `/api/health` and live Socrata data
when run standalone.

## Verifying a build locally before pushing to Coolify

```bash
docker build -f web/Dockerfile -t capvmt-web \
  --secret id=bayareametro_npm_token,src=<path to a file containing the token> \
  --secret id=fontawesome_auth_token,src=<path to a file containing the token> .

docker run -p 3000:3000 \
  -e SOCRATA_USERNAME=... -e SOCRATA_PASSWORD=... \
  -e SOCRATA_APP_TOKEN_MTC=... -e VMT_DATA_KEY=... \
  capvmt-web
```

Build context is the **monorepo root**, not `web/` — same requirement as
before, unchanged by the ECS-to-Coolify switch.
