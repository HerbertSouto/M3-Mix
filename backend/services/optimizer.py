import numpy as np
from scipy.optimize import minimize


def _revenue_estimate(allocation: np.ndarray, roas: list[float]) -> float:
    """Simple linear revenue model: sum(spend * roas) per channel. Negated for minimization."""
    return -float(np.dot(allocation, roas))


def optimize_budget(
    roas: dict[str, float],
    current_allocation: dict[str, float],
    total_budget: float,
) -> dict:
    channels = list(roas.keys())
    roas_values = [roas[ch] for ch in channels]
    current_values = [current_allocation.get(ch, 0.0) for ch in channels]
    n = len(channels)

    constraints = [{"type": "eq", "fun": lambda x: x.sum() - total_budget}]
    bounds = [(0, total_budget) for _ in range(n)]

    x0 = np.array(current_values, dtype=float)
    if x0.sum() > 0:
        x0 = x0 * (total_budget / x0.sum())

    result = minimize(
        _revenue_estimate,
        x0,
        args=(roas_values,),
        method="SLSQP",
        bounds=bounds,
        constraints=constraints,
        options={"ftol": 1e-9, "maxiter": 1000},
    )

    suggested = {ch: float(v) for ch, v in zip(channels, result.x)}
    current_revenue = sum(current_allocation.get(ch, 0.0) * roas[ch] for ch in channels)
    suggested_revenue = sum(suggested[ch] * roas[ch] for ch in channels)
    uplift = ((suggested_revenue - current_revenue) / current_revenue * 100) if current_revenue > 0 else 0.0

    return {
        "current_allocation": {ch: current_allocation.get(ch, 0.0) for ch in channels},
        "suggested_allocation": suggested,
        "current_revenue_estimate": current_revenue,
        "suggested_revenue_estimate": suggested_revenue,
        "uplift_percent": round(uplift, 2),
    }
