# capvmt_v2.0

Climate Action Plan VMT Data Portal (Version 2).

## Applications

This repository is a modern npm workspace with two maintained application workspaces:

- `web`: the Next.js frontend.
- `api`: the TypeScript Express backend.

The Next.js app proxies browser requests for `/api/*` to the backend URL configured by `API_INTERNAL_URL`. In local development this normally points to `http://localhost:4000`, where the Express API runs.

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

The API loads the repository-root `.env` file for local development. The variables used by `api/src/env.ts` are:

- `PORT`: API port. Defaults to `4000` when unset.
- `SOCRATA_USERNAME`: Socrata account username for API data access.
- `SOCRATA_PASSWORD`: Socrata account password for API data access.
- `SOCRATA_APP_TOKEN_MTC`: Socrata app token.
- `VMT_DATA_KEY`: Socrata dataset key for VMT data.
- `ASANA_ACCESS_TOKEN`: Asana Personal Access Token for feedback submissions.
- `ASANA_PROJECT_ID`: Asana project gid for feedback submissions.

The web workspace also uses:

- `API_INTERNAL_URL`: server-side target for Next.js rewrites from `/api/*` to the API backend, for example `http://localhost:4000`.
- `NEXT_PUBLIC_MAPBOX_TOKEN`: Mapbox GL JS token used by client-side map pages.

## Development

Run both maintained workspaces from the repository root:

```bash
npm run dev
```

This starts the Next.js frontend and the TypeScript Express API concurrently.

To run a single workspace directly:

```bash
npm run dev:web
npm run dev:api
```

## Build

Build all workspaces from the repository root:

```bash
npm run build
```

This runs the workspace build scripts, including `next build` for `web` and TypeScript compilation for `api`.

## Testing

Run all workspace test scripts from the repository root:

```bash
npm test
```

This runs the maintained workspace tests, including Playwright tests for `web` and Vitest tests for `api`.

## Deployment

Deploy the built Next.js `web` application and TypeScript Express `api` service as separate modern services. Provide production environment variables through the deployment platform rather than committing local `.env` files.

## Data updates

See the README in the [etl folder](https://github.com/BayAreaMetro/capvmt_v2.0/tree/main/etl).
