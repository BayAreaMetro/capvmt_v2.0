# Application Modernization Design

> **Updated 2026-08-24** after a direct codebase audit of `capvmt_v2.0` (this repo — the current/latest version of the app). The original current-state description below was carried over from the CAPVMT repo's modernization worktree and assumed SQL Server was still the live data source. That assumption was wrong for this codebase: the VMT reporting data path already runs through the Socrata Open Data API. Sections below are rewritten to match what the code actually does; corrections are called out inline.
>
> **Updated again 2026-08-24** to add a product requirement: the current app only publishes non-commercial (passenger) VMT — this is confirmed in-repo, not just assumed (see "Vehicle type scope" below). An earlier revision of this doc scoped in app-side work to show commercial and non-commercial VMT side by side.
>
> **Superseded later the same day:** product clarified that commercial-vehicle VMT does **not** need to be displayed separately by the app. The published Socrata dataset will be updated by others to include commercial data; the app's job is just to keep displaying whatever the dataset returns, with no app-side code changes required to support that update. See "Vehicle type scope" below for what this does and doesn't mean for the modernization work.

## Goal

Replace the legacy AngularJS 1.x + Express + ad hoc data layer with a modern architecture built around:

- **Frontend:** Next.js
- **Backend:** Node API
- **Database:** an owned relational store for operational data (auth/users, feedback) — see "Data Layer" below for why this is no longer a flat "move to Postgres" task

The end state should preserve current product behavior while removing the oldest platform constraints and making future feature work safer and faster. The Socrata VMT dataset is expected to be updated separately (outside this codebase) to include commercial-vehicle data; the app does not need code changes to support that update — see "Vehicle type scope" below.

## Current State (verified against this repo, 2026-08-24)

The application is a legacy AngularJS 1.x app generated from Angular Full-Stack Generator 3.4.2, still using:

- AngularJS 1.6 component/directive patterns with ui-router, Bootstrap 5
- Express 4 backend routes/controllers, Sequelize 3 as the ORM
- Passport / express-jwt / express-session auth
- Grunt-era tooling remnants alongside Gulp 4, Babel 5, Webpack 1, Karma/Jasmine, Protractor

**Frontend surfaces** (`client/app/*`): `main`, `data` (the VMT explorer), `map` (jurisdiction boundary map via Mapbox GL JS + Turf.js, using a static local GeoJSON asset — not a live data call), `feedback`, `about`, `account`, `admin`, plus `auth` (login/signup/logout, session-gated routing in `app.js`'s `$stateChangeStart` hook).

### Data sources — this is the part that changed from the original design doc

There are **three independent data paths**, not one:

1. **VMT reporting data (the app's core feature) — Socrata, not SQL Server.**
   `server/api/data/data.controller.js` instantiates a `soda-js` `Consumer` against `data.bayareametro.gov` and queries it directly for:
   - `getJurisdictions` (`GET /api/data/jurisdictions/all`) — distinct `cityname` values from the Socrata VMT dataset
   - `getVMTbyJurisdiction` (`GET /api/data/vmt/:model_run/:cityname`) — VMT rows filtered by `model_run` + `cityname`

   Auth to Socrata is via `SOCRATA_USERNAME`, `SOCRATA_PASSWORD`, `SOCRATA_APP_TOKEN_MTC`, and the dataset is selected by `VMT_DATA_KEY` — all read from `process.env` with **no defaults and no entries in `server/config/local.env.sample.js`**, so these are currently tribal-knowledge deployment secrets, undocumented in-repo.
   - `getYears` (`GET /api/data/years/all`) currently returns a **hardcoded** array of six model-run years; there's a commented-out Socrata query in the same function ready to replace it, never enabled.
   - There is no SQL Server client anywhere in this codebase. `mssql` is a listed npm dependency but nothing `require`s or `import`s it — it is dead weight left over from an earlier stack.

2. **Auth/users/legacy CRUD scaffolding — SQLite via Sequelize, not SQL Server or Postgres.**
   `server/sqldb/index.js` builds one Sequelize instance from `config.sequelize`. In both `development.js` and `production.js`, the connection URI is `sqlite://` with a file `storage` (`dev.sqlite` / `dist.sqlite`). `development.js` also sets `options.dialect: 'mssql'`, which is inert given the sqlite URI — a leftover from a prior, apparently incomplete, SQL-Server-to-SQLite migration, not a real mssql connection.
   - `User` (`server/api/user/*`) is backed by this SQLite DB and is genuinely live — it's what `Auth`/login/signup/admin gating in the Angular app talk to.
   - `Data` (`server/api/data/data.model.js`, full CRUD in `data.controller.js`: `index`/`show`/`create`/`upsert`/`patch`/`destroy`) and `Thing` are also Sequelize models on the same SQLite DB, but **nothing in the client calls them** — the client only hits `/years/all`, `/jurisdictions/all`, and `/vmt/:model_run/:cityname`. This is unused scaffolding inherited from the generator template, not part of the real data flow.

3. **Feedback — an entirely separate external service, not this repo's backend at all.**
   `client/app/feedback/feedback.component.js` POSTs directly to `http://basis-dev-2022.us-west-2.elasticbeanstalk.com/api/feedback/add`. There is no `/api/feedback` route in this server. Feedback data does not touch this app's database or Socrata.

### Vehicle type scope — the app only publishes non-commercial VMT today, and that's fine

This is explicit and deliberate in both the product copy and the pipeline today, not an oversight:

- `client/app/about/about.html` states outright: *"These data summaries include only non-commercial travel. Meaning, it does [not include] moving goods/freight."*
- `client/app/data/data.html` labels the published metric **"Non-commercial Passenger Vehicle Miles Traveled"** in two places.
- The ETL pipeline (`etl/vmt-results-etl.py`) computes VMT shares from `persons_table`/`vmt_table` inputs keyed by `WorkLocation`/`orig_taz`/`dest_taz` — these are person/household-trip outputs from the travel demand model. Commercial and freight vehicle movement isn't represented in person-trip tables at all in typical four-step travel demand models (including MTC's `travel-model-one`, which `etl/readme.md` links to); it normally comes from a separate commercial-vehicle or truck sub-model.

**Current instruction (2026-08-24): commercial VMT does not need to be shown separately by the app.** The Socrata dataset behind `VMT_DATA_KEY` will be updated and republished by others (outside this codebase's ETL automation scope, and outside this modernization's implementation work) to include commercial-vehicle data. The app's read path — `getJurisdictions`, `getVMTbyJurisdiction`, `getYears` and their Task 2/3 replacements in the implementation plan — queries that dataset generically by `model_run` and `cityname` and returns whatever rows/fields come back. As long as the updated dataset keeps the same field names the app already reads, **no app-side code change is required** for the update to take effect; the app will simply display the updated data the next time it queries Socrata.

Two things worth flagging, not as new work but as things to watch during implementation:
- If the updated dataset changes shape (new fields, a `vehicle_type` column that changes what a `total` means, more rows per `model_run`/`cityname` pair than before), the existing display logic (totals math in `client/app/data/data.component.js`'s `$scope.totals`, and its Next.js replacement) should be checked against the new data for correctness — not to add commercial-specific UI, but to make sure "non-commercial" labeling and totals don't silently become wrong or ambiguous once the underlying dataset changes.
- The "Non-commercial Passenger Vehicle Miles Traveled" copy in `about.html`/`data.html` may need a product/copy review once the dataset changes, independent of any app logic change, so the page doesn't keep asserting something that's no longer accurate about the underlying data. That's a content call for whoever owns the dataset update, not an engineering task in this plan.

### ETL pipeline (offline, not part of the running app)

`etl/vmt-results-etl.py` is a Python script (superseding older SQL scripts under `etl/previous work/*.sql` — `vmtshares.sql`, `update_vmtresults_table_2017.sql`, `main_views.sql`, `update_model_name_suffix.sql`) that:
- Reads model-output CSVs (`vmt_<model_run>.csv`, `persons_<model_run>.csv`) and correspondence/lookup CSVs from `./data/`
- Computes VMT shares (inside/outside/partially-in) per place per model run
- Writes `vmt_results.csv`

Per `etl/readme.md`, this CSV is then "copied into a database and queried by the CAPVMT web application" — but the actual publish step that lands `vmt_results.csv` into the Socrata dataset the app queries is **external to this repo**: not scripted, not scheduled, not visible in version control here. That hand-off is a real gap if the modernization work wants to make the whole pipeline reproducible.

## Recommended Target Architecture

### Frontend

Build a new Next.js application as the user-facing client.

- Use App Router and React components
- Keep server/client boundaries explicit
- Replace ui-router page flows with Next.js routes: `/`, `/data`, `/map`, `/feedback`, `/about`, `/login`, `/signup`, `/settings`, `/admin`
- Treat the frontend as a thin product layer that talks to the API only — including for the Mapbox jurisdiction layer, which currently bundles a static GeoJSON client-side; keep that as a static asset served by the new frontend unless there's a reason to move it server-side
- Bring the feedback form back in-house behind the new API instead of pointing at the `basis-dev-2022` Elastic Beanstalk endpoint, *or* explicitly keep that integration and document it — this needs a product decision, not just a lift-and-shift (see Open Decisions)

### Backend

Build a separate Node API service.

- Expose versioned HTTP endpoints that mirror the real current contract: `/api/data/years/all`, `/api/data/jurisdictions/all`, `/api/data/vmt/:model_run/:cityname`, plus auth/session/user endpoints
- **Keep Socrata as the source of truth for VMT reporting data** — it's already the live path and there's no evidence a re-platform to an owned warehouse is planned or needed. Wrap `soda-js` (or a modern REST client against the same SODA API) in a typed module instead of calling it ad hoc from the controller, and add a thin cache layer since Socrata calls are synchronous per-request today with no caching
- Query and pass through whatever fields the Socrata dataset returns rather than hardcoding today's field set — the dataset is expected to be updated to include commercial-vehicle data (see "Vehicle type scope" above), and the API layer shouldn't need a code change for that update to flow through
- Finish the abandoned `getYears` migration: query distinct `model_run` values from Socrata instead of the hardcoded array
- Move `User` (and any operational data that should stay writable in-app, e.g. feedback if brought in-house) off the ad hoc SQLite/Sequelize setup onto a properly provisioned database — see Data Layer below
- Delete the unused `Data`/`Thing` CRUD scaffolding rather than porting it; it has no caller in production
- Document the required Socrata env vars (`SOCRATA_USERNAME`, `SOCRATA_PASSWORD`, `SOCRATA_APP_TOKEN_MTC`, `VMT_DATA_KEY`) in `.env.example`, which does not currently exist anywhere in this repo

### Data Layer

This is the section that changes most from the original plan. The original plan assumed a single SQL-Server-backed data layer migrating wholesale to Postgres. The real picture is two unrelated concerns:

- **VMT reporting data already lives in Socrata and should stay there.** Building a Postgres warehouse to replace it is a bigger, separate decision (see Open Decisions) — not a default part of this modernization.
- **Operational data (auth/users, and feedback if brought in-house) is the only piece that genuinely needs a real database**, replacing the SQLite-with-a-stray-mssql-flag setup. Postgres is a reasonable choice here, but the scope is much smaller than "migrate the whole app's data" — it's a users/sessions/feedback schema, not a VMT schema.
- If in-repo caching of Socrata results ever becomes necessary (e.g. for the years/jurisdictions lookups, which change rarely), that's a candidate for the same operational Postgres instance rather than a reason to duplicate the whole VMT dataset.
- **Commercial-vehicle VMT is a dataset-owner concern, not an app data-layer concern.** The Socrata dataset will be updated externally to include it; the app's data layer doesn't need a new table, a new dataset key, or a `vehicle_type` dimension of its own — it keeps querying the same dataset the same way and displays whatever comes back.

## Migration Strategy

Use an incremental strangler approach.

1. Stand up the new Next.js app alongside the legacy AngularJS app.
2. Create the new Node API with a typed Socrata client wrapping the existing `jurisdictions`/`vmt`/`years` contract, and a small Postgres schema for auth/users (replacing SQLite).
3. Migrate auth/session behavior onto the new API and Postgres-backed `User` model.
4. Move one feature area at a time from AngularJS to Next.js: data explorer → map → about → feedback → auth/account/admin.
5. Keep legacy and new systems interoperable until the cutover point.
6. Retire the old app only after the migrated surface is complete and stable.

Separately, and not gating any of the above: the Socrata VMT dataset gets updated by its owners to include commercial-vehicle data. No step in this migration strategy depends on that update landing first.

## Key Boundaries

### Frontend/API boundary

The Next.js app must not depend on legacy server internals or call Socrata directly. All product data should flow through the new API's contracts.

### API/data boundary

Socrata access and Postgres access both stay inside the backend. Frontend code should never hold Socrata credentials or a database connection directly.

### Legacy/new boundary

During migration, the old and new systems should coexist with explicit handoff points instead of shared hidden state.

### External API consumption — decided: frontend-only

**Decision (2026-08-24): the new API is internal to this app, not a public/external API.** This was worth checking rather than assuming, because there's real precedent the other way: this repo's own `gh-pages` branch (still linked from the current `about.html` FAQ) hosts a 2016-era page documenting a public `Data API` (`.../api/vmt/jurisdictionId/modelRunYear`) against a since-retired Elastic Beanstalk deployment, with sample requests and JSON responses meant for external consumers. That page has since moved its own "download the dataset" buttons to query Socrata directly instead of that old API, and the current app's Express routes have no CORS middleware and aren't documented anywhere as public. Given that pattern — and to keep the modernized app fully self-contained — the new API is scoped as **frontend-only**: no CORS configuration, no public API documentation, no stability guarantees for external callers. Anyone wanting programmatic access to the underlying VMT data should go to Socrata directly (`data.bayareametro.gov`), the same place the legacy `about.html` FAQ and the old gh-pages page already point external users. If a genuine external-consumer requirement surfaces later, that's a deliberate scope change, not something to build in preemptively.

## Risks and Mitigations

- **Socrata dependency risk:** the app's core data already depends on an external, rate-limited, third-party-hosted dataset with undocumented credentials. Document the required env vars and add error handling/caching so Socrata latency or throttling doesn't take down the whole data page (today, `getJurisdictions`/`getVMTbyJurisdiction` have no caching and minimal error handling).
- **ETL-to-Socrata gap risk:** the hand-off from `vmt-results-etl.py`'s output CSV to the live Socrata dataset is undocumented and unscripted. Losing the person who runs that step manually is a real operational risk worth closing during modernization.
- **Dataset-shape-change risk:** when the Socrata dataset is updated to include commercial-vehicle data, verify it doesn't silently change the shape the app assumes (extra rows per `model_run`/`cityname`, a redefined `total` field, etc.) in a way that breaks the existing non-commercial totals math. The app isn't expected to add commercial-specific handling, but it should keep working correctly on the updated dataset.
- **Auth migration risk:** keep the authentication model stable at first (same session/JWT shape), then improve internals later.
- **Feature drift risk:** migrate in small slices and verify parity per route/feature, especially the map page's Mapbox usage and the feedback form's external POST.
- **Scope creep risk:** avoid redesigning unrelated product areas during the platform rewrite, and avoid building a Postgres VMT warehouse unless a real requirement (not just "it's more modern than Socrata") drives it.

## Testing Strategy

- Unit test backend services and data access, including the Socrata client wrapper (mock the SODA API)
- Integration test API routes, including against a real or sandboxed Socrata dataset for at least one smoke test
- End-to-end test critical user flows in Next.js: data explorer, map, feedback, login/signup/admin
- Add parity checks for migrated features before decommissioning the legacy path
- Include a test fixture with an extra (commercial-vehicle) row/field in the Socrata response shape when testing the VMT read path, so a future dataset update doesn't silently break totals math the app does need to keep correct

## Non-Goals

- Rebuilding product behavior that does not affect the migration path
- Changing business rules without explicit product approval
- Introducing extra platform layers unless they solve a concrete migration problem
- Replacing Socrata with an owned data warehouse as part of this modernization, unless a separate decision explicitly calls for it
- Building app-side UI or API logic to distinguish, filter, or separately display commercial vs. non-commercial VMT — the dataset update is handled outside this codebase, and the app is not required to change to support it
- Building the new API as a public/external-facing API (CORS support, public API docs, versioning for outside consumers) — it's frontend-only by decision; external programmatic access to VMT data is Socrata's job, not this app's

## Open Decisions

- **Does Socrata stay the system of record for VMT data, or does the modernization also want to own that data in Postgres?** The current app already depends on Socrata in production; treat "stay on Socrata" as the default unless there's a stated reason (latency, offline access, query flexibility) to change it.
- **Feedback: bring the `/api/feedback` endpoint in-house, or keep pointing at the `basis-dev-2022` Elastic Beanstalk service?** That external dependency wasn't mentioned in the original plan at all.
- Exact ORM/data access approach for the (much smaller than originally scoped) Postgres operational schema
- Whether to finish the abandoned `getYears` → Socrata migration as part of this work or leave the hardcoded list
- Feature-by-feature cutover order
- Whether the `about.html`/`data.html` "non-commercial only" copy needs a content update once the underlying dataset changes — a product/content decision outside this plan's engineering scope

## Success Criteria

- The app runs on Next.js and a Node API, with VMT reporting data continuing to flow from Socrata and operational data (auth/users) on a real database instead of the ad hoc SQLite file
- Core user flows — data explorer, map, feedback, auth/account/admin — are available in the new stack
- The app correctly displays whatever the Socrata dataset returns, including after it's updated to include commercial-vehicle data, without requiring an app code change to do so
- Legacy AngularJS usage is removed or reduced to a temporary migration bridge
- The Socrata integration is documented (required env vars, dataset key, error handling) instead of tribal knowledge
- The new architecture is easier to maintain and extend than the current one
