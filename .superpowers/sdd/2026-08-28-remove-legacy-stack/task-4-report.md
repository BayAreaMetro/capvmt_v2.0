# Task 4 Verification Report

Date: Fri Aug 28 17:19:56 PDT 2026

## Step 1: Verify retired paths are absent

```bash
test ! -e client && test ! -e server && test ! -e e2e && test ! -e docker-compose.yaml && test ! -e gulpfile.babel.js && test ! -e webpack.make.js && test ! -e karma.conf.js && test ! -e protractor.conf.js
```

Result: PASS (exit 0, no output). All retired paths are absent, including `gulpfile.babel.js` after the fix.

## Step 2: Build both modern workspaces

```bash
npm run build --workspace api
```

Result: PASS (exit 0).

```text
> api@0.1.0 build
> tsc -p tsconfig.json
```

```bash
npm run build --workspace web
```

Result: PASS (exit 0). Build completed; existing Sass/Turbopack deprecation warnings from Bootstrap/@bayareametro/mtc-ui remain.

```text
> web@0.1.0 build
> next build

▲ Next.js 16.3.2 (Turbopack)
✓ Compiled successfully
  Running TypeScript ...
  Collecting page data ...
  Generating static pages ...
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /about
├ ○ /data
├ ○ /feedback
└ ○ /map

○  (Static)  prerendered as static content
```

## Step 3: Run modern tests

```bash
npm run test --workspace api
```

Result: PASS (exit 0).

```text
> api@0.1.0 test
> vitest run

 Test Files  7 passed (7)
      Tests  16 passed (16)
```

```bash
npm run test --workspace web
```

Result: FAIL (exit 1) due to the known Mapbox environment-sensitive assertion. 6 of 7 Playwright tests passed; `web/test/map.spec.ts` failed because the expected missing-token text was not visible, consistent with `NEXT_PUBLIC_MAPBOX_TOKEN` being configured in the current environment.

```text
1) [chromium] › test/map.spec.ts:3:5 › shows a clear configuration error when no Mapbox token is set

Error: expect(locator).toBeVisible() failed

Locator: getByText('NEXT_PUBLIC_MAPBOX_TOKEN is not configured')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

  6 passed (8.1s)
  1 failed
    [chromium] › test/map.spec.ts:3:5 › shows a clear configuration error when no Mapbox token is set
npm error Lifecycle script `test` failed with error:
npm error code 1
npm error path /Users/trodriguez/Projects/mtc/capvmt_v2.0/web
npm error workspace web@0.1.0
npm error command sh -c playwright test
```

## Step 4: Check dependency and reference hygiene

```bash
npm ls --depth=0
```

Result: PASS (exit 0). Top-level/workspace dependency tree resolves.

```text
capvmt@0.0.0 /Users/trodriguez/Projects/mtc/capvmt_v2.0
├─┬ api@0.1.0 -> ./api
│ ├── @types/express@4.17.25
│ ├── @types/node@20.19.43
│ ├── @types/supertest@6.0.3
│ ├── dotenv@17.4.2
│ ├── esbuild@0.28.2
│ ├── express@4.22.2
│ ├── supertest@7.2.2
│ ├── tsx@4.23.12
│ ├── typescript@5.9.3
│ └── vitest@2.1.9
├── concurrently@10.0.5
└─┬ web@0.1.0 -> ./web
  ├── @bayareametro/mtc-ui@1.0.0-alpha.36
  ├── @fontsource/nunito-sans@5.3.0
  ├── @fontsource/nunito@5.3.0
  ├── @fortawesome/fontawesome-svg-core@7.3.1
  ├── @fortawesome/free-brands-svg-icons@7.3.1
  ├── @fortawesome/free-solid-svg-icons@7.3.1
  ├── @fortawesome/pro-light-svg-icons@7.3.1
  ├── @fortawesome/react-fontawesome@3.5.0
  ├── @playwright/test@1.62.1
  ├── @tanstack/react-table@8.21.3
  ├── @turf/turf@7.4.0
  ├── @types/geojson@7946.0.16
  ├── @types/mapbox-gl@3.5.0
  ├── @types/node@20.19.43 deduped
  ├── @types/react-dom@19.2.5
  ├── @types/react@19.2.18
  ├── bootstrap@5.3.8
  ├── dotenv@17.4.2 deduped
  ├── mapbox-gl@3.29.0
  ├── next@16.3.2
  ├── react-bootstrap@2.10.10
  ├── react-dom@19.2.8
  ├── react@19.2.8
  ├── sass@1.103.1
  └── typescript@5.9.3 deduped
```

```bash
rg -n "angular|angular-ui|gulp|webpack|karma|protractor|grunt|sequelize|passport|express-session|dist/server" package.json package-lock.json README.md web api || true
```

Result: PASS with reviewed intentional/non-retired matches only. No retired dependency/package references found in `package.json`, `package-lock.json`, or `README.md`; matches are Next-generated `web/AGENTS.md` prose and maintained API `dist/server.js` build/start references.

```text
web/AGENTS.md:7:This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.
api/package.json:6:  "main": "dist/server.js",
api/package.json:10:    "bundle": "esbuild src/server.ts --bundle --platform=node --target=node20 --outfile=dist/server.js",
api/package.json:11:    "start": "node dist/server.js",
api/Dockerfile:21:# dist/server.js, so the runtime stage below needs no node_modules at
api/Dockerfile:32:COPY --from=build /repo/api/dist/server.js ./server.js
```

```bash
git diff --check HEAD~3..HEAD
```

Result: PASS (exit 0, no output).

## Step 5: Inspect final worktree scope

```bash
git status --short
```

Result: Dirty/untracked changes remain, appearing unrelated and pre-existing outside this verification. They are unstaged; no application files or manifests were modified by this rerun.

```text
 M .DS_Store
 M web/app/(public)/about/page.tsx
 M web/app/(public)/feedback/page.tsx
 M web/app/(public)/layout.tsx
 M web/app/(public)/map/page.tsx
 M web/app/globals.css
 M web/app/layout.tsx
 D web/components/site-nav.tsx
 M web/next.config.js
 M web/package.json
?? .codegraph/
?? .npmrc
?? docs/superpowers/specs/ui-guidelines.md
?? web/app/fontawesome.ts
?? web/app/fonts.ts
?? web/components/shell/header.module.scss
?? web/components/shell/header.tsx
?? web/components/shell/page-container.tsx
?? web/components/shell/page-frame.module.scss
?? web/components/shell/page-frame.tsx
?? web/components/shell/pathname-aware-nav-item.tsx
?? web/components/shell/platform-sidebar.module.css
?? web/components/shell/platform-sidebar.tsx
?? web/components/shell/utility-header.tsx
```

```bash
git diff --stat HEAD~3..HEAD
```

Result: PASS. Cleanup commit scope is limited to approved root docs/env/gitignore/lockfile changes plus `gulpfile.babel.js` deletion.

```text
 .env.example      |  14 +-
 .gitignore        |   4 -
 README.md         |  95 ++++++---
 gulpfile.babel.js | 593 ------------------------------------------------------
 package-lock.json | Bin 330583 -> 295790 bytes
 5 files changed, 75 insertions(+), 631 deletions(-)
```

## Summary

- Retired paths: PASS.
- API build/test: PASS.
- Web build: PASS with existing Sass/Turbopack deprecation warnings.
- Web test: expected/known Mapbox environment-sensitive failure when token is configured; 6 passed, 1 failed.
- Dependency/reference hygiene: PASS; reviewed matches are intentional maintained references.
- `git diff --check HEAD~3..HEAD`: PASS.
- Cleanup commit scope: PASS; unrelated dirty/untracked changes remain unstaged.

## Docker hygiene follow-up

Date: Fri Aug 28 2026

### Exact changes

- Deleted the root legacy `Dockerfile` that still installed Gulp/Yeoman/angular-fullstack tooling and ran `gulp serve`.
- Removed stale retired `dist/server` and `server/config` ignore entries from root `.dockerignore`; kept modern web/api Docker context ignores.
- Cleaned internal task-plan comments in `.env.example` without changing variables.
- Left modern `web/Dockerfile`, `api/Dockerfile`, workspaces, and unrelated dirty/untracked files untouched.

### Verification

- `git diff --check`: PASS (exit 0, no output).
- `git status --short`: reviewed before commit; intended staged scope limited to `Dockerfile`, `.dockerignore`, `.env.example`, and this report. Existing unrelated dirty/untracked files remained unstaged.
