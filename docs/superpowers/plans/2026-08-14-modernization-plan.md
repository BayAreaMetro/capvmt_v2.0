# Application Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Updated 2026-08-24** after auditing this repo (`capvmt_v2.0`, the current/latest version of the app). The prior version of this plan (ported from the CAPVMT repo's modernization worktree) assumed the app's data layer was SQL-Server-backed and needed a wholesale migration to Postgres. That's not what this codebase does: VMT reporting data already comes from **Socrata** via `soda-js` (`server/api/data/data.controller.js`), and `mssql` is an unused, dead npm dependency. Only auth/user data (and the unused `Data`/`Thing` CRUD scaffolding) lives in a local SQLite file via Sequelize. Tasks below are rewritten to match the real endpoints, real data sources, and real gaps found in this repo. See `docs/superpowers/specs/2026-08-14-modernization-design.md` for the full analysis.
>
> **Updated again 2026-08-24:** added a new requirement — the app currently publishes non-commercial (passenger) VMT only, confirmed in `client/app/about/about.html` and `client/app/data/data.html`, and structurally in the ETL pipeline (person-trip tables only). The modernized app needs to show both non-commercial and commercial VMT stats. That data doesn't exist anywhere in this repo today, so Task 2 below is new and is a prerequisite for the tasks that follow it — all Socrata-client, API, and UI tasks after it now carry a `vehicleType` dimension.

**Goal:** Rebuild the app on Next.js and a separate Node API, keeping Socrata as the system of record for VMT reporting data, **adding commercial-vehicle VMT alongside the existing non-commercial VMT data** so both are shown, and moving operational data (auth/users) off the ad hoc SQLite file, while preserving current behavior.

**Architecture:** Stand up the new stack beside the legacy app, then migrate one surface at a time behind explicit API contracts. Keep frontend, API, Socrata, and operational-database boundaries strict so each layer can be tested independently and the old app can be retired without a big-bang rewrite.

**Tech Stack:** Next.js (App Router, TypeScript), Node.js API (Express + TypeScript), a typed Socrata (SODA API) client covering both non-commercial and commercial VMT series, PostgreSQL + Prisma (operational data only — auth/users, optionally feedback), Vitest, Playwright, supertest.

## Global Constraints

- The end state should preserve current product behavior while removing the oldest platform constraints and making future feature work safer and faster.
- Use an incremental strangler approach.
- Socrata stays the source of truth for VMT reporting data unless an explicit later decision says otherwise (see design doc Open Decisions) — do not silently duplicate it into a new warehouse.
- Commercial-vehicle VMT is new data, not an existing field to expose — do not write code against an assumed dataset/schema for it until Task 2 resolves where it actually comes from.
- Database access (Postgres and Socrata) stays inside the backend. Frontend code should never talk to either directly.
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

- [ ] **Step 1: Write a failing workspace sanity test**

```ts
// api/test/sanity.test.ts
import { describe, it, expect } from 'vitest';

describe('workspace sanity', () => {
  it('exports a web and api package', () => {
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test command and confirm the workspace does not yet exist**

Run: `npm test`

Expected: failure until the new workspace scripts and package roots exist.

- [ ] **Step 3: Add the modern workspace shell**

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
DATABASE_URL=postgres://localhost:5432/capvmt
SESSION_SECRET=
```

- [ ] **Step 4: Run the workspace commands**

Run: `npm run dev:api` and `npm run dev:web`

Expected: both services start cleanly.

- [ ] **Step 5: Commit**

```bash
git add package.json web api .env.example docker-compose.yml
git commit -m "chore: add modern workspace scaffolding"
```

### Task 2: Commercial Vehicle VMT Data Sourcing (prerequisite research/definition)

> New task, not in the original plan. This is the answer to "the new version needs to handle both non-commercial and commercial vehicles" — and the honest finding is that this data doesn't exist anywhere yet. This task is deliberately **not** scaffolding-heavy like the others: most of the work is research and coordination, not code, and it blocks the `vehicleType` parts of Tasks 3–5, 7, and 8. Do not let it become a silent blocker — timebox the research and escalate if no source is found, per the design doc's risk note.

**This task is not primarily engineering work.** Treat the checklist below as a decision-gathering process, not a coding task list.

- [ ] **Step 1: Confirm there's truly no existing commercial VMT source**

Re-check, since sources can change: search `travel-model-one` (linked from `etl/readme.md`) and any adjacent MTC travel-model repos for a commercial-vehicle or truck sub-model that produces person-trip-equivalent tables per model run. Search MTC's Socrata catalog (`data.bayareametro.gov`) for any existing commercial/truck/freight VMT dataset, in case one exists outside this app's current `VMT_DATA_KEY` dataset. Confirm with the modeling team directly rather than relying only on repo search.

Expected: either a source is found (skip to Step 4 and adjust scope) or the "doesn't exist yet" finding from this audit is confirmed.

- [ ] **Step 2: If no source exists, scope how it gets produced**

This is a decision for the modeling/product team, not something to default silently. Options to bring to them:
- A commercial/truck sub-model added to the travel demand model (a modeling deliverable, likely weeks not days — see the design doc's risk note)
- A third-party or public dataset (e.g. Caltrans HPMS truck AADT, FHWA freight data) approximated to jurisdiction boundaries
- A simplified estimate derived from existing model outputs, if the modeling team has a defensible method

Record the decision and its owner/timeline in `docs/superpowers/specs/2026-08-14-modernization-design.md`'s Open Decisions section.

- [ ] **Step 3: Once a source is chosen, define its shape to match the existing non-commercial pipeline**

Whatever the source, get it into a `model_run` + `cityname`-keyed table comparable to `vmt_results.csv`'s output (see `etl/vmt-results-etl.py`), so Task 7's ETL automation and Task 3's Socrata client can treat commercial and non-commercial symmetrically. Document the chosen storage shape (new `vehicle_type` column on the existing Socrata dataset vs. a second dataset vs. a Postgres table) in `docs/data/commercial-vmt-source.md`.

- [ ] **Step 4: Unblock downstream tasks with an explicit contract, even if production data isn't ready**

Write down the exact shape (field names, types, dataset key or table name) the API and frontend should assume for commercial VMT, so Tasks 3–5 can build and test against a mock/fixture without waiting on the real data pipeline to finish. This lets engineering work proceed in parallel with the modeling/sourcing work from Step 2.

- [ ] **Step 5: Commit the findings**

```bash
git add docs/superpowers/specs/2026-08-14-modernization-design.md docs/data/commercial-vmt-source.md
git commit -m "docs: define commercial-vehicle VMT data source and contract"
```

### Task 3: Socrata Client and Operational Postgres Schema

> Replaces the original "PostgreSQL Schema and Import Path" task. There is no SQL Server or legacy warehouse to import from — VMT data already lives in Socrata. This task has three parts: (a) a typed wrapper around the existing non-commercial Socrata integration, (b) the equivalent for the commercial-vehicle source defined in Task 2, and (c) a small Postgres schema for the operational data (auth/users) that's currently sitting in an ad hoc SQLite file.

**Files:**
- Create: `api/src/socrata/client.ts`
- Create: `api/src/socrata/vmt.ts`
- Create: `api/prisma/schema.prisma` (operational data only: `User`, session table; not VMT data)
- Create: `api/prisma/migrations/0001_init/migration.sql`
- Create: `api/src/db/prisma.ts`
- Create: `api/scripts/import-legacy-users.ts` (reads the existing `dev.sqlite`/`dist.sqlite` `Users` table and loads it into Postgres)
- Create: `docs/data/socrata-integration.md`

**Interfaces:**
- Consumes: `VMT_DATA_KEY`, `SOCRATA_USERNAME`, `SOCRATA_PASSWORD`, `SOCRATA_APP_TOKEN_MTC` from env; the commercial-VMT source contract defined in Task 2 (dataset key/table TBD there); the existing SQLite `User` table (`server/api/user/user.model.js`) as the import source
- Produces: a `SocrataVmtClient` with `getJurisdictions()`, `getVmtByJurisdiction(modelRun, cityName, vehicleType)`, `getModelRunYears()` methods — `vehicleType` defaults to `'non_commercial'` and accepts `'commercial'` once Task 2's source is wired in — that later tasks call instead of hitting `soda-js` directly from route handlers; a Prisma-backed `User` model for auth

- [ ] **Step 1: Write failing tests for the Socrata client contract and the Postgres schema**

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

```ts
// api/test/schema.test.ts
import { describe, it, expect } from 'vitest';

describe('operational database schema', () => {
  it('defines a User table for auth, not VMT data', () => {
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 2: Run the tests and confirm the client/schema are absent**

Run: `npm --workspace api test` and `npm --workspace api exec prisma validate`

Expected: failure until `socrata/vmt.ts` and `schema.prisma` exist.

- [ ] **Step 3: Wrap the existing Socrata contract in a typed client**

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

  // Replaces the legacy #getVMTbyJurisdiction where/limit query.
  // vehicleType selects which source to query — the non_commercial dataset is
  // the one that exists today; the commercial dataset/table comes from Task 2's
  // sourcing work and may need a different query shape once that's resolved.
  getVmtByJurisdiction(modelRun: string, cityName: string, vehicleType: 'non_commercial' | 'commercial' = 'non_commercial') {
    if (vehicleType === 'commercial') {
      // Placeholder until Task 2 defines the real commercial-vehicle source and shape.
      throw new Error('Commercial VMT source not yet configured — see docs/data/commercial-vmt-source.md');
    }
    return this.client.query({ model_run: modelRun, cityname: cityName, $limit: '200' });
  }

  // Finishes the migration the legacy code left commented out in #getYears —
  // today that endpoint returns a hardcoded array instead of querying Socrata
  getModelRunYears() {
    return this.client.query({ $select: 'model_run', $group: 'model_run', $order: 'model_run' });
  }
}
```

- [ ] **Step 4: Model the operational Postgres schema (auth only — not VMT data)**

```prisma
// api/prisma/schema.prisma
model User {
  id        Int      @id @default(autoincrement())
  provider  String
  role      String   @default("user")
  name      String
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
}
```

- [ ] **Step 5: Run migration, Socrata client test, and the legacy-user import script against a copy of `dev.sqlite`**

Run: `npm --workspace api exec prisma migrate dev`, `npm --workspace api test`, `npm --workspace api run import-legacy-users`

Expected: migration applies, Socrata client tests pass against a mocked/sandboxed dataset, and existing users carry over.

- [ ] **Step 6: Commit**

```bash
git add api/src/socrata api/prisma api/src/db api/scripts docs/data/socrata-integration.md
git commit -m "feat: add typed socrata client and operational postgres schema"
```

### Task 4: Core Node API and Read Endpoints

> Endpoints match the real legacy contract in `server/api/data/index.js` and `server/routes.js`, extended with a `vehicleType` dimension for the new commercial-vehicle requirement.

**Files:**
- Create: `api/src/routes/health.ts`
- Create: `api/src/routes/vmt.ts` (serves `years/all`, `jurisdictions/all`, `vmt/:modelRun/:cityName` via `SocrataVmtClient`, both vehicle types)
- Create: `api/src/lib/http-errors.ts`
- Create: `api/src/lib/request-context.ts`
- Create: `api/test/routes/health.test.ts`
- Create: `api/test/routes/vmt.test.ts`

**Interfaces:**
- Consumes: `SocrataVmtClient` from Task 3
- Produces: `GET /health`, `GET /api/data/years/all`, `GET /api/data/jurisdictions/all`, `GET /api/data/vmt/:modelRun/:cityName` with JSON responses usable by the new frontend — the same paths the legacy Angular client already calls (so the frontend migration in Task 5 doesn't need parallel contract changes for the existing non-commercial data), **plus a `?vehicleType=non_commercial|commercial` query param on `vmt/:modelRun/:cityName` that returns both series when omitted** (`{ nonCommercial: [...], commercial: [...] }`), so the frontend can render the two side by side without two round trips

- [ ] **Step 1: Write a failing route test for the health endpoint**

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

- [ ] **Step 2: Run the test and confirm the route is missing**

Run: `npm --workspace api test -- --runInBand api/test/routes/health.test.ts`

Expected: 404 or route-not-found failure.

- [ ] **Step 3: Implement the route layer over the Socrata client**

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
    const { modelRun, cityName } = req.params;
    const requested = req.query.vehicleType as 'non_commercial' | 'commercial' | undefined;

    if (requested) {
      res.json(await client.getVmtByJurisdiction(modelRun, cityName, requested));
      return;
    }

    // No vehicleType given: return both series so the frontend can show them together.
    const [nonCommercial, commercial] = await Promise.allSettled([
      client.getVmtByJurisdiction(modelRun, cityName, 'non_commercial'),
      client.getVmtByJurisdiction(modelRun, cityName, 'commercial'),
    ]);

    res.json({
      nonCommercial: nonCommercial.status === 'fulfilled' ? nonCommercial.value : [],
      commercial: commercial.status === 'fulfilled' ? commercial.value : [],
    });
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

- [ ] **Step 4: Run the route tests and the API smoke test**

Run: `npm --workspace api test`

Expected: health and VMT read endpoints return stable JSON, sourced from Socrata (mocked in tests).

- [ ] **Step 5: Commit**

```bash
git add api/src/routes api/src/app.ts api/test/routes
git commit -m "feat: add core api routes over the socrata client"
```

### Task 5: Next.js Shell and Public Routes

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
- Consumes: API base URL from `web/lib/api.ts`, routes from Task 4
- Produces: Next.js pages that replace the legacy AngularJS public screens and call the Node API only

- [ ] **Step 1: Write a failing page test**

```ts
// web/test/home.spec.ts
import { test, expect } from '@playwright/test';

test('home page renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Modernization shell')).toBeVisible();
});
```

- [ ] **Step 2: Run the browser test and confirm the page is not yet implemented**

Run: `npm --workspace web test`

Expected: failure until the Next.js app and routes exist.

- [ ] **Step 3: Build the shared shell and route pages**

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

The `data` page should call `apiGet('/api/data/years/all')`, `apiGet('/api/data/jurisdictions/all')`, and `apiGet('/api/data/vmt/:modelRun/:cityName')` — the exact three calls `client/app/data/data.component.js` makes today — and keep the CSV-download behavior from the legacy `jsonToCSVConverter`.

**New requirement:** the `vmt/:modelRun/:cityName` call now returns `{ nonCommercial, commercial }` (Task 4). Render both series — the legacy page's existing "Non-commercial Passenger Vehicle Miles Traveled" table/totals plus an equivalent commercial-vehicle table/totals, both scoped to the same jurisdiction and model run. The exact layout (side-by-side columns, stacked sections, or a toggle) is a design/product call, not decided here (see design doc Open Decisions) — but the data-fetching and CSV export should carry both series regardless of which layout is chosen. If Task 2's commercial-vehicle source isn't ready yet when this task runs, render the commercial section with a clear "not yet available" state rather than blocking the non-commercial migration on it.

The `map` page should port the Mapbox GL + Turf.js jurisdiction-boundary logic from `client/app/map/map.component.js`, including the static GeoJSON asset it uses for boundaries — that data is not Socrata-backed and doesn't need an API call.

- [ ] **Step 4: Run the Next.js tests and verify the public pages render**

Run: `npm --workspace web test`

Expected: home/about/data/map/feedback pages render and use the API client.

- [ ] **Step 5: Commit**

```bash
git add web/app web/components web/lib web/test
git commit -m "feat: add nextjs public route shell"
```

### Task 6: Auth, Account, and Admin Migration

> The legacy auth stack (`server/auth/*`, `client/app/account`, `client/app/admin`) is genuinely live today — unlike the `Data`/`Thing` CRUD scaffolding, this is real and used for login/signup/admin gating in the navbar (`isLoggedIn()`, `isAdmin()`). It's backed by the SQLite `User` table being migrated to Postgres in Task 3. Not affected by the commercial-vehicle requirement.

**Files:**
- Create: `api/src/routes/auth.ts`
- Create: `api/src/routes/users.ts`
- Create: `api/src/auth/session.ts`
- Create: `web/app/(auth)/login/page.tsx`
- Create: `web/app/(auth)/signup/page.tsx`
- Create: `web/app/(account)/settings/page.tsx`
- Create: `web/app/(admin)/page.tsx`
- Create: `api/test/routes/auth.test.ts`
- Create: `web/test/auth.spec.ts`

**Interfaces:**
- Consumes: current auth expectations from `client/components/auth/*`, `server/auth/*`, and the Postgres `User` model from Task 3
- Produces: login/logout/session APIs plus migrated account/admin screens in Next.js

- [ ] **Step 1: Write a failing auth contract test**

```ts
// api/test/routes/auth.test.ts
import request from 'supertest';
import { app } from '../../src/app';

describe('auth', () => {
  it('exposes a session endpoint', async () => {
    await request(app).get('/api/auth/session').expect(200);
  });
});
```

- [ ] **Step 2: Run the auth test and confirm the contract is missing**

Run: `npm --workspace api test -- --runInBand api/test/routes/auth.test.ts`

Expected: route not found.

- [ ] **Step 3: Add session-backed auth and the matching Next.js forms**

```ts
// api/src/routes/auth.ts
import { Router } from 'express';

export const authRouter = Router();

authRouter.get('/session', (_req, res) => res.json({ authenticated: false }));
```

```tsx
// web/app/(auth)/login/page.tsx
export default function LoginPage() {
  return <form>Login</form>;
}
```

- [ ] **Step 4: Run auth integration and browser tests**

Run: `npm --workspace api test` and `npm --workspace web test`

Expected: auth/session flow works end-to-end enough for migrated pages, including the admin-only nav gating.

- [ ] **Step 5: Commit**

```bash
git add api/src/routes/auth.ts api/src/auth web/app/(auth) web/app/(account) web/app/(admin) api/test/routes/auth.test.ts web/test/auth.spec.ts
git commit -m "feat: migrate auth and account surfaces"
```

### Task 7: Feedback Decision and ETL-to-Socrata Publish Automation

> New task, not in the original plan — real gaps this audit surfaced. Now also covers wiring the commercial-vehicle ETL step defined in Task 2 into the same publish automation, once that source exists.

**Files:**
- Modify or create: `api/src/routes/feedback.ts` (only if the decision below is "bring in-house")
- Create: `web/app/(public)/feedback/page.tsx` updates to point at the new endpoint or explicitly keep the external one
- Create: `etl/publish_to_socrata.py`
- Create: `docs/data/etl-to-socrata.md`

**Interfaces:**
- Consumes: the product decision on feedback (see design doc Open Decisions), `etl/vmt-results-etl.py`'s `vmt_results.csv` output, and the commercial-vehicle ETL/source contract from Task 2 (if ready by this point — otherwise this step covers non-commercial only and gets revisited when Task 2 lands)
- Produces: either an in-house `/api/feedback` endpoint, or documentation that the `basis-dev-2022` Elastic Beanstalk integration is intentional; and a scripted, repeatable path from `vmt_results.csv` (and its commercial-vehicle counterpart, once it exists) to the live Socrata dataset(s)

- [ ] **Step 1: Resolve the feedback decision with product/stakeholders**

This is a product call, not a technical one — record the answer in `docs/superpowers/specs/2026-08-14-modernization-design.md`'s Open Decisions section before writing code.

- [ ] **Step 2: Write a failing test for the ETL publish step**

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

- [ ] **Step 3: Script the publish step using the same soda-js-equivalent credentials the API already documents**

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

- [ ] **Step 4: Run the ETL script end-to-end against a sandbox/staging Socrata dataset**

Run: `python etl/vmt-results-etl.py && python etl/publish_to_socrata.py`

Expected: `vmt_results.csv` is produced and lands in the staging Socrata dataset without manual steps.

- [ ] **Step 5: If Task 2's commercial-vehicle source is ready, extend the publish script to cover it**

Follow the storage shape decided in Task 2 (new dataset, added column, or Postgres table) — this may mean a second `dataset_key` argument to `publish_to_socrata.py`, or an entirely separate script if the commercial source doesn't fit the same CSV-to-Socrata shape as `vmt_results.csv`. If Task 2 hasn't landed a real source yet, skip this step and note it as follow-up work rather than blocking the rest of this task.

- [ ] **Step 6: Commit**

```bash
git add etl/publish_to_socrata.py etl/test_publish_to_socrata.py docs/data/etl-to-socrata.md
git commit -m "feat: automate the etl-to-socrata publish step"
```

### Task 8: Cutover, Parity, and Legacy Retirement

**Files:**
- Modify: `package.json`
- Modify: `README.md`
- Modify: `server/` legacy entrypoints as needed for decommissioning
- Modify: `client/` legacy frontend entrypoints as needed for decommissioning
- Create: `docs/migration/route-parity.md`
- Create: `docs/migration/cutover-checklist.md`
- Delete: `mssql` from `package.json` dependencies (confirmed unused — see design doc), and the unused `Data`/`Thing` Sequelize models/routes

**Interfaces:**
- Consumes: all migrated routes and services from Tasks 1–7
- Produces: root startup scripts, docs, and cleanup commits that make the legacy app a temporary bridge instead of the default runtime

- [ ] **Step 1: Write a parity checklist test/document pair**

```md
<!-- docs/migration/route-parity.md -->
- /
- /data (non-commercial VMT — parity with legacy)
- /data (commercial VMT — new, not in legacy; verify against Task 2's contract, not the old app)
- /map
- /feedback
- /about
- /login
- /signup
- /settings
- /admin
```

- [ ] **Step 2: Run the app in the new stack and confirm the migrated routes load**

Run: `npm run dev:api` and `npm run dev:web`

Expected: all migrated routes load without relying on the AngularJS client, non-commercial VMT data still matches the legacy Socrata source (verify the dataset key matches production), and commercial VMT data renders from whatever source Task 2 landed (or shows the explicit "not yet available" state if it hasn't).

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

Only do this after the route parity checklist is complete and the new stack is the default runtime. Also drop the now-dead `mssql`, `soda-js`, `sodajs`, and `sqlite3` npm dependencies from the root `package.json` once nothing references them.

- [ ] **Step 5: Commit**

```bash
git add package.json README.md docs/migration
git commit -m "chore: cut over to the modern stack"
```
