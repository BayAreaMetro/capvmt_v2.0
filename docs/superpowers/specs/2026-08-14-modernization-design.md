# Application Modernization Design

> **Updated 2026-08-24** after a direct codebase audit of `capvmt_v2.0` (this repo — the current/latest version of the app). The original current-state description below was carried over from the CAPVMT repo's modernization worktree and assumed SQL Server was still the live data source. That assumption was wrong for this codebase: the VMT reporting data path already runs through the Socrata Open Data API. Sections below are rewritten to match what the code actually does; corrections are called out inline.
>
> **Updated again 2026-08-24** to add a product requirement: the current app only publishes non-commercial (passenger) VMT — this is confirmed in-repo, not just assumed (see "Vehicle type scope" below). The modernized app needs to add commercial-vehicle VMT and show both sets of stats. The data to do this **does not exist yet anywhere in this repo or its pipeline** and needs to be sourced/produced as part of this work — see the new Open Decisions and Task 2.

## Goal

Replace the legacy AngularJS 1.x + Express + ad hoc data layer with a modern architecture built around:

- **Frontend:** Next.js
- **Backend:** Node API
- **Database:** an owned relational store for operational data (auth/users, feedback) — see "Data Layer" below for why this is no longer a flat "move to Postgres" task

The end state should preserve current product behavior while removing the oldest platform constraints and making future feature work safer and faster, **and extend the product to cover commercial-vehicle VMT alongside the existing non-commercial VMT stats** (today the app publishes non-commercial data only — see "Vehicle type scope" below).

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

### Vehicle type scope — the app only publishes non-commercial VMT today

This is explicit and deliberate in both the product copy and the pipeline, not an oversight to just "turn on" a hidden field:

- `client/app/about/about.html` states outright: *"These data summaries include only non-commercial travel. Meaning, it does [not include] moving goods/freight."*
- `client/app/data/data.html` labels the published metric **"Non-commercial Passenger Vehicle Miles Traveled"** in two places.
- The ETL pipeline (`etl/vmt-results-etl.py`) computes VMT shares from `persons_table`/`vmt_table` inputs keyed by `WorkLocation`/`orig_taz`/`dest_taz` — these are person/household-trip outputs from the travel demand model. Commercial and freight vehicle movement isn't represented in person-trip tables at all in typical four-step travel demand models (including MTC's `travel-model-one`, which `etl/readme.md` links to); it normally comes from a separate commercial-vehicle or truck sub-model, if one exists and is run.
- There is **no commercial/truck/freight VMT data anywhere** in this repo — not in the ETL inputs or outputs, not in the Socrata query fields the app reads (`cityname`, `model_run`, `inside`, `outside`, `partially_in`, `persons`, `total`, `tazlist`), not in the Socrata dataset schema as consumed by `data.controller.js`.

Per the product requirement gathered during this modernization effort, **a commercial-vehicle VMT data source needs to be defined and produced from scratch** — it is not a matter of exposing an existing field. See Open Decisions and Task 2 of the implementation plan.

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
- **Add a `vehicleType` dimension (`non_commercial` / `commercial`) to the VMT read endpoints** so the frontend can request or display both stat sets. The exact shape (query param vs. always-return-both-in-one-response) is an implementation choice, but the API contract should not hardcode "non-commercial only" the way the legacy controller and Socrata dataset do today
- Finish the abandoned `getYears` migration: query distinct `model_run` values from Socrata instead of the hardcoded array
- Move `User` (and any operational data that should stay writable in-app, e.g. feedback if brought in-house) off the ad hoc SQLite/Sequelize setup onto a properly provisioned database — see Data Layer below
- Delete the unused `Data`/`Thing` CRUD scaffolding rather than porting it; it has no caller in production
- Document the required Socrata env vars (`SOCRATA_USERNAME`, `SOCRATA_PASSWORD`, `SOCRATA_APP_TOKEN_MTC`, `VMT_DATA_KEY`) in `.env.example`, which does not currently exist anywhere in this repo

### Data Layer

This is the section that changes most from the original plan. The original plan assumed a single SQL-Server-backed data layer migrating wholesale to Postgres. The real picture is two unrelated concerns:

- **VMT reporting data already lives in Socrata and should stay there.** Building a Postgres warehouse to replace it is a bigger, separate decision (see Open Decisions) — not a default part of this modernization.
- **Operational data (auth/users, and feedback if brought in-house) is the only piece that genuinely needs a real database**, replacing the SQLite-with-a-stray-mssql-flag setup. Postgres is a reasonable choice here, but the scope is much smaller than "migrate the whole app's data" — it's a users/sessions/feedback schema, not a VMT schema.
- If in-repo caching of Socrata results ever becomes necessary (e.g. for the years/jurisdictions lookups, which change rarely), that's a candidate for the same operational Postgres instance rather than a reason to duplicate the whole VMT dataset.
- **Commercial-vehicle VMT is new data that doesn't exist yet, not a field to unhide.** Whatever produces it (an extended ETL step against a commercial/truck model output, or a manually sourced dataset) needs to land somewhere queryable with the same `model_run` + `cityname` shape the non-commercial data already has, so the API can serve both series consistently. Whether that's a second Socrata dataset, an added `vehicle_type` column on the existing one, or a Postgres table is an open decision — see below.

## Migration Strategy

Use an incremental strangler approach.

1. Stand up the new Next.js app alongside the legacy AngularJS app.
2. Define and produce a commercial-vehicle VMT data source (new ETL work, new/extended Socrata dataset) — this can proceed in parallel with steps 3–4 but must land before the data explorer migration in step 5 shows both stat sets.
3. Create the new Node API with a typed Socrata client wrapping the existing `jurisdictions`/`vmt`/`years` contract plus the new commercial-vehicle series, and a small Postgres schema for auth/users (replacing SQLite).
4. Migrate auth/session behavior onto the new API and Postgres-backed `User` model.
5. Move one feature area at a time from AngularJS to Next.js: data explorer (now showing non-commercial + commercial side by side) → map → about → feedback → auth/account/admin.
6. Keep legacy and new systems interoperable until the cutover point.
7. Retire the old app only after the migrated surface is complete and stable.

## Key Boundaries

### Frontend/API boundary

The Next.js app must not depend on legacy server internals or call Socrata directly. All product data should flow through the new API's contracts.

### API/data boundary

Socrata access and Postgres access both stay inside the backend. Frontend code should never hold Socrata credentials or a database connection directly.

### Legacy/new boundary

During migration, the old and new systems should coexist with explicit handoff points instead of shared hidden state.

## Risks and Mitigations

- **Socrata dependency risk:** the app's core data already depends on an external, rate-limited, third-party-hosted dataset with undocumented credentials. Document the required env vars and add error handling/caching so Socrata latency or throttling doesn't take down the whole data page (today, `getJurisdictions`/`getVMTbyJurisdiction` have no caching and minimal error handling).
- **ETL-to-Socrata gap risk:** the hand-off from `vmt-results-etl.py`'s output CSV to the live Socrata dataset is undocumented and unscripted. Losing the person who runs that step manually is a real operational risk worth closing during modernization.
- **Commercial-vehicle data does not exist risk:** this is the single biggest unknown in this plan. Producing commercial VMT may require a travel-demand-modeling deliverable (a commercial/truck sub-model run) that's outside typical software engineering scope and outside this repo's control — it could be a multi-week modeling effort, not a coding task. Treat "define and produce the commercial VMT source" as its own tracked work item with its own timeline, not a line item inside the Socrata client task, so it doesn't silently block the rest of the modernization.
- **Auth migration risk:** keep the authentication model stable at first (same session/JWT shape), then improve internals later.
- **Feature drift risk:** migrate in small slices and verify parity per route/feature, especially the map page's Mapbox usage and the feedback form's external POST.
- **Scope creep risk:** avoid redesigning unrelated product areas during the platform rewrite, and avoid building a Postgres VMT warehouse unless a real requirement (not just "it's more modern than Socrata") drives it.

## Testing Strategy

- Unit test backend services and data access, including the Socrata client wrapper (mock the SODA API)
- Integration test API routes, including against a real or sandboxed Socrata dataset for at least one smoke test
- End-to-end test critical user flows in Next.js: data explorer (both vehicle types), map, feedback, login/signup/admin
- Add parity checks for migrated features before decommissioning the legacy path
- Once a commercial-vehicle data source exists, add the same shape of test coverage for it as for non-commercial (unit test the client method, integration test the route, E2E test the UI toggle/section)

## Non-Goals

- Rebuilding product behavior that does not affect the migration path
- Changing business rules without explicit product approval
- Introducing extra platform layers unless they solve a concrete migration problem
- Replacing Socrata with an owned data warehouse as part of this modernization, unless a separate decision explicitly calls for it

## Open Decisions

- **Does Socrata stay the system of record for VMT data, or does the modernization also want to own that data in Postgres?** The current app already depends on Socrata in production; treat "stay on Socrata" as the default unless there's a stated reason (latency, offline access, query flexibility) to change it.
- **Feedback: bring the `/api/feedback` endpoint in-house, or keep pointing at the `basis-dev-2022` Elastic Beanstalk service?** That external dependency wasn't mentioned in the original plan at all.
- Exact ORM/data access approach for the (much smaller than originally scoped) Postgres operational schema
- Whether to finish the abandoned `getYears` → Socrata migration as part of this work or leave the hardcoded list
- Feature-by-feature cutover order
- **Where does commercial-vehicle VMT come from?** Confirmed during this update: it doesn't exist anywhere today (not in the ETL inputs/outputs, not in the Socrata dataset). This needs an answer before Task 2 of the plan can move past research: is there a commercial/truck sub-model in MTC's travel-model-one (or a companion model) that can feed an ETL step analogous to `vmt-results-etl.py`? Or does commercial VMT need to come from a different source entirely (e.g. a third-party freight dataset, Caltrans/HPMS truck AADT data, or another MTC data product)? This is a data/modeling-team question as much as an engineering one.
- **Storage shape for commercial VMT once sourced:** a `vehicle_type` column added to the existing Socrata VMT dataset (simplest for the API, requires a Socrata dataset schema change and a backfill), a second parallel Socrata dataset (keeps the two series fully independent, doubles the client/query surface), or a Postgres table if Socrata turns out to be the wrong fit for this new data. Decide once the source (previous bullet) is known — the shape of the source data may constrain this.
- **UI presentation:** side-by-side columns/totals on the same `data` page (matches "show both sets of stats" literally), a toggle/tab between the two, or a combined total with a breakdown — needs a product/design call, not just an engineering one.

## Success Criteria

- The app runs on Next.js and a Node API, with VMT reporting data continuing to flow from Socrata and operational data (auth/users) on a real database instead of the ad hoc SQLite file
- Core user flows — data explorer, map, feedback, auth/account/admin — are available in the new stack
- **The data explorer shows both non-commercial and commercial VMT stats**, clearly labeled as such (today's "Non-commercial Passenger Vehicle Miles Traveled" labeling should not silently become ambiguous once a second series is added)
- Legacy AngularJS usage is removed or reduced to a temporary migration bridge
- The Socrata integration is documented (required env vars, dataset key, error handling) instead of tribal knowledge
- The new architecture is easier to maintain and extend than the current one
