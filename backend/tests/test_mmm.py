import pytest
from services.mmm import fit_mmm, extract_results


def test_fit_mmm_returns_fitted_model(sample_df, channel_columns):
    model = fit_mmm(sample_df, channel_columns, draws=100, tune=100)
    assert model is not None


def test_extract_results_has_all_channels(sample_df, channel_columns):
    model = fit_mmm(sample_df, channel_columns, draws=100, tune=100)
    results = extract_results(model, sample_df, channel_columns)
    for ch in channel_columns:
        assert ch in results["roas"]
        assert ch in results["contributions"]
        assert ch in results["adstock"]
        assert ch in results["saturation"]


def test_roas_values_are_positive(sample_df, channel_columns):
    model = fit_mmm(sample_df, channel_columns, draws=100, tune=100)
    results = extract_results(model, sample_df, channel_columns)
    for ch in channel_columns:
        assert results["roas"][ch] > 0


def test_contributions_sum_to_one(sample_df, channel_columns):
    model = fit_mmm(sample_df, channel_columns, draws=100, tune=100)
    results = extract_results(model, sample_df, channel_columns)
    total = sum(results["contributions"].values())
    assert abs(total - 1.0) < 0.01


def test_decomposition_has_date_entries(sample_df, channel_columns):
    model = fit_mmm(sample_df, channel_columns, draws=100, tune=100)
    results = extract_results(model, sample_df, channel_columns)
    assert len(results["decomposition"]) > 0
    first = results["decomposition"][0]
    assert "date" in first and "channel" in first and "value" in first
