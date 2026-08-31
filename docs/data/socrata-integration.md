# Socrata Integration

The app's VMT reporting data comes from a Socrata (SODA API) dataset published
by MTC, not from this app's own database. This document exists because, prior
to this modernization, the required configuration was tribal knowledge — none
of it was written down anywhere in the repo.

## Client

`web/lib/socrata/client.ts` — `SocrataClient` is a thin wrapper over the SODA
REST API (`GET https://{domain}/resource/{dataset}.json`), replacing the
legacy `soda-js` `Consumer` used directly in
`server/api/data/data.controller.js`. (Originally `api/src/socrata/client.ts`
in a separate Express service, ported verbatim when that service was folded
into this app's own Route Handlers — see
`docs/superpowers/specs/2026-08-14-modernization-design.md`'s "Deployment"
section.)

`web/lib/socrata/vmt.ts` — `SocrataVmtClient` wraps `SocrataClient` with the
three queries this app actually needs, called from `web/app/api/data/*`
Route Handlers via `web/lib/socrata/route-helpers.ts`:

| Method | Replaces (legacy) | SODA query |
| --- | --- | --- |
| `getJurisdictions()` | `data.controller.js#getJurisdictions` | `$select=cityname&$group=cityname&$order=cityname&$limit=200` |
| `getVmtByJurisdiction(modelRun, cityName)` | `data.controller.js#getVMTbyJurisdiction` | `model_run={modelRun}&cityname={cityName}&$limit=200` |
| `getModelRunYears()` | the commented-out block in `data.controller.js#getYears` (never enabled — that endpoint returns a hardcoded array today) | `$select=model_run&$group=model_run&$order=model_run` |

The client returns whatever fields Socrata has for a row rather than
reshaping the response, so a dataset update (e.g. adding a commercial-vehicle
field — see the design doc's "Vehicle type scope") doesn't require a code
change here.

## Required configuration

| Env var | Purpose |
| --- | --- |
| `VMT_DATA_KEY` | The Socrata dataset identifier (the `{dataset}` in the resource URL above) |
| `SOCRATA_APP_TOKEN_MTC` | Sent as the `X-App-Token` header; raises Socrata's per-IP rate limit |
| `SOCRATA_USERNAME` / `SOCRATA_PASSWORD` | Sent as HTTP Basic Auth, if set. Not required for reading a public dataset — the legacy code carried these around from the same `soda-js` config object used for both reads and writes, but this client is read-only |

See `.env.example` at the repo root. None of these had a documented source
before this modernization; ask whoever manages the deployment's environment
variables (see the deployment findings from the modernization design
conversation — currently AWS Elastic Beanstalk, secrets distributed via an
MTC Box folder) for the actual values.

## Domain

Defaults to `data.bayareametro.gov`, overridable via the `domain` config
option for testing against a different Socrata instance.
