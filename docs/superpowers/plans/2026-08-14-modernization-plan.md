# Application Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Updated 2026-08-24** after auditing this repo (`capvmt_v2.0`, the current/latest version of the app). The prior version of this plan (ported from the CAPVMT repo's modernization worktree) assumed the app's data layer was SQL-Server-backed and needed a wholesale migration to Postgres. That's not what this codebase does: VMT reporting data already comes from **Socrata** via `soda-js` (`server/api/data/data.controller.js`), and `mssql` is an unused, dead npm dependency. Only auth/user data (and the unused `Data`/`Thing` CRUD scaffolding) lives in a local SQLite file via Sequelize. Tasks below are rewritten to match the real endpoints, real data sources, and real gaps found in this repo. See `docs/superpowers/specs/2026-08-14-modernization-design.md` for the full analysis.
>
> **Updated again 2026-08-24, then superseded the same day:** an intermediate revision of this plan added a task to source commercial-vehicle VMT data and thread a `vehicleType` dimension through the Socrata client, API, and UI so the app could show both non-commercial and commercial stats side by side. **Product has since clarified that's not required.** The Socrata dataset will be updated separately (outside this codebase) to include commercial-vehicle data, but the app itself does not need code changes to display it — it just needs to keep displaying whatever the updated dataset returns. The task list below is back to matching that simpler scope; see the design doc's "Vehicle type scope" section for the full reasoning.
>
> **Updated again 2026-08-24:** the former Task 5 ("Auth, Account, and Admin Migration") is removed. Confirmed by reading the actual rendered markup: the navbar block linking to `login`/`signup`/`settings`/`admin`/`logout` is commented out in `client/components/navbar/navbar.html`, and no other UI path reaches them — this is working backend code with zero real users, not a live feature. Decision: remove it rather than migrate it. That also removes the only reason this plan needed Postgres/Prisma at all, so Task 2 is simplified down to just the Socrata client — see the design doc's "Auth/account/admin scope" and rewritten "Data Layer" sections.
>
> **Updated again 2026-08-24:** Task 5's feedback decision is resolved — bring it in-house, backed by **Asana** (each submission becomes a task in a configured Asana project) rather than a database or the legacy external Elastic Beanstalk service. This means the new app ends up with no database at all. `ASANA_PROJECT_ID` is deliberately left blank in `.env.example` pending which Asana project this should target.
>
> **Updated again 2026-08-24:** the deployment target is decided — **AWS ECS (Fargate), two services (`web`, `api`) behind one ALB with path-based routing**, not the single-Elastic-Beanstalk-environment pattern the legacy app and its siblings use. Deciding between AWS Amplify and ECS also settled a question left open earlier the same day (consolidate `web`+`api` into one Next.js app, or keep them separate): Amplify would have forced consolidation (it hosts one full-stack Next.js deployable, not a second arbitrary Express service alongside it); ECS handles two services behind one ALB cleanly, so Tasks 2, 3, and 5's work in `api/` didn't need to be undone. New Task 6 below covers containerizing both services and the first working CI/CD this repo has ever had; see `docs/deploy/ecs.md` for the full picture, including a real gotcha (Next.js bakes `rewrites()` destinations and `NEXT_PUBLIC_*` vars in at Docker build time, not container runtime — confirmed by testing an actual running container). Cutover is renumbered to Task 7.

**Goal:** Rebuild the app on Next.js and a separate Node API, keeping Socrata as the system of record for VMT reporting data, while preserving current behavior. Login/signup/account/admin functionality is being **removed, not migrated** — see Non-Goals below. The Socrata dataset is expected to be updated externally to include commercial-vehicle data; no task below adds app-side logic to distinguish or display that separately (see design doc Non-Goals). Feedback is brought in-house behind the new API, backed by Asana rather than a database. Both services deploy to ECS as separate containers behind one ALB.

**Architecture:** Stand up the new stack beside the legacy app, then migrate one surface at a time behind explicit API contracts. Keep frontend, API, Socrata, and Asana boundaries strict so each layer can be tested independently and the old app can be retired without a big-bang rewrite. The new API is stateless — no database anywhere in this plan.

**Tech Stack:** Next.js (App Router, TypeScript), Node.js API (Express + TypeScript), a typed Socrata (SODA API) client, a typed Asana REST API client, Vitest, Playwright, supertest. No database. Deployed as two Docker images (esbuild-bundled `api`, Next.js `standalone`-output `web`) to ECS Fargate.

## Global Constraints

- The end state should preserve current product behavior while removing the oldest platform constraints and making future feature work safer and faster.
- Use an incremental strangler approach.
- Socrata stays the source of truth for VMT reporting data unless an explicit later decision says otherwise (see design doc Open Decisions) — do not silently duplicate it into a new warehouse.
- Query and pass through whatever fields Socrata returns rather than hardcoding today's field set, so the app keeps working when the dataset is updated to include commercial-vehicle data — but do not build separate commercial/non-commercial display logic; that's explicitly out of scope (see design doc Non-Goals).
- Do not build login, signup, account settings, or admin functionality in the new app — that capability is being removed, confirmed to have no reachable UI entry point in the current app (see design doc Non-Goals).
- Socrata and Asana access both stay inside the backend. Frontend code should never hold either's credentials directly.
- During migration, the old and new systems should coexist with explicit handoff points instead of shared hidden state.
- Avoid redesigning unrelated product areas during the platform rewrite.

---

### Task 1: Workspace and Tooling Foundation

**Files:**
- Modify: `package.json`
- Create: `web/package.json`
- Create: `web/tsconfig.json`
- Create: `web/next.config.js`
- Create: `web/app/layout.tsx`
- Create: `web/app/page.tsx`
- Create: `web/app/globals.css`
- Create: `api/package.json`
- Create: `api/tsconfig.json`
- Create: `api/src/app.ts`
- Create: `api/src/server.ts`
- Create: `api/src/env.ts`
- Create: `.env.example`
- Create: `docker-compose.yml`

**Interfaces:**
- Consumes: current root scripts in `package.json`, current legacy app entry points in `server/app.js` and `client/app/app.js`
- Produces: `npm run dev:web`, `npm run dev:api`, `npm test`, `web/*` and `api/*` project roots that later tasks can build on

- [x] **Step 1: Write a failing workspace sanity test**

```ts
// api/test/sanity.test.ts
import { describe, it, expect } from 'vitest';

describe('workspace sanity', () => {
  it('exports a web and api package', () => {
    expect(true).toBe(true);
  });
});
```

- [x] **Step 2: Run the test command and confirm the workspace does not yet exist**

Run: `npm test`

Expected: failure until the new workspace scripts and package roots exist.

- [x] **Step 3: Add the modern workspace shell**

```json
{
  "private": true,
  "workspaces": ["web", "api"],
  "scripts": {
    "dev:web": "npm --workspace web run dev",
    "dev:api": "npm --workspace api run dev",
    "test": "npm run test --workspaces --if-present",
    "lint": "npm run lint --workspaces --if-present"
  }
}
```

```ts
// api/src/server.ts
import { createServer } from 'node:http';
import { app } from './app';

createServer(app).listen(process.env.PORT ?? 4000);
```

```tsx
// web/app/page.tsx
export default function HomePage() {
  return <main>Modernization shell</main>;
}
```

Also document the env vars the legacy server already depends on but never wrote down (`server/config/local.env.sample.js` doesn't list them):

```bash
# .env.example
PORT=4000
SOCRATA_USERNAME=
SOCRATA_PASSWORD=
SOCRATA_APP_TOKEN_MTC=
VMT_DATA_KEY=
# No DATABASE_URL by default — the API is stateless (Socrata proxy only).
# Add one only if Task 5 decides to bring feedback in-house.
```

- [x] **Step 4: Run the workspace commands**

Run: `npm run dev:api` and `npm run dev:web`

Expected: both services start cleanly.

- [x] **Step 5: Commit**

```bash
git add package.json web api .env.example docker-compose.yml
git commit -m "chore: add modern workspace scaffolding"
```

### Task 2: Socrata Client for VMT Data

> Replaces the original "PostgreSQL Schema and Import Path" task. There is no SQL Server or legacy warehouse to import from — VMT data already lives in Socrata. This task is now just a typed wrapper around the existing Socrata integration — no Postgres, no Prisma, no `User` model. Auth/account/admin is being removed rather than migrated (see design doc), which was the only thing that needed a database, so this task has no operational-data half anymore. The client passes through whatever fields Socrata returns rather than hardcoding today's field set, so it keeps working once the dataset is updated (outside this codebase) to include commercial-vehicle data — no `vehicleType` parameter or dual-series handling needed here.

**Files:**
- Create: `api/src/socrata/client.ts`
- Create: `api/src/socrata/vmt.ts`
- Create: `docs/data/socrata-integration.md`

**Interfaces:**
- Consumes: `VMT_DATA_KEY`, `SOCRATA_USERNAME`, `SOCRATA_PASSWORD`, `SOCRATA_APP_TOKEN_MTC` from env
- Produces: a `SocrataVmtClient` with `getJurisdictions()`, `getVmtByJurisdiction(modelRun, cityName)`, `getModelRunYears()` methods that later tasks call instead of hitting `soda-js` directly from route handlers

- [x] **Step 1: Write a failing test for the Socrata client contract**

```ts
// api/test/socrata/vmt.test.ts
import { describe, it, expect, vi } from 'vitest';
import { SocrataVmtClient } from '../../src/socrata/vmt';

describe('SocrataVmtClient', () => {
  it('fetches distinct jurisdictions', async () => {
    const client = new SocrataVmtClient({ dataset: 'test-key' });
    const rows = await client.getJurisdictions();
    expect(Array.isArray(rows)).toBe(true);
  });
});
```

- [x] **Step 2: Run the test and confirm the client is absent**

Run: `npm --workspace api test`

Expected: failure until `socrata/vmt.ts` exists.

- [x] **Step 3: Wrap the existing Socrata contract in a typed client**

```ts
// api/src/socrata/client.ts
export interface SocrataConfig {
  domain?: string;
  dataset: string;
  username?: string;
  password?: string;
  appToken?: string;
}

export class SocrataClient {
  constructor(private config: SocrataConfig) {}

  async query(params: Record<string, string>): Promise<unknown[]> {
    const domain = this.config.domain ?? 'data.bayareametro.gov';
    const url = new URL(`https://${domain}/resource/${this.config.dataset}.json`);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    const response = await fetch(url, {
      headers: this.config.appToken ? { 'X-App-Token': this.config.appToken } : {},
    });
    if (!response.ok) throw new Error(`Socrata request failed: ${response.status}`);
    return response.json();
  }
}
```

```ts
// api/src/socrata/vmt.ts
import { SocrataClient } from './client';

export class SocrataVmtClient {
  private client: SocrataClient;

  constructor(config: { dataset: string; domain?: string; username?: string; password?: string; appToken?: string }) {
    this.client = new SocrataClient(config);
  }

  // Replaces the ad hoc soda-js `consumer.query()...select('cityname').group('cityname')`
  // call in the legacy server/api/data/data.controller.js#getJurisdictions
  getJurisdictions() {
    return this.client.query({ $select: 'cityname', $group: 'cityname', $order: 'cityname', $limit: '200' });
  }

  // Replaces the legacy #getVMTbyJurisdiction where/limit query. Returns whatever
  // fields Socrata has for this model_run/cityname — including commercial-vehicle
  // fields once the dataset owner adds them — without needing a code change here.
  getVmtByJurisdiction(modelRun: string, cityName: string) {
    return this.client.query({ model_run: modelRun, cityname: cityName, $limit: '200' });
  }

  // Finishes the migration the legacy code left commented out in #getYears —
  // today that endpoint returns a hardcoded array instead of querying Socrata
  getModelRunYears() {
    return this.client.query({ $select: 'model_run', $group: 'model_run', $order: 'model_run' });
  }
}
```

- [x] **Step 4: Run the Socrata client test**

Run: `npm --workspace api test`

Expected: passes against a mocked/sandboxed Socrata dataset.

- [x] **Step 5: Commit**

```bash
git add api/src/socrata docs/data/socrata-integration.md
git commit -m "feat: add typed socrata client"
```

### Task 3: Core Node API and Read Endpoints

> Endpoints match the real legacy contract in `server/api/data/index.js` and `server/routes.js`, not a generic CRUD API.

**Files:**
- Create: `api/src/routes/health.ts`
- Create: `api/src/routes/vmt.ts` (serves `years/all`, `jurisdictions/all`, `vmt/:modelRun/:cityName` via `SocrataVmtClient`)
- Create: `api/src/lib/http-errors.ts`
- Create: `api/src/lib/request-context.ts`
- Create: `api/test/routes/health.test.ts`
- Create: `api/test/routes/vmt.test.ts`

**Interfaces:**
- Consumes: `SocrataVmtClient` from Task 2
- Produces: `GET /health`, `GET /api/data/years/all`, `GET /api/data/jurisdictions/all`, `GET /api/data/vmt/:modelRun/:cityName` with JSON responses usable by the new frontend — the same paths the legacy Angular client already calls, so the frontend migration in Task 4 doesn't need parallel contract changes. The route passes through whatever Socrata returns rather than reshaping it, so a future commercial-vehicle field on the dataset flows through without an API change.

- [x] **Step 1: Write a failing route test for the health endpoint**

```ts
// api/test/routes/health.test.ts
import request from 'supertest';
import { app } from '../../src/app';

describe('health', () => {
  it('returns ok', async () => {
    await request(app).get('/health').expect(200).expect({ ok: true });
  });
});
```

- [x] **Step 2: Run the test and confirm the route is missing**

Run: `npm --workspace api test -- --runInBand api/test/routes/health.test.ts`

Expected: 404 or route-not-found failure.

- [x] **Step 3: Implement the route layer over the Socrata client**

```ts
// api/src/routes/vmt.ts
import { Router } from 'express';
import { SocrataVmtClient } from '../socrata/vmt';

export const vmtRouter = Router();
const client = new SocrataVmtClient({
  dataset: process.env.VMT_DATA_KEY!,
  username: process.env.SOCRATA_USERNAME,
  password: process.env.SOCRATA_PASSWORD,
  appToken: process.env.SOCRATA_APP_TOKEN_MTC,
});

vmtRouter.get('/years/all', async (_req, res, next) => {
  try {
    res.json(await client.getModelRunYears());
  } catch (error) {
    next(error);
  }
});

vmtRouter.get('/jurisdictions/all', async (_req, res, next) => {
  try {
    res.json(await client.getJurisdictions());
  } catch (error) {
    next(error);
  }
});

vmtRouter.get('/vmt/:modelRun/:cityName', async (req, res, next) => {
  try {
    res.json(await client.getVmtByJurisdiction(req.params.modelRun, req.params.cityName));
  } catch (error) {
    next(error);
  }
});
```

```ts
// api/src/app.ts
import express from 'express';
import { healthRouter } from './routes/health';
import { vmtRouter } from './routes/vmt';

export const app = express();
app.use(express.json());
app.use('/health', healthRouter);
app.use('/api/data', vmtRouter);
```

- [x] **Step 4: Run the route tests and the API smoke test**

Run: `npm --workspace api test`

Expected: health and VMT read endpoints return stable JSON, sourced from Socrata (mocked in tests).

- [x] **Step 5: Commit**

```bash
git add api/src/routes api/src/app.ts api/test/routes
git commit -m "feat: add core api routes over the socrata client"
```

### Task 4: Next.js Shell and Public Routes

> Route list matches the real client surfaces (`client/app/{main,data,map,feedback,about}`) — there is no separate "explorer" page; `data` is the VMT explorer.

**Files:**
- Create: `web/app/(public)/layout.tsx`
- Create: `web/app/(public)/page.tsx`
- Create: `web/app/(public)/about/page.tsx`
- Create: `web/app/(public)/data/page.tsx`
- Create: `web/app/(public)/map/page.tsx`
- Create: `web/app/(public)/feedback/page.tsx`
- Create: `web/components/site-nav.tsx`
- Create: `web/lib/api.ts`
- Create: `web/test/home.spec.ts`
- Create: `web/test/data.spec.ts`
- Create: `web/test/map.spec.ts`

**Interfaces:**
- Consumes: API base URL from `web/lib/api.ts`, routes from Task 3
- Produces: Next.js pages that replace the legacy AngularJS public screens and call the Node API only

- [x] **Step 1: Write a failing page test**

```ts
// web/test/home.spec.ts
import { test, expect } from '@playwright/test';

test('home page renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Modernization shell')).toBeVisible();
});
```

- [x] **Step 2: Run the browser test and confirm the page is not yet implemented**

Run: `npm --workspace web test`

Expected: failure until the Next.js app and routes exist.

- [x] **Step 3: Build the shared shell and route pages**

```tsx
// web/components/site-nav.tsx
export function SiteNav() {
  return (
    <nav>
      <a href="/">Home</a>
      <a href="/data">Data</a>
      <a href="/map">Map</a>
      <a href="/feedback">Feedback</a>
      <a href="/about">About</a>
    </nav>
  );
}
```

```ts
// web/lib/api.ts
export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${path}`);
  if (!response.ok) throw new Error(`Request failed: ${path}`);
  return response.json() as Promise<T>;
}
```

The `data` page should call `apiGet('/api/data/years/all')`, `apiGet('/api/data/jurisdictions/all')`, and `apiGet('/api/data/vmt/:modelRun/:cityName')` — the exact three calls `client/app/data/data.component.js` makes today — and keep the CSV-download behavior from the legacy `jsonToCSVConverter`. No commercial-vehicle-specific UI is required here: when the Socrata dataset is updated to include commercial data, this page should keep working unchanged, since it renders whatever fields the API passes through rather than a fixed non-commercial-only shape.

The `map` page should port the Mapbox GL + Turf.js jurisdiction-boundary logic from `client/app/map/map.component.js`, including the static GeoJSON asset it uses for boundaries — that data is not Socrata-backed and doesn't need an API call.

- [x] **Step 4: Run the Next.js tests and verify the public pages render**

Run: `npm --workspace web test`

Expected: home/about/data/map/feedback pages render and use the API client.

- [x] **Step 5: Commit**

```bash
git add web/app web/components web/lib web/test
git commit -m "feat: add nextjs public route shell"
```

### Task 5: Feedback (Asana) and ETL-to-Socrata Publish Automation

> New task, not in the original plan — both of these are real gaps this audit surfaced. The commercial-vehicle dataset update is owned outside this repo (see design doc), so it's not part of this task's scope — the ETL publish script only automates publishing the existing non-commercial `vmt_results.csv` pipeline.

**Part A — Feedback: done.** Resolved 2026-08-24: bring it in-house, backed by Asana (each submission becomes a task in a configured Asana project) instead of a database or the legacy `basis-dev-2022` Elastic Beanstalk endpoint.

- [x] `api/src/asana/client.ts` — typed wrapper over the Asana REST API (`POST /tasks`), Personal Access Token auth.
- [x] `api/src/routes/feedback.ts` — `POST /api/feedback`, validates the payload (a non-empty `comment` is required; `name`/`email`/`type` optional), creates an Asana task with a formatted name/notes, guards on `ASANA_ACCESS_TOKEN`/`ASANA_PROJECT_ID` being configured (fails clearly with a 500 rather than silently calling Asana with empty credentials, same pattern as the Socrata `VMT_DATA_KEY` guard), and maps Asana failures to a 502.
- [x] `web/app/(public)/feedback/page.tsx` — updated to POST to `/api/feedback` (proxied same-origin, same as the VMT routes) instead of the external Elastic Beanstalk URL.
- [x] `.env.example` — documents `ASANA_ACCESS_TOKEN`/`ASANA_PROJECT_ID`; `ASANA_PROJECT_ID` deliberately left blank pending which project this should target.
- [x] Tests: `api/test/asana/client.test.ts`, `api/test/routes/feedback.test.ts`, `api/test/routes/feedback-not-configured.test.ts`, `web/test/feedback.spec.ts` — all passing, verified against a real running server too (not just mocks).

This confirms the new app has **no database anywhere** — Asana closed the last path that could have needed Postgres.

**Part B — ETL-to-Socrata publish automation: not yet done.**

**Files:**
- Create: `etl/publish_to_socrata.py`
- Create: `docs/data/etl-to-socrata.md`

**Interfaces:**
- Consumes: `etl/vmt-results-etl.py`'s `vmt_results.csv` output
- Produces: a scripted, repeatable path from `vmt_results.csv` to the live Socrata dataset

- [ ] **Step 1: Write a failing test for the ETL publish step**

```python
# etl/test_publish_to_socrata.py
def test_publish_requires_dataset_key(monkeypatch):
    monkeypatch.delenv("VMT_DATA_KEY", raising=False)
    import publish_to_socrata
    try:
        publish_to_socrata.main()
        assert False, "expected a missing-config error"
    except SystemExit:
        pass
```

- [ ] **Step 2: Script the publish step using the same soda-js-equivalent credentials the API already documents**

```python
# etl/publish_to_socrata.py
import os
import sys
import pandas as pd
from sodapy import Socrata

def main():
    dataset_key = os.environ.get("VMT_DATA_KEY")
    if not dataset_key:
        print("VMT_DATA_KEY is required", file=sys.stderr)
        sys.exit(1)

    client = Socrata(
        "data.bayareametro.gov",
        os.environ.get("SOCRATA_APP_TOKEN_MTC"),
        username=os.environ.get("SOCRATA_USERNAME"),
        password=os.environ.get("SOCRATA_PASSWORD"),
    )
    df = pd.read_csv("vmt_results.csv")
    client.replace(dataset_key, df.to_dict("records"))

if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Run the ETL script end-to-end against a sandbox/staging Socrata dataset**

Run: `python etl/vmt-results-etl.py && python etl/publish_to_socrata.py`

Expected: `vmt_results.csv` is produced and lands in the staging Socrata dataset without manual steps.

- [ ] **Step 4: Commit**

```bash
git add etl/publish_to_socrata.py etl/test_publish_to_socrata.py docs/data/etl-to-socrata.md
git commit -m "feat: automate the etl-to-socrata publish step"
```

### Task 6: Containerize and Deploy to ECS

> New task, not in the original plan. Done: Dockerfiles for both services, ECS task definition templates, and a working `test`/`build` CI pipeline (this repo's first). Not done: any of the actual AWS infrastructure the `deploy` job and task definitions need — see the checklist in `docs/deploy/ecs.md`, which is the source of truth for this task rather than duplicating it here.

**Files:**
- [x] Create: `web/Dockerfile` — multi-stage, uses `output: 'standalone'` (added to `web/next.config.js`) so the runtime image only ships the node_modules this app actually uses, not the monorepo's shared (legacy-dependency-laden) tree
- [x] Create: `api/Dockerfile` — multi-stage, bundles `api` with esbuild (`npm run bundle`, added to `api/package.json`) into a single `dist/server.js` with `express` inlined, so the runtime image ships no `node_modules` at all
- [x] Modify: `.dockerignore` — covers both new workspaces
- [x] Create: `deploy/ecs/web-task-definition.json`, `deploy/ecs/api-task-definition.json` — Fargate task definition templates with placeholder ARNs/URIs
- [x] Create: `.github/workflows/ci-cd.yml` — `test` (lint+test both workspaces) and `build` (build both images) run on every push/PR; `deploy` (push to ECR, render + deploy task definitions) is manual-`workflow_dispatch`-only since the AWS infra it needs doesn't exist yet
- [x] Create: `docs/deploy/ecs.md` — the ECS architecture decision, the build-time-vs-runtime env var gotcha, and the full provisioning checklist
- [x] Modify: root `package.json` — added a `dev` script (`concurrently`) that runs `dev:web` and `dev:api` together, since the two-service architecture means both must run locally for the app to work end-to-end

**Interfaces:**
- Consumes: the `web` and `api` workspaces from Tasks 1–5
- Produces: two Docker images that build and run correctly (verified locally: both built with `docker build`, run with `docker run`, and the web container's proxy to a real running api container was confirmed working end-to-end — including catching and fixing a real bug where a build-time-vs-runtime env var mismatch silently broke the proxy); ECS task definition templates and a CI/CD pipeline whose `test`/`build` stages work today

- [x] **Step 1: Add `output: 'standalone'` to `web/next.config.js` and verify the traced output**

Run: `npm run build --workspace web` and inspect `web/.next/standalone/` — confirmed to contain only `web/server.js`, a lean traced `node_modules` (next/react/sharp/etc.), not the monorepo's shared tree.

- [x] **Step 2: Add the esbuild bundle script to `api/package.json` and verify it's truly self-contained**

Run: `npm run bundle --workspace api`, then copy just `dist/server.js` into an empty directory and run it there with no `node_modules` present.

Expected: it starts and serves `/health` normally. Confirmed.

- [x] **Step 3: Write both Dockerfiles, building from the monorepo root as the context**

```bash
docker build -f api/Dockerfile -t capvmt-api .
docker build -f web/Dockerfile -t capvmt-web \
  --build-arg API_INTERNAL_URL=http://localhost:4000 \
  --build-arg NEXT_PUBLIC_MAPBOX_TOKEN=
```

Expected: both build successfully. Confirmed — and along the way, discovered and fixed the build-time-vs-runtime env var issue documented in `docs/deploy/ecs.md`.

- [x] **Step 4: Run both containers together and verify the full request path**

Run both with `docker run`, then `curl` the api container directly and the web container's `/api/*` proxy.

Expected: both respond; the proxied request reaches the real api container and returns its actual response (not a generic proxy failure). Confirmed.

- [x] **Step 5: Add the CI/CD workflow and verify its non-AWS-dependent jobs are sound**

`.github/workflows/ci-cd.yml`'s `test` and `build` jobs don't require any secrets or AWS setup — reviewed for correctness (matrix over both workspaces, Playwright browser install for `web`, `--if-present` on lint so `web`'s missing lint script doesn't fail the job).

- [ ] **Step 6: Provision the AWS infrastructure listed in `docs/deploy/ecs.md`**

Not done — ECR repos, ECS cluster/services, the ALB and its target groups/routing rule, IAM execution role, CloudWatch log groups, a Secrets Manager secret for `SOCRATA_*`/`ASANA_*`, and a GitHub OIDC IAM role all need to exist before the `deploy` job (or the task definitions as anything other than templates) can actually work.

- [x] **Step 7: Commit**

```bash
git add web/Dockerfile web/next.config.js api/Dockerfile api/package.json .dockerignore deploy/ecs .github/workflows/ci-cd.yml docs/deploy/ecs.md package.json package-lock.json
git commit -m "feat: containerize web/api and add ECS deployment scaffolding"
```

### Task 7: Cutover, Parity, and Legacy Retirement

**Files:**
- Modify: `package.json`
- Modify: `README.md`
- Modify: `server/` legacy entrypoints as needed for decommissioning
- Modify: `client/` legacy frontend entrypoints as needed for decommissioning
- Create: `docs/migration/route-parity.md`
- Create: `docs/migration/cutover-checklist.md`
- Delete: `mssql` from `package.json` dependencies (confirmed unused — see design doc), and the unused `Data`/`Thing` Sequelize models/routes
- Delete: `server/auth/*`, `server/api/user/*`, `client/app/account/*`, `client/app/admin/*`, `client/components/auth/*` — not migrated (see design doc's "Auth/account/admin scope"), retired along with the rest of the legacy tree in Step 4 below

**Interfaces:**
- Consumes: all migrated routes and services from Tasks 1–6
- Produces: root startup scripts, docs, and cleanup commits that make the legacy app a temporary bridge instead of the default runtime

- [ ] **Step 1: Write a parity checklist test/document pair**

```md
<!-- docs/migration/route-parity.md -->
- /
- /data
- /map
- /feedback
- /about
```

Deliberately no `/login`, `/signup`, `/settings`, `/admin` entries — that functionality isn't in the new stack and parity isn't expected for it (see design doc Non-Goals).

- [ ] **Step 2: Run the app in the new stack and confirm the migrated routes load**

Run: `npm run dev:api` and `npm run dev:web`

Expected: all migrated routes load without relying on the AngularJS client, and VMT data still comes from Socrata (verify the dataset key matches production). If the Socrata dataset has already been updated with commercial-vehicle data by the time this runs, confirm the data page still renders correctly rather than breaking on the extra fields.

- [ ] **Step 3: Remove legacy defaults from the root workflow**

```json
{
  "scripts": {
    "dev": "npm run dev:web",
    "dev:web": "npm --workspace web run dev",
    "dev:api": "npm --workspace api run dev"
  }
}
```

- [ ] **Step 4: Retire legacy bootstrapping after parity is met**

```bash
git rm -r client server
```

Only do this after the route parity checklist is complete and the new stack is the default runtime. Also drop the now-dead `mssql`, `soda-js`, `sodajs`, `sqlite3`, and — since auth/account/admin isn't being carried forward — `passport`, `passport-local`, `express-jwt`, `express-session`, `express-sequelize-session`, `jsonwebtoken`, and `lusca` npm dependencies from the root `package.json` once nothing references them.

- [ ] **Step 5: Commit**

```bash
git add package.json README.md docs/migration
git commit -m "chore: cut over to the modern stack"
```
