# capvmt_v2.0

Climate Action Plan VMT Data Portal (Version 2).

## Applications

This repository is a modern npm workspace with one maintained application workspace:

- `web`: a full-stack Next.js app. Its API (`web/app/api/*` Route Handlers) proxies Socrata for VMT data and Asana for feedback submissions — see `web/lib/env.ts` and `docs/data/socrata-integration.md`.

(Originally built as two services — a Next.js frontend and a separate Express `api` workspace — then consolidated into one app; see `docs/superpowers/specs/2026-08-14-modernization-design.md`'s "Deployment" section for why.)

## Requirements

- Node.js `>=20.9.0`
- npm `>=9`

## Setup

Install dependencies from the repository root:

```bash
npm install
```

Create a local `.env` file from `.env.example` and fill in the required values for your environment:

```bash
cp .env.example .env
```

## Environment variables

The app loads the repository-root `.env` file for local development. The variables used by `web/lib/env.ts` (read by the `app/api/*` Route Handlers at request time):

- `SOCRATA_USERNAME`: Socrata account username for API data access.
- `SOCRATA_PASSWORD`: Socrata account password for API data access.
- `SOCRATA_APP_TOKEN_MTC`: Socrata app token.
- `VMT_DATA_KEY`: Socrata dataset key for VMT data.
- `ASANA_ACCESS_TOKEN`: Asana Personal Access Token for feedback submissions.
- `ASANA_PROJECT_ID`: Asana project gid for feedback submissions.

Also used, but inlined into the client bundle at build time rather than read at runtime (see `web/Dockerfile`):

- `NEXT_PUBLIC_MAPBOX_TOKEN`: Mapbox GL JS token used by client-side map pages.

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

This runs `next build` for `web`.

## Testing

Run all workspace test scripts from the repository root:

```bash
npm test
```

This runs `web`'s test scripts: Vitest unit tests for the `app/api/*` Route Handlers and their supporting `lib/` code, then Playwright end-to-end tests for the pages.

## Deployment

Deploy the built Next.js app to Coolify as a single application built from `web/Dockerfile`. See `docs/deploy/coolify.md` for the full guide (build pack, required build args vs. runtime environment variables, a known gap in private-registry auth for the build). Provide production environment variables through the deployment platform rather than committing local `.env` files.

## Data updates

See the README in the [etl folder](https://github.com/BayAreaMetro/capvmt_v2.0/tree/main/etl).
