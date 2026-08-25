"""Tests for publish_to_socrata.py. Mocks the Socrata client - no real
network calls or credentials needed to run these.
"""

import pandas as pd
import pytest


def test_publish_requires_dataset_key(monkeypatch):
    import publish_to_socrata  # import first so any .env load happens once

    monkeypatch.delenv("VMT_DATA_KEY", raising=False)

    with pytest.raises(SystemExit):
        publish_to_socrata.main()


def test_publish_requires_vmt_results_csv(monkeypatch, tmp_path):
    import publish_to_socrata

    monkeypatch.setenv("VMT_DATA_KEY", "test-dataset-key")
    monkeypatch.chdir(tmp_path)  # empty directory, no vmt_results.csv

    with pytest.raises(SystemExit):
        publish_to_socrata.main()


def test_publish_uploads_csv_rows_to_socrata(monkeypatch, tmp_path):
    import publish_to_socrata

    monkeypatch.setenv("VMT_DATA_KEY", "test-dataset-key")
    monkeypatch.setenv("SOCRATA_APP_TOKEN_MTC", "test-token")
    monkeypatch.delenv("SOCRATA_USERNAME", raising=False)
    monkeypatch.delenv("SOCRATA_PASSWORD", raising=False)

    rows = [{"cityname": "Alameda", "model_run": "2050_06_YYY", "total": 43338}]
    pd.DataFrame(rows).to_csv(tmp_path / "vmt_results.csv", index=False)
    monkeypatch.chdir(tmp_path)

    calls = {}

    class FakeSocrata:
        def __init__(self, domain, app_token, **kwargs):
            calls["domain"] = domain
            calls["app_token"] = app_token
            calls["auth_kwargs"] = kwargs

        def replace(self, dataset_key, records):
            calls["dataset_key"] = dataset_key
            calls["records"] = records

    monkeypatch.setattr(publish_to_socrata, "Socrata", FakeSocrata)

    publish_to_socrata.main()

    assert calls["domain"] == "data.bayareametro.gov"
    assert calls["app_token"] == "test-token"
    assert calls["dataset_key"] == "test-dataset-key"
    assert calls["records"] == rows
