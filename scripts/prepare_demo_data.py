"""
Prepares demo_data.csv from PyMC-Marketing's mmm_roas_data.csv.

Renames normalized channels to realistic names and scales spend values
to dollar amounts representative of a mid-size brand.
"""
import pandas as pd
import numpy as np

RAW = "data/mmm_roas_data.csv"
OUT = "data/demo_data.csv"

df = pd.read_csv(RAW, parse_dates=["date"])

# Scale normalized spend (0-2 range) to realistic dollar amounts
# x1 → tv_spend: $5k–$80k/week
# x2 → social_spend: $2k–$30k/week
# Synthesize a third channel from noise for richer demo
np.random.seed(42)
n = len(df)

tv_spend = (df["x1"] / df["x1"].max() * 75_000).clip(5_000).round(-2)
social_spend = (df["x2"] / df["x2"].max() * 28_000).clip(2_000).round(-2)
search_spend = pd.Series(
    np.random.uniform(3_000, 18_000, n), index=df.index
).round(-2)

# Scale revenue (y) to dollars: multiply to realistic range ($150k–$600k/week)
revenue = (df["y"] / df["y"].max() * 580_000).clip(100_000).round(2)

demo = pd.DataFrame({
    "date": df["date"].dt.strftime("%Y-%m-%d"),
    "revenue": revenue,
    "tv_spend": tv_spend,
    "social_spend": social_spend,
    "search_spend": search_spend,
})

demo.to_csv(OUT, index=False)

print(f"Saved {len(demo)} rows to {OUT}")
print(demo.describe().round(0))
