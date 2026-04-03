import warnings
import numpy as np
import pandas as pd
# Pin to legacy MMM API (deprecated in 0.19, removed in 0.20)
# Tracked for migration: https://www.pymc-marketing.io/en/latest/notebooks/mmm/mmm_migration_guide.html
with warnings.catch_warnings():
    warnings.simplefilter("ignore", DeprecationWarning)
    from pymc_marketing.mmm import MMM, GeometricAdstock, LogisticSaturation


def fit_mmm(
    df: pd.DataFrame,
    channel_columns: list[str],
    control_columns: list[str] | None = None,
    draws: int = 500,
    tune: int = 500,
    target_accept: float = 0.9,
) -> MMM:
    """Fit a Bayesian MMM and return the fitted model."""
    controls = control_columns or []
    mmm = MMM(
        adstock=GeometricAdstock(l_max=8),
        saturation=LogisticSaturation(),
        date_column="date",
        channel_columns=channel_columns,
        control_columns=controls if controls else None,
    )
    X = df[["date"] + channel_columns + controls]
    y = df["revenue"]
    mmm.fit(
        X,
        y,
        draws=draws,
        tune=tune,
        target_accept=target_accept,
        progressbar=False,
        chains=2,
        cores=1,  # single-process — avoids broken pipe on Windows/FastAPI threads
    )
    return mmm


def extract_results(
    mmm: MMM,
    df: pd.DataFrame,
    channel_columns: list[str],
    control_columns: list[str] | None = None,
) -> dict:
    """Extract structured results from a fitted MMM model."""

    # --- Contributions over time (original scale) ---
    contributions_df = mmm.compute_mean_contributions_over_time(original_scale=True)

    # --- ROAS: total channel contribution / total channel spend ---
    roas = {}
    for ch in channel_columns:
        total_spend = float(df[ch].sum())
        total_contribution = float(contributions_df[ch].sum()) if ch in contributions_df.columns else 0.0
        roas[ch] = total_contribution / total_spend if total_spend > 0 else 0.0

    # --- Contribution shares ---
    total_revenue = float(df["revenue"].sum())
    contributions: dict[str, float] = {}
    for ch in channel_columns:
        ch_total = float(contributions_df[ch].sum()) if ch in contributions_df.columns else 0.0
        contributions[ch] = ch_total / total_revenue if total_revenue > 0 else 0.0
    channels_total = sum(contributions.values())
    contributions["baseline"] = max(0.0, 1.0 - channels_total)

    # --- Contribution credible intervals (5th–95th percentile) ---
    contribution_intervals: dict[str, dict] = {}
    try:
        idata = mmm.idata
        beta_samples = idata.posterior["beta_channel"]  # (chain, draw, channel)
        for ch in channel_columns:
            betas = beta_samples.sel(channel=ch).values.flatten()
            median_beta = float(np.median(betas))
            if median_beta > 0 and ch in contributions_df.columns:
                mean_contrib = float(contributions_df[ch].sum()) / total_revenue
                q5_ratio  = float(np.percentile(betas,  5)) / median_beta
                q95_ratio = float(np.percentile(betas, 95)) / median_beta
                contribution_intervals[ch] = {
                    "mean":  mean_contrib,
                    "lower": max(0.0, mean_contrib * q5_ratio),
                    "upper": min(1.0, mean_contrib * q95_ratio),
                }
    except Exception:
        pass  # intervals are optional — silently skip if unavailable

    # --- Adstock alpha from posterior samples ---
    adstock: dict[str, float] = {}
    try:
        params = mmm.format_recovered_transformation_parameters(quantile=0.5)
        for ch in channel_columns:
            ch_params = params.get(ch, {})
            adstock_params = ch_params.get("adstock", {})
            adstock[ch] = float(adstock_params.get("alpha", 0.0))
    except (AttributeError, TypeError):
        # Fallback: read alpha directly from the InferenceData posterior
        try:
            idata = mmm.idata
            for ch in channel_columns:
                alpha_key = f"{ch}_adstock_alpha"
                if alpha_key in idata.posterior:
                    adstock[ch] = float(idata.posterior[alpha_key].mean().values)
                else:
                    adstock[ch] = 0.0
        except Exception:
            adstock = {ch: 0.0 for ch in channel_columns}

    # --- Saturation curves ---
    saturation: dict[str, list[dict[str, float]]] = {}
    for ch in channel_columns:
        max_spend = float(df[ch].max())
        spend_values = np.linspace(0, max_spend * 1.5, 50)
        try:
            grid = mmm.get_channel_contribution_forward_pass_grid(
                start=0.0,
                stop=max_spend * 1.5,
                num=50,
            )
            ch_grid = grid.mean(["chain", "draw", "date"]).sel(channel=ch)
            y_values = ch_grid.values.flatten()
            max_y = float(y_values.max()) if y_values.max() > 0 else 1.0
            saturation[ch] = [
                {"x": float(x), "y": float(y / max_y)}
                for x, y in zip(spend_values, y_values)
            ]
        except Exception:
            # Fallback: simple exponential saturation curve
            lam = 1.0 / (max_spend * 0.5) if max_spend > 0 else 1.0
            saturation[ch] = [
                {"x": float(x), "y": float(1 - np.exp(-lam * x))}
                for x in spend_values
            ]

    # --- Temporal decomposition ---
    decomposition: list[dict] = []
    for ch in channel_columns:
        if ch not in contributions_df.columns:
            continue
        for date, value in zip(df["date"], contributions_df[ch].values):
            decomposition.append({
                "date": str(pd.Timestamp(date).date()),
                "channel": ch,
                "value": float(value),
            })
    # Baseline per date
    ch_cols = [c for c in channel_columns if c in contributions_df.columns]
    ch_total_per_date = contributions_df[ch_cols].sum(axis=1).values
    for date, revenue, ch_total in zip(df["date"], df["revenue"].values, ch_total_per_date):
        decomposition.append({
            "date": str(pd.Timestamp(date).date()),
            "channel": "baseline",
            "value": float(revenue - ch_total),
        })

    return {
        "roas": roas,
        "contributions": contributions,
        "contribution_intervals": contribution_intervals,
        "adstock": adstock,
        "saturation": saturation,
        "decomposition": decomposition,
    }
