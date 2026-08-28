# Remove Legacy Stack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the retired Angular/Express legacy application and its build tooling while keeping the modern `web` and `api` workspaces operational.

**Architecture:** The repository will retain `web/` as the Next.js frontend and `api/` as the TypeScript Express backend. Root scripts and metadata will delegate to those workspaces; the legacy `client/`, `server/`, Gulp/Webpack/Karma/Protractor configuration, and their dependencies will be deleted. Documentation will describe only the modern development and deployment workflow.

**Tech Stack:** Next.js 16, React 19, TypeScript, Express, Playwright, Vitest, npm workspaces.

## Global Constraints

- Preserve the modern `web` and `api` workspaces and their source, tests, assets, and package manifests.
- Delete the retired Angular frontend under `client/` and retired Express backend under `server/`.
- Delete only root configuration and dependencies that exist solely for the retired Angular/Gulp/Webpack/Karma/Protractor application.
- Retain `.env`; do not expose, rewrite, or delete local environment secrets.
- Retain `web/public/images/cover_img.jpg` and `web/public/images/data-img.jpg`; they are modern frontend assets even though their source copies originated under `client/assets/images/`.
- Preserve unrelated pre-existing dirty or untracked changes; stage only files belonging to this cleanup.
- Retire the old authentication, admin, user, Docker-mounted deployment, and Elastic Beanstalk workflow explicitly; do not recreate compatibility routes.
- Root commands must no longer invoke Gulp, Karma, Protractor, the old `server/`, or `dist/server`.

---

### Task 1: Remove Retired Application Sources

**Files:**
- Delete: `client/`
- Delete: `server/`
- Delete: `e2e/`
- Delete: `docker-compose.yaml`
- Delete: `.buildignore`
- Delete: `.babelrc`
- Delete: `.flowconfig`
- Delete: `.yo-rc.json`
- Delete: `.travis.yml`
- Delete: `webpack.make.js`
- Delete: `webpack.dev.js`
- Delete: `webpack.build.js`
- Delete: `webpack.test.js`
- Delete: `karma.conf.js`
- Delete: `protractor.conf.js`
- Delete: `mocha.conf.js`
- Delete: `mocha.global.js`
- Delete: `spec.js`

**Interfaces:**
- Consumes: No modern workspace source imports any deleted path; modern frontend assets remain under `web/public/`.
- Produces: A repository with no retired Angular frontend, legacy Express server, legacy browser tests, or old container/build configuration.

- [ ] **Step 1: Confirm deletion scope and modern asset preservation**

Run:

```bash
test -f web/public/images/cover_img.jpg
test -f web/public/images/data-img.jpg
test -d web
test -d api
```

Expected: all commands exit successfully before deletion begins.

- [ ] **Step 2: Delete the retired source and configuration paths**

Remove exactly the paths listed under **Files**. Do not remove `web/`, `api/`, `etl/`, `.env`, `.env.example`, `.gitignore`, or modern documentation.

- [ ] **Step 3: Verify no modern source references deleted paths**

Run:

```bash
rg -n "client/|server/|gulp|webpack|karma|protractor|dist/server|Angular Full-Stack" web api README.md package.json .env.example .gitignore || true
```

Expected: any remaining matches are documentation or comments that Task 3 will update; there must be no imports from deleted application paths in `web/` or `api/`.

- [ ] **Step 4: Commit the source removal**

```bash
git add -u -- client server e2e docker-compose.yaml .buildignore .babelrc .flowconfig .yo-rc.json .travis.yml webpack.make.js webpack.dev.js webpack.build.js webpack.test.js karma.conf.js protractor.conf.js mocha.conf.js mocha.global.js spec.js
git commit -m "chore: remove retired legacy application"
```

### Task 2: Modernize Root Manifest and Commands

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: Existing workspace manifests at `web/package.json` and `api/package.json`.
- Produces: Root `dev`, `build`, `test`, and `lint` commands that delegate to modern workspaces; a root manifest containing only dependencies required by shared root tooling, if any.

- [ ] **Step 1: Remove legacy root dependencies and development dependencies**

Delete the Angular, Angular UI, legacy authentication/session, Sequelize, old Express/server, Babel 6, Flow, Gulp, Webpack, Karma, Protractor, Grunt, Istanbul, Mocha, and related packages listed in the approved audit. Keep `concurrently` only if retained by the root `dev` command.

- [ ] **Step 2: Replace legacy root scripts with workspace scripts**

Set the root scripts to:

```json
{
  "dev": "concurrently -n web,api -c blue,green \"npm run dev:web\" \"npm run dev:api\"",
  "dev:web": "npm --workspace web run dev",
  "dev:api": "npm --workspace api run dev",
  "build": "npm run build --workspaces --if-present",
  "test": "npm run test --workspaces --if-present",
  "lint": "npm run lint --workspaces --if-present"
}
```

Remove `flow`, `update-webdriver`, `start`, and the old `gulp test` command. Preserve the existing workspace declarations and engine requirements.

- [ ] **Step 3: Regenerate the npm lockfile**

Run:

```bash
npm install
```

Expected: the lockfile no longer contains root-only legacy package entries that are unreachable after the manifest cleanup, and npm exits successfully.

- [ ] **Step 4: Verify root command wiring**

Run:

```bash
npm run build
npm run test --workspace api
npm run test --workspace web -- --list
```

Expected: root build delegates to `web` and `api`; API tests execute through Vitest; the web command resolves Playwright tests without invoking Gulp, Karma, or Protractor.

- [ ] **Step 5: Commit manifest and lockfile changes**

```bash
git add package.json package-lock.json
git commit -m "chore: use workspace commands at repository root"
```

### Task 3: Update Modern Documentation

**Files:**
- Modify: `README.md`
- Inspect and modify if needed: `.env.example`
- Inspect and modify if needed: `.gitignore`

**Interfaces:**
- Consumes: Modern scripts and workspace package manifests from Task 2.
- Produces: Documentation that gives accurate modern setup, development, testing, environment, and deployment instructions without references to deleted legacy paths.

- [ ] **Step 1: Replace legacy setup and deployment instructions**

Rewrite README sections that currently describe the Angular Full-Stack Generator, Docker-mounted `client`/`server`, `gulp build`, `gulp serve`, Karma, `dist/server`, or AWS Elastic Beanstalk upload of the old bundle. Document:

```text
npm install
npm run dev
npm run build
npm test
```

Explain that `web` is the Next.js frontend, `api` is the TypeScript Express backend, `web` proxies `/api/*` to `API_INTERNAL_URL`, and the API requires the environment variables documented by `api/src/env.ts`.

- [ ] **Step 2: Remove stale ancillary references**

Inspect `.env.example` and `.gitignore`. Remove only references to deleted legacy files, generated `dist/client` or `dist/server` output, and obsolete Gulp/Angular tooling. Preserve modern `.next`, `api/dist`, local environment handling, and unrelated ignore rules.

- [ ] **Step 3: Verify documentation references**

Run:

```bash
rg -n "Angular Full-Stack|gulp|Karma|Protractor|dist/server|dist/client|docker-compose|client/|server/" README.md .env.example .gitignore || true
```

Expected: no stale legacy workflow references remain in the maintained documentation/configuration files.

- [ ] **Step 4: Commit documentation changes**

```bash
git add README.md .env.example .gitignore
git commit -m "docs: document modern workspace workflow"
```

### Task 4: Full Cleanup Verification

**Files:**
- Inspect: `package.json`, `package-lock.json`, `README.md`, `web/package.json`, `api/package.json`
- Inspect: repository tree after Tasks 1-3

**Interfaces:**
- Consumes: Modern source tree and root workspace commands from Tasks 1-3.
- Produces: Evidence that the retired stack is absent and modern frontend/backend build and tests remain usable.

- [ ] **Step 1: Verify retired paths are absent**

Run:

```bash
test ! -e client
test ! -e server
test ! -e e2e
test ! -e docker-compose.yaml
test ! -e gulpfile.babel.js
test ! -e webpack.make.js
test ! -e karma.conf.js
test ! -e protractor.conf.js
```

Expected: all commands exit successfully.

- [ ] **Step 2: Build both modern workspaces**

Run:

```bash
npm run build --workspace api
npm run build --workspace web
```

Expected: both builds pass. Existing Sass/Turbopack deprecation warnings may remain; no new legacy-tool errors should appear.

- [ ] **Step 3: Run modern tests**

Run:

```bash
npm run test --workspace api
npm run test --workspace web
```

Expected: API tests pass. Web tests pass except the already documented environment-sensitive Mapbox missing-token assertion if `NEXT_PUBLIC_MAPBOX_TOKEN` is configured; record that exact failure if present.

- [ ] **Step 4: Check dependency and reference hygiene**

Run:

```bash
npm ls --depth=0
rg -n "angular|angular-ui|gulp|webpack|karma|protractor|grunt|sequelize|passport|express-session|dist/server" package.json package-lock.json README.md web api || true
git diff --check HEAD~3..HEAD
```

Expected: no retired packages remain in the root manifest/lockfile or maintained modern code/documentation. Any historical commit references or intentional prose should be excluded from the cleanup commits rather than reintroduced into maintained files.

- [ ] **Step 5: Inspect final worktree scope**

Run:

```bash
git status --short
git diff --stat HEAD~3..HEAD
```

Expected: cleanup commits contain only approved legacy deletions, root manifest/lockfile updates, and modern documentation changes. Pre-existing unrelated dirty changes remain present and unstaged.
