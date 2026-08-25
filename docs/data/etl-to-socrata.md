# ETL-to-Socrata Publish Step

## What this closes

Per `etl/readme.md`, `vmt-results-etl.py`'s `vmt_results.csv` output "can
then [be] used in the CAPVMT web application" — but how it actually gets
from that CSV into the live Socrata dataset the app reads (`VMT_DATA_KEY`)
was undocumented and unscripted anywhere in this repo. `etl/publish_to_socrata.py`
replaces that manual, tribal-knowledge hand-off with a repeatable script.

## Usage

```bash
cd etl
pip install -r requirements-dev.txt   # first time / after pulling changes
python vmt-results-etl.py
python publish_to_socrata.py
```

This is a **manually-run script**, not a scheduled job — matching the actual
cadence of the work. New travel-model output doesn't show up on a fixed
schedule; it's produced whenever MTC's modeling team finishes a new round of
model runs (per `etl/readme.md`, an occasional multi-scenario batch, not a
recurring one). Someone runs both commands by hand when new data is ready.

## Configuration

`publish_to_socrata.py` reads the same `SOCRATA_USERNAME`, `SOCRATA_PASSWORD`,
`SOCRATA_APP_TOKEN_MTC`, and `VMT_DATA_KEY` env vars the `api` workspace uses
(see `docs/data/socrata-integration.md`) — documented once, not twice. It
loads them from the monorepo-root `.env` automatically (via `python-dotenv`),
so no separate Python-specific config is needed if `.env` is already set up
for local development.

## What it does

`client.replace(dataset_key, records)` — a full replace of the dataset's
contents with `vmt_results.csv`'s rows, not an incremental append. This
matches how the current dataset is evidently maintained (a single table
covering all model runs) and avoids ever-growing duplicate rows across runs
of the ETL pipeline.

## Verified against the real dataset (read-only)

Confirmed the configured credentials and `VMT_DATA_KEY` actually reach the
live dataset, using a **read-only** query (`client.get(dataset_key, limit=1)`)
— deliberately not `client.replace()`, since that would overwrite live
production data and isn't something to do without an explicit, deliberate
publish. The real dataset's fields are exactly what the app already expects:
`lives`, `works`, `inside`, `partially_in`, `outside`, `total`, `persons`,
`tazlist`, `model_run`, `cityname` (plus `sortorder2`, `sortorder3`, and
`placeid`, which the app doesn't currently read).

## Not yet verified

The full pipeline end-to-end (`vmt-results-etl.py` against real travel-model
input CSVs, piped into `publish_to_socrata.py` against a **sandbox/staging**
Socrata dataset) — that needs real model output files this environment
doesn't have, and a staging dataset to publish to without touching
production. `publish_to_socrata.py` itself is unit-tested
(`etl/test_publish_to_socrata.py`, mocked Socrata client, no real network
calls) and was confirmed to reach the real production dataset read-only, but
a full write-path rehearsal against a non-production dataset is worth doing
before the first real publish.
