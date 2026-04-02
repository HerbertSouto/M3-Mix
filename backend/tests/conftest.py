import pandas as pd
import numpy as np
import pytest


@pytest.fixture
def sample_df():
    """48 weeks of synthetic MMM data."""
    np.random.seed(42)
    n = 48
    dates = pd.date_range("2023-01-02", periods=n, freq="W-MON")
    tv = np.random.uniform(5000, 25000, n)
    social = np.random.uniform(2000, 10000, n)
    search = np.random.uniform(3000, 15000, n)
    baseline = 80_000
    revenue = (
        baseline
        + tv * 2.5
        + social * 1.2
        + search * 1.8
        + np.random.normal(0, 5000, n)
    )
    return pd.DataFrame({
        "date": dates,
        "revenue": revenue,
        "tv_spend": tv,
        "social_spend": social,
        "search_spend": search,
    })


@pytest.fixture
def channel_columns():
    return ["tv_spend", "social_spend", "search_spend"]
