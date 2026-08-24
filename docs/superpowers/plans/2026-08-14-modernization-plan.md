# Application Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the app on Next.js, a separate Node API, and PostgreSQL while preserving current behavior.

**Architecture:** Stand up the new stack beside the legacy app, then migrate one surface at a time behind explicit API contracts. Keep frontend, API, and database boundaries strict so each layer can be tested independently and the old app can be retired without a big-bang rewrite.

**Tech Stack:** Next.js (App Router, TypeScript), Node.js API (Express + TypeScript), PostgreSQL, Prisma, Vitest, Playwright, supertest.

## Global Constraints

- The end state should preserve current product behavior while removing the oldest platform constraints and making future feature work safer and faster.
- Use an incremental strangler approach.
- Database access stays inside the backend. Frontend code should never know about PostgreSQL directly.
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
- Consumes: current root scripts in `package.json`, current legacy app entry points in `server/app.js` and `client/index.html`
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

- [ ] **Step 4: Run the workspace commands**

Run: `npm run dev:api` and `npm run dev:web`

Expected: both services start cleanly.

- [ ] **Step 5: Commit**

```bash
git add package.json web api .env.example docker-compose.yml
git commit -m "chore: add modern workspace scaffolding"
```

### Task 2: PostgreSQL Schema and Import Path

**Files:**
- Create: `api/prisma/schema.prisma`
- Create: `api/prisma/migrations/0001_init/migration.sql`
- Create: `api/src/db/prisma.ts`
- Create: `api/src/db/repositories/*.ts`
- Create: `api/scripts/import-legacy-data.ts`
- Create: `api/scripts/verify-import.ts`
- Create: `docs/data/postgres-migration.md`

**Interfaces:**
- Consumes: PostgreSQL connection string from `.env.example`, legacy SQL Server data assumptions from `README.md` and `server/config/environment/*.js`
- Produces: Prisma client accessors, database migrations, and repeatable import/verification scripts for later API tasks

- [ ] **Step 1: Write a failing schema validation test**

```ts
// api/test/schema.test.ts
import { describe, it, expect } from 'vitest';

describe('database schema', () => {
  it('defines the core tables needed by the migrated API', () => {
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 2: Run the database tooling and confirm schema files are absent**

Run: `npm --workspace api exec prisma validate`

Expected: failure until `schema.prisma` exists.

- [ ] **Step 3: Model the initial PostgreSQL schema**

```prisma
// api/prisma/schema.prisma
model Place {
  id        Int      @id @default(autoincrement())
  cityName  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model VmtResult {
  id        Int      @id @default(autoincrement())
  placeId   Int
  modelRun  String
  cityName  String
}
```

```ts
// api/scripts/verify-import.ts
import { prisma } from '../src/db/prisma';

async function main() {
  const count = await prisma.place.count();
  console.log({ count });
}

main().finally(() => prisma.$disconnect());
```

- [ ] **Step 4: Run migration and import verification commands**

Run: `npm --workspace api exec prisma migrate dev` and `npm --workspace api run verify-import`

Expected: migration applies and import verification can connect to PostgreSQL.

- [ ] **Step 5: Commit**

```bash
git add api/prisma api/src/db api/scripts docs/data/postgres-migration.md
git commit -m "feat: add postgres schema and import path"
```

### Task 3: Core Node API and Read Endpoints

**Files:**
- Create: `api/src/routes/health.ts`
- Create: `api/src/routes/places.ts`
- Create: `api/src/routes/modelruns.ts`
- Create: `api/src/routes/vmt.ts`
- Create: `api/src/routes/feedback.ts`
- Create: `api/src/lib/http-errors.ts`
- Create: `api/src/lib/request-context.ts`
- Create: `api/test/routes/health.test.ts`
- Create: `api/test/routes/places.test.ts`
- Create: `api/test/routes/vmt.test.ts`

**Interfaces:**
- Consumes: `prisma` from `api/src/db/prisma.ts`, core models from Task 2
- Produces: `GET /health`, `GET /api/places`, `GET /api/modelruns`, `GET /api/vmt/:id`, `GET /api/feedback` with JSON responses usable by the new frontend

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

- [ ] **Step 3: Implement the route layer and query adapters**

```ts
// api/src/routes/places.ts
import { Router } from 'express';
import { prisma } from '../db/prisma';

export const placesRouter = Router();

placesRouter.get('/', async (_req, res, next) => {
  try {
    const places = await prisma.place.findMany({ select: { id: true, cityName: true } });
    res.json(places);
  } catch (error) {
    next(error);
  }
});
```

```ts
// api/src/app.ts
import express from 'express';
import { healthRouter } from './routes/health';
import { placesRouter } from './routes/places';

export const app = express();
app.use(express.json());
app.use('/health', healthRouter);
app.use('/api/places', placesRouter);
```

- [ ] **Step 4: Run the route tests and the API smoke test**

Run: `npm --workspace api test`

Expected: health and read endpoints return stable JSON.

- [ ] **Step 5: Commit**

```bash
git add api/src/routes api/src/app.ts api/test/routes
git commit -m "feat: add core postgres-backed api routes"
```

### Task 4: Next.js Shell and Public Routes

**Files:**
- Create: `web/app/(public)/layout.tsx`
- Create: `web/app/(public)/page.tsx`
- Create: `web/app/(public)/about/page.tsx`
- Create: `web/app/(public)/data/page.tsx`
- Create: `web/app/(public)/explorer/page.tsx`
- Create: `web/app/(public)/feedback/page.tsx`
- Create: `web/components/site-nav.tsx`
- Create: `web/lib/api.ts`
- Create: `web/test/home.spec.ts`
- Create: `web/test/data.spec.ts`

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
      <a href="/about">About</a>
      <a href="/data">Data</a>
      <a href="/explorer">Explorer</a>
      <a href="/feedback">Feedback</a>
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

- [ ] **Step 4: Run the Next.js tests and verify the public pages render**

Run: `npm --workspace web test`

Expected: home/about/data/explorer/feedback pages render and use the API client.

- [ ] **Step 5: Commit**

```bash
git add web/app web/components web/lib web/test
git commit -m "feat: add nextjs public route shell"
```

### Task 5: Auth, Account, and Admin Migration

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
- Consumes: current auth expectations from `client/components/auth/*` and `server/auth/*`
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

Expected: auth/session flow works end-to-end enough for migrated pages.

- [ ] **Step 5: Commit**

```bash
git add api/src/routes/auth.ts api/src/auth web/app/(auth) web/app/(account) web/app/(admin) api/test/routes/auth.test.ts web/test/auth.spec.ts
git commit -m "feat: migrate auth and account surfaces"
```

### Task 6: Cutover, Parity, and Legacy Retirement

**Files:**
- Modify: `package.json`
- Modify: `README.md`
- Modify: `server/` legacy entrypoints as needed for decommissioning
- Modify: `client/` legacy frontend entrypoints as needed for decommissioning
- Create: `docs/migration/route-parity.md`
- Create: `docs/migration/cutover-checklist.md`

**Interfaces:**
- Consumes: all migrated routes and services from Tasks 1–5
- Produces: root startup scripts, docs, and cleanup commits that make the legacy app a temporary bridge instead of the default runtime

- [ ] **Step 1: Write a parity checklist test/document pair**

```md
<!-- docs/migration/route-parity.md -->
- /
- /about
- /data
- /explorer
- /feedback
- /login
- /signup
- /settings
- /admin
```

- [ ] **Step 2: Run the app in the new stack and confirm the migrated routes load**

Run: `npm run dev:api` and `npm run dev:web`

Expected: all migrated routes load without relying on the AngularJS client.

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

Only do this after the route parity checklist is complete and the new stack is the default runtime.

- [ ] **Step 5: Commit**

```bash
git add package.json README.md docs/migration
git commit -m "chore: cut over to the modern stack"
```
