# MMM Model

M3-Mix uses [PyMC-Marketing](https://www.pymc-marketing.io/) — an open source library built on top of PyMC — to fit a Bayesian Marketing Mix Model.

## Model components

### Adstock — GeometricAdstock

Models the residual (carryover) effect of media over time. A TV investment in week 1 still generates impact in weeks 2, 3, 4...

```
adstock(x_t) = x_t + α · adstock(x_{t-1})
```

- `α` (alpha) is the decay parameter, estimated per channel
- `l_max=8` — maximum window of 8 weeks
- Alpha close to 1 = slow decay (branding media like TV)
- Alpha close to 0 = fast decay (performance media like Search)

### Saturation — LogisticSaturation

Models diminishing returns: spending twice as much does not generate twice the result.

```
saturation(x) = L / (1 + exp(-k · (x - x0)))
```

- Sigmoidal curve — grows quickly at first and flattens at the top
- Parameters are estimated per channel via MCMC
- The exported saturation curve shows marginal return as a function of spend

### MCMC Inference

The model uses MCMC (Markov Chain Monte Carlo) via PyMC to estimate posterior distributions — not a single fixed number, but a distribution of plausible values given the data.

Default configuration:

```python
mmm.fit(
    X, y,
    draws=500,
    tune=500,
    target_accept=0.9,
    chains=2,
    cores=1,
)
```

This generates 1,000 samples per parameter (500 draws × 2 chains), sufficient for reliable credible intervals with series of ~100+ weeks.

## Input format

The model expects a DataFrame with:

| Column | Type | Description |
|--------|------|-------------|
| `date` | YYYY-MM-DD | Week date (weekly frequency) |
| `revenue` | float | Total revenue generated in the week |
| `*_spend` | float | Investment per channel — `_spend` suffix required |
| others | float | Control variables (e.g., `promo_flag`, `holiday_flag`) |

Control columns are detected automatically — any column that is not `date`, `revenue`, or `*_spend`.

## Extracted outputs

After fitting, the `extract_results()` service computes:

| Output | How it is calculated |
|--------|---------------------|
| **ROAS** | `total_contribution_channel / total_spend_channel` |
| **Contribution share** | `total_contribution_channel / total_revenue` |
| **Adstock alpha** | Posterior median of the α parameter per channel |
| **Saturation curve** | 50 points of `(spend, response)` for the logistic curve |
| **Decomposition** | `contributions_over_time()` — weekly contribution per channel |
| **Credible intervals** | 5th and 95th percentiles of beta samples per channel |

## Minimum recommended dataset

- **≥ 100 weeks** of data for reliable adstock and saturation estimates
- **≥ 1 channel** with `_spend` suffix
- No long gaps in the time series
- Real variation in spends (avoid constant spend values)

The included example dataset has 131 weeks (~2.5 years) with TV, Search, and Social.
