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
from mtcpy.socrata import replace_df_socrata

from config import INPUTS_FOLDER

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

    vmt_results_path = INPUTS_FOLDER / "vmt_results.csv"
    if not os.path.exists(vmt_results_path):
        print("vmt_results.csv not found - run vmt-results-etl.py first", file=sys.stderr)
        sys.exit(1)

    df = pd.read_csv(vmt_results_path)
    replace_df_socrata(
        df=df,
        socrata_data_id=dataset_key,
        creds_label="default"
    )
    print(f"Published {len(df)} rows to Socrata dataset {dataset_key}")


if __name__ == "__main__":
    main()
