import pandas as pd
import pytest
from config import ROOT_DATA_DIR
from pandas.api.types import is_float_dtype, is_integer_dtype

# Adjust the path to the root data directory (VMT Dataportal) as needed
NEW_FNAME = ROOT_DATA_DIR / "scripts_data_2026_update" / "vmt_results.csv"
OLD_FNAME = ROOT_DATA_DIR / "scripts_data_2050" / "vmt_results.csv"


@pytest.fixture(scope="session")
def new_vmt_results() -> pd.DataFrame:
    assert NEW_FNAME.exists(), f"Missing input file: {NEW_FNAME}"
    return pd.read_csv(NEW_FNAME)


@pytest.fixture(scope="session")
def old_vmt_results() -> pd.DataFrame:
    assert OLD_FNAME.exists(), f"Missing input file: {OLD_FNAME}"
    return pd.read_csv(OLD_FNAME)


def assert_balanced_categories(
    df: pd.DataFrame,
    column: str,
    expected_values: set[str],
    n_categories: int,
) -> None:
    assert set(df[column].unique()) == expected_values
    counts = df[column].value_counts()
    assert counts.nunique() == 1
    assert counts.iloc[0] * n_categories == len(df)


@pytest.mark.parametrize(
    "column,expected_values,n_categories",
    [
        ("Lives", {"Live in area", "Live out of area"}, 2),
        ("Works", {"Works in area", "Works out of area", "Non-worker"}, 3),
        ("SortOrder2", {"A", "B"}, 2),
        ("SortOrder3", {"D", "E", "F"}, 3),
    ],
)
def test_category_fields_match_and_are_balanced(
    new_vmt_results: pd.DataFrame,
    old_vmt_results: pd.DataFrame,
    column: str,
    expected_values: set[str],
    n_categories: int,
) -> None:
    assert set(new_vmt_results[column].unique()) == set(
        old_vmt_results[column].unique()
    )
    assert set(new_vmt_results[column].unique()) == expected_values

    assert_balanced_categories(new_vmt_results, column, expected_values, n_categories)
    assert_balanced_categories(old_vmt_results, column, expected_values, n_categories)


def test_inside_field(
    new_vmt_results: pd.DataFrame, old_vmt_results: pd.DataFrame
) -> None:
    assert is_float_dtype(new_vmt_results["Inside"])
    assert is_float_dtype(old_vmt_results["Inside"])

    assert (new_vmt_results["Inside"] >= 0).all()
    assert (old_vmt_results["Inside"] >= 0).all()


def test_partially_in_field(
    new_vmt_results: pd.DataFrame, old_vmt_results: pd.DataFrame
) -> None:
    assert is_float_dtype(new_vmt_results["Partially_In"])
    assert is_float_dtype(old_vmt_results["Partially_In"])

    assert (new_vmt_results["Partially_In"] >= 0).all()
    assert (old_vmt_results["Partially_In"] >= 0).all()


def test_outside_field(
    new_vmt_results: pd.DataFrame, old_vmt_results: pd.DataFrame
) -> None:
    assert is_float_dtype(new_vmt_results["Outside"])
    assert is_float_dtype(old_vmt_results["Outside"])

    assert (new_vmt_results["Outside"] >= 0).all()
    assert (old_vmt_results["Outside"] >= 0).all()


def test_total_field(
    new_vmt_results: pd.DataFrame, old_vmt_results: pd.DataFrame
) -> None:
    assert is_float_dtype(new_vmt_results["Total"])
    assert is_float_dtype(old_vmt_results["Total"])

    assert (new_vmt_results["Total"] >= 0).all()
    assert (old_vmt_results["Total"] >= 0).all()

    df2 = pd.DataFrame(
    new_vmt_results["Inside"]
    + new_vmt_results["Partially_In"]
    + new_vmt_results["Outside"], columns=["Total"])

    # the total is not exactly equal to the sum of the three columns due to rounding, so we use check_exact=False and atol=1
    pd.testing.assert_frame_equal(new_vmt_results[["Total"]], df2, check_exact=False, atol=1)


def test_persons_field(
    new_vmt_results: pd.DataFrame, old_vmt_results: pd.DataFrame
) -> None:
    assert is_integer_dtype(new_vmt_results["Persons"])
    assert is_integer_dtype(old_vmt_results["Persons"])

    assert (new_vmt_results["Persons"] >= 0).all()
    assert (old_vmt_results["Persons"] >= 0).all()


def test_placeid_field(
    new_vmt_results: pd.DataFrame, old_vmt_results: pd.DataFrame
) -> None:
    assert set(new_vmt_results["placeid"].unique()) == set(
        old_vmt_results["placeid"].unique()
    )
    assert (
        new_vmt_results["placeid"].nunique()
        == old_vmt_results["placeid"].nunique()
        == 176
    )

    new_counts = new_vmt_results["placeid"].value_counts()
    old_counts = old_vmt_results["placeid"].value_counts()

    assert new_counts.nunique() == 1
    assert old_counts.nunique() == 1

    assert new_counts.iloc[0] == (
        new_vmt_results["model_run"].nunique()
        * new_vmt_results["Lives"].nunique()
        * new_vmt_results["Works"].nunique()
    )
    assert old_counts.iloc[0] == (
        old_vmt_results["model_run"].nunique()
        * old_vmt_results["Lives"].nunique()
        * old_vmt_results["Works"].nunique()
    )


def test_tazlist_field(
    new_vmt_results: pd.DataFrame, old_vmt_results: pd.DataFrame
) -> None:
    new_tazlist = new_vmt_results["tazlist"].str.split(",").explode().astype(int)
    old_tazlist = old_vmt_results["tazlist"].str.split(",").explode().astype(int)

    assert set(new_tazlist.unique()) == set(old_tazlist.unique())
    assert new_tazlist.nunique() == old_tazlist.nunique() == 1454


def test_cityname_field(
    new_vmt_results: pd.DataFrame, old_vmt_results: pd.DataFrame
) -> None:
    assert set(new_vmt_results["CityName"].unique()) == set(
        old_vmt_results["CityName"].unique()
    )
    assert (
        new_vmt_results["CityName"].nunique()
        == old_vmt_results["CityName"].nunique()
        == 176
    )

    new_counts = new_vmt_results["CityName"].value_counts()
    old_counts = old_vmt_results["CityName"].value_counts()

    assert new_counts.nunique() == 1
    assert old_counts.nunique() == 1

    assert new_counts.iloc[0] == (
        new_vmt_results["model_run"].nunique()
        * new_vmt_results["Lives"].nunique()
        * new_vmt_results["Works"].nunique()
    )
    assert old_counts.iloc[0] == (
        old_vmt_results["model_run"].nunique()
        * old_vmt_results["Lives"].nunique()
        * old_vmt_results["Works"].nunique()
    )
