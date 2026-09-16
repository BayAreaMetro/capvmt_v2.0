# Deploying to Coolify

## Decision (2026-08-31, revised 2026-09-15)

The app deploys to **Coolify** as a **single application** built from
`web/Dockerfile`. This supersedes the earlier two-service ECS plan
(`docs/deploy/ecs.md`) — see
`docs/superpowers/specs/2026-08-14-modernization-design.md`'s "Deployment"
section for the full rationale. In short: the `api` workspace has been
folded into `web/app/api/*` as Next.js Route Handlers, so there's only one
deployable service now.

**Revised 2026-09-15:** this app now deploys on the shared `dsa-infrastructure`
Coolify platform (Terraform-managed, see that repo's README and
`GITHUB_ACTIONS_ECR_COOLIFY_RUNBOOK.md`). That infrastructure's supported flow
is **GitHub Actions builds and pushes to ECR, Coolify pulls a Docker Image
app via webhook** — it explicitly does not support Coolify cloning the repo
and building the Dockerfile itself. The sections below describe this flow;
Coolify's own git/Dockerfile-build integration is not used.

```text
push to dev/main
  -> GitHub Actions builds the image with BuildKit secrets (.github/workflows/deploy-{dev,prod}.yml)
  -> GitHub Actions assumes AWS via OIDC and pushes :dev / :main tags to ECR
  -> Coolify deploy webhook fires
  -> Coolify worker pulls the tag from ECR and Traefik routes the domain
```

## Environments

| Branch | ECR tag | Coolify worker |
|---|---|---|
| `dev`  | `:dev`  | dsa-infrastructure dev worker |
| `main` | `:main` | dsa-infrastructure prod worker |

The dsa-infrastructure staging worker is currently unused by this app.

## GitHub repository setup

Set as **Actions repository variables**:

```text
AWS_ECR_ROLE_ARN=arn:aws:iam::311263071456:role/coolify-github-actions-ecr
```

Set as **Actions repository secrets**:

```text
NPM_AUTH_TOKEN=<read token for @bayareametro private npm packages>
FONTAWESOME_AUTH_TOKEN=<Font Awesome package token>
COOLIFY_DEV_WEBHOOK=<dev application's Coolify deploy webhook URL>
COOLIFY_DEV_TOKEN=<Coolify deploy token for the dev app, id|secret form>
COOLIFY_PROD_WEBHOOK=<prod application's Coolify deploy webhook URL>
COOLIFY_PROD_TOKEN=<Coolify deploy token for the prod app, id|secret form>
```

`AWS_ECR_ROLE_ARN` uses OIDC — no static AWS access keys. The ECR repository
(`capvmt_v2.0`) and this repo's OIDC trust subject
(`repo:BayAreaMetro/capvmt_v2.0:*`) are already provisioned in
dsa-infrastructure's `terraform.tfvars`; no Terraform changes are needed to
add a new branch/tag, since the subject isn't restricted to `main`.

## Coolify application setup

Create **two** Coolify applications (one per environment), each as a
**Docker Image** app — not Git/Dockerfile:

| Setting | Dev | Prod |
|---|---|---|
| Deployment type | Docker Image | Docker Image |
| Destination server | dsa-infrastructure dev worker | dsa-infrastructure prod worker |
| Image | `311263071456.dkr.ecr.us-west-2.amazonaws.com/capvmt_v2.0` | same |
| Tag | `dev` | `main` |
| Port exposes | `3000` | `3000` |
| Health check path | `/api/health` | `/api/health` |

Create a deploy-permission Coolify API token per app and use that app's own
deploy webhook URL — these are the `COOLIFY_*_WEBHOOK` / `COOLIFY_*_TOKEN`
secrets above. A `401` from the webhook means the token is missing,
malformed, revoked, or lacks Deploy permission; a `405` means the webhook
needs `POST`, not another method.

## Build-time vs. runtime configuration

The app's configuration is read from `process.env` at **request time**
by the `app/api/*` Route Handlers (`web/lib/env.ts`), so these are real
**runtime environment variables** set directly in each Coolify app's
settings, not build args or GitHub Actions secrets:

- `SOCRATA_USERNAME`
- `SOCRATA_PASSWORD`
- `SOCRATA_APP_TOKEN_MTC`
- `VMT_DATA_KEY`

See `docs/data/socrata-integration.md` for what each Socrata variable does,
and `.env.example` at the repo root for the full list with comments. There
are currently no build-time (`NEXT_PUBLIC_*`) variables — the app has no
client-inlined config since the map/Mapbox integration was retired.

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

`docker/build-push-action`, used by `deploy-dev.yml`/`deploy-prod.yml`,
supplies these BuildKit secrets from the `NPM_AUTH_TOKEN` /
`FONTAWESOME_AUTH_TOKEN` GitHub Actions secrets above, with ids matching the
`--mount=type=secret,id=...` names in `web/Dockerfile` exactly:

- `npm_auth_token`
- `fontawesome_auth_token`

(This id naming matches the convention used by every other app on the
shared dsa-infrastructure Coolify platform.)

Verified with a real `docker build` using both real tokens end-to-end: `npm
ci` fetched the private packages, `next build` succeeded, `docker history`
confirmed neither token value appears anywhere in the image, and the
resulting container correctly served `/api/health` and live Socrata data
when run standalone.

## Verifying a build locally before pushing

```bash
docker build -f web/Dockerfile -t capvmt-web \
  --secret id=npm_auth_token,src=<path to a file containing the token> \
  --secret id=fontawesome_auth_token,src=<path to a file containing the token> .

docker run -p 3000:3000 \
  -e SOCRATA_USERNAME=... -e SOCRATA_PASSWORD=... \
  -e SOCRATA_APP_TOKEN_MTC=... -e VMT_DATA_KEY=... \
  capvmt-web
```

Build context is the **monorepo root**, not `web/` — `web/Dockerfile` expects
a repo-root build context (`COPY package.json package-lock.json ./`, etc.)
so npm workspaces resolve correctly.
