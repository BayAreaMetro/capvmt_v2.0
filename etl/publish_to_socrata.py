"""Publishes vmt-results-etl.py's vmt_results.csv output to the live
Socrata dataset the app reads (VMT_DATA_KEY). Replaces the manual,
previously-undocumented hand-off described in etl/readme.md - see
docs/data/etl-to-socrata.md.

Usage:
    python vmt-results-etl.py && python publish_to_socrata.py
"""

import os
import sys

import pandas as pd
from dotenv import load_dotenv
from sodapy import Socrata

# Loads the monorepo-root .env (see .env.example) - the same
# SOCRATA_*/VMT_DATA_KEY credentials the api workspace uses
# (api/src/env.ts), documented in one place instead of two. Silently
# does nothing if the file doesn't exist.
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env"))


def main():
    dataset_key = os.environ.get("VMT_DATA_KEY")
    if not dataset_key:
        print("VMT_DATA_KEY is required", file=sys.stderr)
        sys.exit(1)

    if not os.path.exists("vmt_results.csv"):
        print("vmt_results.csv not found - run vmt-results-etl.py first", file=sys.stderr)
        sys.exit(1)

    client = Socrata(
        "data.bayareametro.gov",
        os.environ.get("SOCRATA_APP_TOKEN_MTC"),
        username=os.environ.get("SOCRATA_USERNAME"),
        password=os.environ.get("SOCRATA_PASSWORD"),
    )
    df = pd.read_csv("vmt_results.csv")
    client.replace(dataset_key, df.to_dict("records"))
    print(f"Published {len(df)} rows to Socrata dataset {dataset_key}")


if __name__ == "__main__":
    main()
