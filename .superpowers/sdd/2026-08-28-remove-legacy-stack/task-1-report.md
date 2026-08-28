# Task 1 Report: Remove Retired Application Sources

## Summary

Removed the retired legacy application configuration/source paths that existed in the repository and committed the deletion as `48eb3fc0662992dc028270b4b8ffa599dca96cb3` with message `chore: remove retired legacy application`.

The legacy directories `client/`, `server/`, and `e2e/` were part of the requested deletion scope but were not present in the working tree before deletion.

## Commands and Outputs

### Read task brief

Command/tool:

```text
read /Users/trodriguez/Projects/mtc/capvmt_v2.0/.superpowers/sdd/2026-08-28-remove-legacy-stack/task-1-brief.md
```

Output: task brief loaded successfully; required deletion list and verification commands confirmed.

### Step 1: Confirm modern asset/source preservation

Command:

```bash
test -f web/public/images/cover_img.jpg && test -f web/public/images/data-img.jpg && test -d web && test -d api
```

Output:

```text
(no output)
```

Result: passed; all commands exited successfully before deletion began.

### Pre-commit dirty state inspection

Command:

```bash
git status --short
```

Output:

```text
 M .DS_Store
 M package-lock.json
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

Command:

```bash
git diff --stat
```

Output:

```text
 .DS_Store                          | Bin 6148 -> 6148 bytes
 package-lock.json                  | Bin 1406494 -> 1437463 bytes
 web/app/(public)/about/page.tsx    |   4 +-
 web/app/(public)/feedback/page.tsx | 107 ++++++++++++++++++--------------
 web/app/(public)/layout.tsx        |   9 +--
 web/app/(public)/map/page.tsx      |  19 +++---
 web/app/globals.css                | 122 +------------------------------------
 web/app/layout.tsx                 |   3 +
 web/components/site-nav.tsx        |  27 --------
 web/next.config.js                 |   8 +++
 web/package.json                   |  12 ++++
 11 files changed, 99 insertions(+), 212 deletions(-)
```

Command:

```bash
git log --oneline -10
```

Output:

```text
5baea3a docs: plan legacy stack removal
150f42e Use canonical grouped data headers
7af204e Fix grouped data header styling
791a2b6 Fix grouped header table props
fffba84 Fix grouped data table headers
0a3df93 feat: group data table metric headers
2fe90f1 fix: make page backgrounds fill content area
9e0848a docs: plan full bleed backgrounds and grouped headers
60493b3 docs: design full bleed backgrounds and grouped headers
78763eb feat: apply backgrounds to home and data pages
```

Result: unrelated pre-existing dirty/untracked changes were identified and preserved.

### Step 2: Confirm deletion target set and delete retired paths

Command/tool:

```text
glob {client,server,e2e,docker-compose.yaml,.buildignore,.babelrc,.flowconfig,.yo-rc.json,.travis.yml,webpack.make.js,webpack.dev.js,webpack.build.js,webpack.test.js,karma.conf.js,protractor.conf.js,mocha.conf.js,mocha.global.js,spec.js}
```

Output:

```text
/Users/trodriguez/Projects/mtc/capvmt_v2.0/.travis.yml
/Users/trodriguez/Projects/mtc/capvmt_v2.0/webpack.build.js
/Users/trodriguez/Projects/mtc/capvmt_v2.0/.yo-rc.json
/Users/trodriguez/Projects/mtc/capvmt_v2.0/karma.conf.js
/Users/trodriguez/Projects/mtc/capvmt_v2.0/webpack.dev.js
/Users/trodriguez/Projects/mtc/capvmt_v2.0/webpack.test.js
/Users/trodriguez/Projects/mtc/capvmt_v2.0/mocha.global.js
/Users/trodriguez/Projects/mtc/capvmt_v2.0/docker-compose.yaml
/Users/trodriguez/Projects/mtc/capvmt_v2.0/.babelrc
/Users/trodriguez/Projects/mtc/capvmt_v2.0/.flowconfig
/Users/trodriguez/Projects/mtc/capvmt_v2.0/webpack.make.js
/Users/trodriguez/Projects/mtc/capvmt_v2.0/spec.js
/Users/trodriguez/Projects/mtc/capvmt_v2.0/mocha.conf.js
/Users/trodriguez/Projects/mtc/capvmt_v2.0/protractor.conf.js
/Users/trodriguez/Projects/mtc/capvmt_v2.0/.buildignore
```

Additional target checks:

```text
glob client -> No files found
glob server -> No files found
glob e2e -> No files found
```

Deletion applied with `apply_patch` for exactly the existing retired files:

```text
D .travis.yml
D webpack.build.js
D .yo-rc.json
D karma.conf.js
D webpack.dev.js
D webpack.test.js
D mocha.global.js
D docker-compose.yaml
D .babelrc
D .flowconfig
D webpack.make.js
D spec.js
D mocha.conf.js
D protractor.conf.js
D .buildignore
```

### Step 3: Verify no modern source references deleted paths

Command:

```bash
rg -n "client/|server/|gulp|webpack|karma|protractor|dist/server|Angular Full-Stack" web api README.md package.json .env.example .gitignore || true
```

Output:

```text
web/AGENTS.md:7:This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.
.env.example:2:# (server/config/local.env.sample.js doesn't list these).
.env.example:32:# legacy client/app/map/map.component.js hardcoded a token directly in
README.md:20:This project was generated with the [Angular Full-Stack Generator](https://github.com/DaftMonk/generator-angular-fullstack) version 4.2.2.
README.md:32:  2. Copy [local.env.js](https://mtcdrive.box.com/s/3mupwj06prg1wwhs5lc34ehv1lqx4x60) file to server/config and rename to local.env.js
README.md:40:In Docker terminal, run `gulp build` for building and `gulp serve` for preview.
README.md:44:In Docker terminal, running `npm test` will run the unit tests with karma.
README.md:48:After running `gulp build`, compress all files in dist/server into a zip file. In AWS EB environment, select `Upload and Deploy`, and point to zip file in dist/server
api/src/lib/request-context.ts:5: * Replaces morgan('dev') from the legacy server/config/express.js -
package.json:4:  "main": "server/index.js",
package.json:36:    "gulp4-run-sequence": "^1.0.1",
package.json:73:    "extract-text-webpack-plugin": "^1.0.1",
package.json:78:    "gulp": "^4.0.2",
package.json:79:    "gulp-babel": "^6.1.2",
package.json:80:    "gulp-env": "^0.4.0",
package.json:81:    "gulp-eslint": "^2.0.0",
package.json:82:    "gulp-imagemin": "^3.0.1",
package.json:83:    "gulp-inject": "^4.0.0",
package.json:84:    "gulp-istanbul": "^1.1.1",
package.json:85:    "gulp-istanbul-enforcer": "^1.0.3",
package.json:86:    "gulp-load-plugins": "^1.0.0-rc.1",
package.json:87:    "gulp-mocha": "^2.1.3",
package.json:88:    "gulp-plumber": "^1.0.1",
package.json:89:    "gulp-protractor": "^3.0.0",
package.json:90:    "gulp-rev": "^7.0.0",
package.json:91:    "gulp-rev-replace": "^0.4.2",
package.json:92:    "gulp-sort": "^2.0.0",
package.json:93:    "gulp-sourcemaps": "^1.5.2",
package.json:94:    "gulp-stylint": "^3.0.0",
package.json:95:    "gulp-util": "^3.0.5",
package.json:96:    "gulp-watch": "^4.3.5",
package.json:97:    "html-webpack-harddisk-plugin": "~0.0.2",
package.json:98:    "html-webpack-plugin": "^2.16.0",
package.json:105:    "karma": "~0.13.3",
package.json:106:    "karma-chai-plugins": "~0.7.0",
package.json:107:    "karma-chrome-launcher": "^2.0.0",
package.json:108:    "karma-coverage": "^1.0.0",
package.json:109:    "karma-firefox-launcher": "^1.0.0",
package.json:110:    "karma-mocha": "^1.0.1",
package.json:111:    "karma-script-launcher": "^1.0.0",
package.json:112:    "karma-sourcemap-loader": "~0.3.7",
package.json:113:    "karma-spec-reporter": "~0.0.20",
package.json:114:    "karma-webpack": "^1.7.0",
package.json:131:    "webpack": "^1.12.14",
package.json:132:    "webpack-dev-middleware": "^1.5.1",
package.json:133:    "webpack-stream": "^3.2.0",
package.json:141:    "test": "gulp test",
package.json:143:    "update-webdriver": "node node_modules/protractor/bin/webdriver-manager update",
.gitignore:5:client/bower_components
.gitignore:6:client/index.html
.gitignore:8:/server/config/local.env.js
api/package.json:6:  "main": "dist/server.js",
api/package.json:10:    "bundle": "esbuild src/server.ts --bundle --platform=node --target=node20 --outfile=dist/server.js",
api/package.json:11:    "start": "node dist/server.js",
api/Dockerfile:21:# dist/server.js, so the runtime stage below needs no node_modules at
api/Dockerfile:32:COPY --from=build /repo/api/dist/server.js ./server.js
api/src/socrata/client.ts:12: * server/api/data/data.controller.js.
api/src/socrata/vmt.ts:7: * server/api/data/data.controller.js. Returns whatever fields the
web/components/shell/page-container.tsx:10: * Matches the legacy navbar's live links (client/components/navbar/navbar.html)
web/app/(public)/data/page.tsx:132:/** Replaces the legacy jsonToCSVConverter in client/app/data/data.component.js. */
```

Result: passed for Task 1 scope. Remaining matches are documentation/comments, package manifest references, `.env.example` comments, `.gitignore` entries, or modern `api/dist/server.js` build references. No modern `web/` or `api/` source imports deleted application paths.

### Step 4: Stage and commit only this task

Command:

```bash
git add -u -- client server e2e docker-compose.yaml .buildignore .babelrc .flowconfig .yo-rc.json .travis.yml webpack.make.js webpack.dev.js webpack.build.js webpack.test.js karma.conf.js protractor.conf.js mocha.conf.js mocha.global.js spec.js && git status --short
```

Output:

```text
 M .DS_Store
D  .babelrc
D  .buildignore
D  .flowconfig
D  .travis.yml
D  .yo-rc.json
D  docker-compose.yaml
D  karma.conf.js
D  mocha.conf.js
D  mocha.global.js
 M package-lock.json
D  protractor.conf.js
D  spec.js
 M web/app/(public)/about/page.tsx
 M web/app/(public)/feedback/page.tsx
 M web/app/(public)/layout.tsx
 M web/app/(public)/map/page.tsx
 M web/app/globals.css
 M web/app/layout.tsx
 D web/components/site-nav.tsx
 M web/next.config.js
 M web/package.json
D  webpack.build.js
D  webpack.dev.js
D  webpack.make.js
D  webpack.test.js
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

Command:

```bash
git diff --cached --stat && git diff --cached --name-status
```

Output:

```text
 .babelrc            |   7 --
 .buildignore        |   0
 .flowconfig         |   0
 .travis.yml         |  21 ----
 .yo-rc.json         |  69 ----------
 docker-compose.yaml |  35 ------
 karma.conf.js       |  98 ---------------
 mocha.conf.js       |  19 ---
 mocha.global.js     |   6 -
 protractor.conf.js  |  77 ------------
 spec.js             |  12 --
 webpack.build.js    |   8 --
 webpack.dev.js      |   8 --
 webpack.make.js     | 357 ----------------------------------------------------
 webpack.test.js     |   8 --
 15 files changed, 725 deletions(-)
D	.babelrc
D	.buildignore
D	.flowconfig
D	.travis.yml
D	.yo-rc.json
D	docker-compose.yaml
D	karma.conf.js
D	mocha.conf.js
D	mocha.global.js
D	protractor.conf.js
D	spec.js
D	webpack.build.js
D	webpack.dev.js
D	webpack.make.js
D	webpack.test.js
```

Command:

```bash
git commit -m "chore: remove retired legacy application"
```

Output:

```text
[modernization 48eb3fc] chore: remove retired legacy application
 15 files changed, 725 deletions(-)
 delete mode 100644 .babelrc
 delete mode 100644 .buildignore
 delete mode 100644 .flowconfig
 delete mode 100644 .travis.yml
 delete mode 100644 .yo-rc.json
 delete mode 100644 docker-compose.yaml
 delete mode 100644 karma.conf.js
 delete mode 100644 mocha.conf.js
 delete mode 100644 mocha.global.js
 delete mode 100644 protractor.conf.js
 delete mode 100644 spec.js
 delete mode 100644 webpack.build.js
 delete mode 100644 webpack.dev.js
 delete mode 100644 webpack.make.js
 delete mode 100644 webpack.test.js
```

### Post-commit state

Command:

```bash
git status --short
```

Output:

```text
 M .DS_Store
 M package-lock.json
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

Command:

```bash
git rev-parse HEAD
```

Output:

```text
48eb3fc0662992dc028270b4b8ffa599dca96cb3
```

Result: commit created; unrelated pre-existing dirty/untracked changes remain uncommitted.

## Verification Summary

- Modern assets and directories verified before deletion: passed.
- Retired existing paths removed: passed.
- `rg` reference check completed: passed for Task 1 scope; remaining matches are documentation/comments/manifests or modern `api/dist/server.js` references, not imports from deleted application paths.
- Commit created with requested message: passed.

## Concerns

- `client/`, `server/`, and `e2e/` were listed in the deletion scope but were already absent before deletion.
- Root `package.json`, `README.md`, `.env.example`, and `.gitignore` still contain legacy references as expected for later tasks and were not modified.
- The repository still has unrelated dirty/untracked changes that predated this task and were preserved.

## Fix report - missing legacy directory deletions (2026-08-28T23:49:32Z)

### Command: git status --short -- client server e2e
```
[33mD[m  client/.eslintrc
[33mD[m  client/.htaccess
[33mD[m  client/_index.html
[33mD[m  client/app/.DS_Store
[33mD[m  client/app/about/about.component.js
[33mD[m  client/app/about/about.component.spec.js
[33mD[m  client/app/about/about.css
[33mD[m  client/app/about/about.html
[33mD[m  client/app/about/about.routes.js
[33mD[m  client/app/account/account.routes.js
[33mD[m  client/app/account/index.js
[33mD[m  client/app/account/login/index.js
[33mD[m  client/app/account/login/login.controller.js
[33mD[m  client/app/account/login/login.html
[33mD[m  client/app/account/settings/index.js
[33mD[m  client/app/account/settings/settings.controller.js
[33mD[m  client/app/account/settings/settings.html
[33mD[m  client/app/account/signup/index.js
[33mD[m  client/app/account/signup/signup.controller.js
[33mD[m  client/app/account/signup/signup.html
[33mD[m  client/app/admin/admin.controller.js
[33mD[m  client/app/admin/admin.css
[33mD[m  client/app/admin/admin.html
[33mD[m  client/app/admin/admin.routes.js
[33mD[m  client/app/admin/index.js
[33mD[m  client/app/app.config.js
[33mD[m  client/app/app.constants.js
[33mD[m  client/app/app.css
[33mD[m  client/app/app.js
[33mD[m  client/app/data/data.component.js
[33mD[m  client/app/data/data.component.spec.js
[33mD[m  client/app/data/data.css
[33mD[m  client/app/data/data.html
[33mD[m  client/app/data/data.routes.js
[33mD[m  client/app/feedback/feedback.component.js
[33mD[m  client/app/feedback/feedback.component.spec.js
[33mD[m  client/app/feedback/feedback.css
[33mD[m  client/app/feedback/feedback.html
[33mD[m  client/app/feedback/feedback.routes.js
[33mD[m  client/app/main/main.component.js
[33mD[m  client/app/main/main.component.spec.js
[33mD[m  client/app/main/main.css
[33mD[m  client/app/main/main.html
[33mD[m  client/app/main/main.routes.js
[33mD[m  client/app/map/map.component.js
[33mD[m  client/app/map/map.component.spec.js
[33mD[m  client/app/map/map.css
[33mD[m  client/app/map/map.html
[33mD[m  client/app/map/map.routes.js
[33mD[m  client/assets/.DS_Store
[33mD[m  client/assets/images/about-img.jpg
[33mD[m  client/assets/images/bkgd-vid.mp4
[33mD[m  client/assets/images/cover_img.jpg
[33mD[m  client/assets/images/data-img.jpg
[33mD[m  client/assets/images/feedback-img.jpg
[33mD[m  client/assets/images/navbar-img.png
[33mD[m  client/assets/images/yeoman.png
[33mD[m  client/assets/js/spatial/places.json
[33mD[m  client/components/.DS_Store
[33mD[m  client/components/auth/auth.module.js
[33mD[m  client/components/auth/auth.service.js
[33mD[m  client/components/auth/interceptor.service.js
[33mD[m  client/components/auth/router.decorator.js
[33mD[m  client/components/auth/user.service.js
[33mD[m  client/components/footer/footer.component.js
[33mD[m  client/components/footer/footer.css
[33mD[m  client/components/footer/footer.html
[33mD[m  client/components/modal/modal.css
[33mD[m  client/components/modal/modal.html
[33mD[m  client/components/modal/modal.service.js
[33mD[m  client/components/mongoose-error/mongoose-error.directive.js
[33mD[m  client/components/navbar/navbar.component.js
[33mD[m  client/components/navbar/navbar.html
[33mD[m  client/components/ui-router/ui-router.mock.js
[33mD[m  client/components/util/util.module.js
[33mD[m  client/components/util/util.service.js
[33mD[m  client/favicon.ico
[33mD[m  client/polyfills.js
[33mD[m  client/robots.txt
[33mD[m  e2e/account/login/login.po.js
[33mD[m  e2e/account/login/login.spec.js
[33mD[m  e2e/account/logout/logout.spec.js
[33mD[m  e2e/account/signup/signup.po.js
[33mD[m  e2e/account/signup/signup.spec.js
[33mD[m  e2e/components/navbar/navbar.po.js
[33mD[m  e2e/main/main.po.js
[33mD[m  e2e/main/main.spec.js
[33mD[m  server/.eslintrc
[33mD[m  server/api/data/data.controller.js
[33mD[m  server/api/data/data.events.js
[33mD[m  server/api/data/data.integration.js
[33mD[m  server/api/data/data.model.js
[33mD[m  server/api/data/index.js
[33mD[m  server/api/data/index.spec.js
[33mD[m  server/api/thing/index.js
[33mD[m  server/api/thing/index.spec.js
[33mD[m  server/api/thing/thing.controller.js
[33mD[m  server/api/thing/thing.events.js
[33mD[m  server/api/thing/thing.integration.js
[33mD[m  server/api/thing/thing.model.js
[33mD[m  server/api/user/index.js
[33mD[m  server/api/user/index.spec.js
[33mD[m  server/api/user/user.controller.js
[33mD[m  server/api/user/user.events.js
[33mD[m  server/api/user/user.integration.js
[33mD[m  server/api/user/user.model.js
[33mD[m  server/api/user/user.model.spec.js
[33mD[m  server/app.js
[33mD[m  server/auth/auth.service.js
[33mD[m  server/auth/index.js
[33mD[m  server/auth/local/index.js
[33mD[m  server/auth/local/passport.js
[33mD[m  server/components/errors/index.js
[33mD[m  server/config/environment/development.js
[33mD[m  server/config/environment/index.js
[33mD[m  server/config/environment/production.js
[33mD[m  server/config/environment/shared.js
[33mD[m  server/config/environment/test.js
[33mD[m  server/config/express.js
[33mD[m  server/config/local.env.sample.js
[33mD[m  server/config/seed.js
[33mD[m  server/index.js
[33mD[m  server/routes.js
[33mD[m  server/sqldb/index.js
[33mD[m  server/views/404.html
```

### Command: git diff --cached --name-only -- client server e2e | wc -l
```
     125
```

### Command: git ls-files --stage -- client server e2e
```
```

### Command: filesystem retained-scope checks
```
present web
present api
present etl
present .env
present .env.example
present .gitignore
```

### Command: git ls-files retained tracked paths
```
.env.example
.gitignore
api/Dockerfile
api/package.json
api/src/app.ts
api/src/asana/client.ts
api/src/env.ts
api/src/lib/http-errors.ts
api/src/lib/request-context.ts
api/src/routes/feedback.ts
api/src/routes/health.ts
api/src/routes/vmt.ts
api/src/server.ts
api/src/socrata/client.ts
api/src/socrata/vmt.ts
api/test/asana/client.test.ts
api/test/routes/feedback-not-configured.test.ts
api/test/routes/feedback.test.ts
api/test/routes/health.test.ts
api/test/routes/vmt.test.ts
api/test/sanity.test.ts
api/test/socrata/vmt.test.ts
api/tsconfig.json
api/tsconfig.test.json
etl/copy_model_output.sh
etl/previous work/UpdateNameValues.sql
etl/previous work/check_city.R
etl/previous work/copy_model_output.sh
etl/previous work/main_views.sql
etl/previous work/make_vmt_csvs.R
etl/previous work/readme.md
etl/previous work/update_model_name_suffix.sql
etl/previous work/update_vmtresults_table_2013.sql
etl/previous work/update_vmtresults_table_2017.sql
etl/previous work/vmtshares.sql
etl/process_diagram.png
etl/publish_to_socrata.py
etl/readme.md
etl/requirements-dev.txt
etl/requirements.txt
etl/test_publish_to_socrata.py
etl/vmt-results-etl.py
web/AGENTS.md
web/CLAUDE.md
web/Dockerfile
web/app/(public)/about/page.tsx
web/app/(public)/data/data.module.scss
web/app/(public)/data/page.tsx
web/app/(public)/feedback/page.tsx
web/app/(public)/layout.tsx
web/app/(public)/map/page.tsx
web/app/(public)/page.tsx
web/app/globals.css
web/app/layout.tsx
web/components/shell/page-backgrounds.module.scss
web/components/site-nav.tsx
web/lib/api.ts
web/next.config.js
web/package.json
web/playwright.config.ts
web/public/images/cover_img.jpg
web/public/images/data-img.jpg
web/public/places.json
web/test/data.spec.ts
web/test/feedback.spec.ts
web/test/home.spec.ts
web/test/map.spec.ts
web/tsconfig.json
```

### Command: git ls-files modern image assets
```
etl/process_diagram.png
web/public/images/cover_img.jpg
web/public/images/data-img.jpg
```

