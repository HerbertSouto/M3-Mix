import numpy as np
import pandas as pd
from pymc_marketing.mmm import MMM, GeometricAdstock, LogisticSaturation


def fit_mmm(
    df: pd.DataFrame,
    channel_columns: list[str],
    draws: int = 1000,
    tune: int = 1000,
    target_accept: float = 0.9,
) -> MMM:
    """Fit a Bayesian MMM and return the fitted model."""
    mmm = MMM(
        adstock=GeometricAdstock(l_max=8),
        saturation=LogisticSaturation(),
        date_column="date",
        channel_columns=channel_columns,
    )
    X = df[["date"] + channel_columns]
    y = df["revenue"]
    mmm.fit(
        X,
        y,
        draws=draws,
        tune=tune,
        target_accept=target_accept,
        progressbar=False,
    )
    return mmm


def extract_results(
    mmm: MMM,
    df: pd.DataFrame,
    channel_columns: list[str],
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

    # --- Adstock alpha from recovered transformation parameters ---
    params = mmm.format_recovered_transformation_parameters(quantile=0.5)
    adstock: dict[str, float] = {}
    for ch in channel_columns:
        ch_params = params.get(ch, {})
        adstock_params = ch_params.get("adstock", {})
        adstock[ch] = float(adstock_params.get("alpha", 0.0))

    # --- Saturation curves ---
    saturation: dict[str, list[dict[str, float]]] = {}
    for ch in channel_columns:
        max_spend = float(df[ch].max())
        grid = mmm.get_channel_contribution_forward_pass_grid(
            start=0.0,
            stop=max_spend * 1.5,
            num=50,
        )
        # grid is xarray DataArray with dims (chain, draw, date, channel, spend)
        # mean over chain/draw/date, select channel
        try:
            ch_grid = grid.mean(["chain", "draw", "date"]).sel(channel=ch)
            spend_values = np.linspace(0, max_spend * 1.5, 50)
            y_values = ch_grid.values.flatten()
            max_y = float(y_values.max()) if y_values.max() > 0 else 1.0
            saturation[ch] = [
                {"x": float(x), "y": float(y / max_y)}
                for x, y in zip(spend_values, y_values)
            ]
        except Exception:
            # Fallback: simple logistic curve using adstock alpha
            spend_values = np.linspace(0, max_spend * 1.5, 50)
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
        "adstock": adstock,
        "saturation": saturation,
        "decomposition": decomposition,
    }
