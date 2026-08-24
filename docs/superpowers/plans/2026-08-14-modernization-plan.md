# Application Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Updated 2026-08-24** after auditing this repo (`capvmt_v2.0`, the current/latest version of the app). The prior version of this plan (ported from the CAPVMT repo's modernization worktree) assumed the app's data layer was SQL-Server-backed and needed a wholesale migration to Postgres. That's not what this codebase does: VMT reporting data already comes from **Socrata** via `soda-js` (`server/api/data/data.controller.js`), and `mssql` is an unused, dead npm dependency. Only auth/user data (and the unused `Data`/`Thing` CRUD scaffolding) lives in a local SQLite file via Sequelize. Tasks below are rewritten to match the real endpoints, real data sources, and real gaps found in this repo. See `docs/superpowers/specs/2026-08-14-modernization-design.md` for the full analysis.

**Goal:** Rebuild the app on Next.js and a separate Node API, keeping Socrata as the system of record for VMT reporting data and moving operational data (auth/users) off the ad hoc SQLite file, while preserving current behavior.

**Architecture:** Stand up the new stack beside the legacy app, then migrate one surface at a time behind explicit API contracts. Keep frontend, API, Socrata, and operational-database boundaries strict so each layer can be tested independently and the old app can be retired without a big-bang rewrite.

**Tech Stack:** Next.js (App Router, TypeScript), Node.js API (Express + TypeScript), a typed Socrata (SODA API) client, PostgreSQL + Prisma (operational data only — auth/users, optionally feedback), Vitest, Playwright, supertest.

## Global Constraints

- The end state should preserve current product behavior while removing the oldest platform constraints and making future feature work safer and faster.
- Use an incremental strangler approach.
- Socrata stays the source of truth for VMT reporting data unless an explicit later decision says otherwise (see design doc Open Decisions) — do not silently duplicate it into a new warehouse.
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

### Task 2: Socrata Client and Operational Postgres Schema

> Replaces the original "PostgreSQL Schema and Import Path" task. There is no SQL Server or legacy warehouse to import from — VMT data already lives in Socrata. This task has two independent halves: (a) a typed wrapper around the existing Socrata integration, and (b) a small Postgres schema for the operational data (auth/users) that's currently sitting in an ad hoc SQLite file.

**Files:**
- Create: `api/src/socrata/client.ts`
- Create: `api/src/socrata/vmt.ts`
- Create: `api/prisma/schema.prisma` (operational data only: `User`, session table; not VMT data)
- Create: `api/prisma/migrations/0001_init/migration.sql`
- Create: `api/src/db/prisma.ts`
- Create: `api/scripts/import-legacy-users.ts` (reads the existing `dev.sqlite`/`dist.sqlite` `Users` table and loads it into Postgres)
- Create: `docs/data/socrata-integration.md`

**Interfaces:**
- Consumes: `VMT_DATA_KEY`, `SOCRATA_USERNAME`, `SOCRATA_PASSWORD`, `SOCRATA_APP_TOKEN_MTC` from env; the existing SQLite `User` table (`server/api/user/user.model.js`) as the import source
- Produces: a `SocrataVmtClient` with `getJurisdictions()`, `getVmtByJurisdiction(modelRun, cityName)`, `getModelRunYears()` methods that later tasks call instead of hitting `soda-js` directly from route handlers; a Prisma-backed `User` model for auth

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

  // Replaces the legacy #getVMTbyJurisdiction where/limit query
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
- Produces: `GET /health`, `GET /api/data/years/all`, `GET /api/data/jurisdictions/all`, `GET /api/data/vmt/:modelRun/:cityName` with JSON responses usable by the new frontend — the same paths the legacy Angular client already calls, so the frontend migration in Task 4 doesn't need parallel contract changes

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

- [ ] **Step 4: Run the route tests and the API smoke test**

Run: `npm --workspace api test`

Expected: health and VMT read endpoints return stable JSON, sourced from Socrata (mocked in tests).

- [ ] **Step 5: Commit**

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

The `map` page should port the Mapbox GL + Turf.js jurisdiction-boundary logic from `client/app/map/map.component.js`, including the static GeoJSON asset it uses for boundaries — that data is not Socrata-backed and doesn't need an API call.

- [ ] **Step 4: Run the Next.js tests and verify the public pages render**

Run: `npm --workspace web test`

Expected: home/about/data/map/feedback pages render and use the API client.

- [ ] **Step 5: Commit**

```bash
git add web/app web/components web/lib web/test
git commit -m "feat: add nextjs public route shell"
```

### Task 5: Auth, Account, and Admin Migration

> The legacy auth stack (`server/auth/*`, `client/app/account`, `client/app/admin`) is genuinely live today — unlike the `Data`/`Thing` CRUD scaffolding, this is real and used for login/signup/admin gating in the navbar (`isLoggedIn()`, `isAdmin()`). It's backed by the SQLite `User` table being migrated to Postgres in Task 2.

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
- Consumes: current auth expectations from `client/components/auth/*`, `server/auth/*`, and the Postgres `User` model from Task 2
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

### Task 6: Feedback Decision and ETL-to-Socrata Publish Automation

> New task, not in the original plan — both of these are real gaps this audit surfaced.

**Files:**
- Modify or create: `api/src/routes/feedback.ts` (only if the decision below is "bring in-house")
- Create: `web/app/(public)/feedback/page.tsx` updates to point at the new endpoint or explicitly keep the external one
- Create: `etl/publish_to_socrata.py`
- Create: `docs/data/etl-to-socrata.md`

**Interfaces:**
- Consumes: the product decision on feedback (see design doc Open Decisions), and `etl/vmt-results-etl.py`'s `vmt_results.csv` output
- Produces: either an in-house `/api/feedback` endpoint, or documentation that the `basis-dev-2022` Elastic Beanstalk integration is intentional; and a scripted, repeatable path from `vmt_results.csv` to the live Socrata dataset

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

- [ ] **Step 5: Commit**

```bash
git add etl/publish_to_socrata.py etl/test_publish_to_socrata.py docs/data/etl-to-socrata.md
git commit -m "feat: automate the etl-to-socrata publish step"
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
- /login
- /signup
- /settings
- /admin
```

- [ ] **Step 2: Run the app in the new stack and confirm the migrated routes load**

Run: `npm run dev:api` and `npm run dev:web`

Expected: all migrated routes load without relying on the AngularJS client, and VMT data still comes from Socrata (verify the dataset key matches production).

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
