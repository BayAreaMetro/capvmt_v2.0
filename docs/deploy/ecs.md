# Deploying to ECS

> **Superseded (2026-08-31).** The two-service ECS plan described below was
> never provisioned (see "What still needs to be provisioned" below — none
> of it exists) and has been reversed: the app is now a single full-stack
> Next.js app (the `api` workspace was folded into `web/app/api/*` Route
> Handlers) deployed to Coolify. See
> `docs/superpowers/specs/2026-08-14-modernization-design.md`'s "Deployment"
> section for the reversal's rationale and `docs/deploy/coolify.md` for the
> current deployment guide. This document is kept as a historical record of
> the original decision, not deleted — nothing below is accurate for the
> current architecture.

## Decision (2026-08-24)

The modernized app deploys to **AWS ECS (Fargate)** as **two separate services** —
`capvmt-web` (Next.js) and `capvmt-api` (Express) — behind a single **Application
Load Balancer** with path-based routing:

- `/api/*` → `capvmt-api` target group (container port 4000)
- everything else → `capvmt-web` target group (container port 3000)

This is a deliberate deviation from how MTC deploys its other apps today. The
legacy `capvmt_v2.0` app (and the sibling apps referenced elsewhere in this
codebase — `basis-dev-2022...elasticbeanstalk.com`, the old
`capvmt...elasticbeanstalk.com`) all run on a single AWS Elastic Beanstalk
environment, deployed by manually zipping `dist/server` and uploading it
through the EB console — no CI/CD, no containers. That pattern only fits a
single deployable unit; it doesn't cleanly support the two-service
architecture this modernization uses (a separate Next.js frontend and Express
API), which was chosen specifically because Amplify vs. ECS was the deciding
factor: **Amplify** effectively requires consolidating into one Next.js app
(it hosts a single full-stack Next.js deployable, not an arbitrary second
Express service alongside it), while **ECS** — the chosen target — handles
two independently-deployed services behind one ALB cleanly, so the existing
`web`/`api` split didn't need to be undone.

## Why the ALB does the `/api/*` routing, not the web container

`web/next.config.js` also has a `rewrites()` rule that proxies `/api/*` to
the api service — that's there for **local development** (`npm run dev`,
where there's no ALB) and for local `docker-compose`/`docker run` testing.
In real ECS traffic, the ALB intercepts `/api/*` before it ever reaches the
web container, so that rewrite is dormant in production — harmless to leave
in place, just not the mechanism actually used there.

## A real gotcha worth knowing before touching either Dockerfile

**Next.js resolves `rewrites()` destinations and inlines every
`NEXT_PUBLIC_*` env var into the client bundle at `next build` time — not at
container runtime.** This was verified directly, not assumed: a plain ECS
task-definition-style runtime environment variable was silently ignored in a
real running container; grepping a built static chunk found a
`NEXT_PUBLIC_MAPBOX_TOKEN` value literally inlined into the JS. Both
`API_INTERNAL_URL` (only matters for local docker use, per above) and
`NEXT_PUBLIC_MAPBOX_TOKEN` are therefore passed as **Docker build args**
(`web/Dockerfile`'s `ARG`/`ENV` pair), not as task-definition `environment`
entries — setting either there would silently do nothing. The api service
doesn't have this problem: its config (`SOCRATA_*`, `VMT_DATA_KEY`,
`ASANA_*`) is read from `process.env` at request time by plain Node/Express
code, so those are real runtime secrets in `deploy/ecs/api-task-definition.json`.

## Building the images

Build context is the **monorepo root**, not `web/` or `api/` — both
Dockerfiles need the root `package.json`/`package-lock.json` and every
workspace's `package.json` to resolve npm workspaces correctly:

```bash
docker build -f api/Dockerfile -t capvmt-api .

docker build -f web/Dockerfile -t capvmt-web \
  --build-arg API_INTERNAL_URL=http://api:4000 \
  --build-arg NEXT_PUBLIC_MAPBOX_TOKEN=<your-token>
```

Both images are deliberately lean despite the monorepo also containing the
legacy app's large, dated dependency tree (Angular, Gulp, Webpack 1, etc.):

- **`api`** is bundled by esbuild into a single `dist/server.js` with its one
  runtime dependency (`express`) inlined — the runtime image ships **no
  `node_modules` at all**. Verified by copying just that one file into an
  empty directory and running it standalone.
- **`web`** uses Next's `output: 'standalone'`, which traces only the
  `node_modules` this app actually imports (next/react/etc.) — not the
  monorepo's shared tree.

Both were built and run as real containers to confirm this — not just
assumed from the Dockerfile syntax.

## What still needs to be provisioned (none of this exists yet)

- An ECR repository per service (`capvmt-web`, `capvmt-api`)
- An ECS cluster, plus a Fargate service per task definition in `deploy/ecs/`
- An ALB with the path-based routing rule described above, and its two target groups
- An IAM execution role (`ECS_EXECUTION_ROLE_ARN` in the task definitions) that can pull from ECR and write to CloudWatch Logs
- The two CloudWatch Logs groups referenced in the task definitions (`/ecs/capvmt-web`, `/ecs/capvmt-api`)
- A Secrets Manager secret holding `SOCRATA_USERNAME`, `SOCRATA_PASSWORD`, `SOCRATA_APP_TOKEN_MTC`, `VMT_DATA_KEY`, `ASANA_ACCESS_TOKEN`, `ASANA_PROJECT_ID` (referenced by `<SECRETS_MANAGER_ARN>` in `deploy/ecs/api-task-definition.json`) — MTC currently distributes this app's secrets via a Box.com folder link in the legacy README, not a secrets manager; this would be a real improvement over that
- An IAM role trusting GitHub's OIDC provider, for `.github/workflows/ci-cd.yml`'s `deploy` job to assume (no long-lived AWS keys in GitHub)
- These GitHub Actions repo variables (Settings → Secrets and variables → Actions → Variables): `AWS_ROLE_ARN`, `AWS_REGION`, `ECS_CLUSTER`, `WEB_API_INTERNAL_URL`, `NEXT_PUBLIC_MAPBOX_TOKEN`

Until these exist, `.github/workflows/ci-cd.yml`'s `deploy` job is reachable
only via manual `workflow_dispatch` (not on every push) and will fail with
clear AWS errors (missing role, missing cluster, etc.) rather than silently
doing nothing — that's intentional, so a manual trigger gives an honest
signal of what's still missing.

## What already works today, no new infra needed

- `test` and `build` jobs in `.github/workflows/ci-cd.yml` run on every push/PR: install, lint, test both workspaces, and build both Docker images — replacing the stale, non-functional `.travis.yml` (Node 6, a MongoDB service this app never used) with actual working CI for the first time in this repo's history.
- Both Dockerfiles build and run correctly today, verified locally.
