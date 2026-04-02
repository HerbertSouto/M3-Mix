from services.optimizer import optimize_budget


def test_optimize_budget_respects_total_budget():
    roas = {"tv_spend": 2.5, "social_spend": 1.2, "search_spend": 1.8}
    current = {"tv_spend": 20000, "social_spend": 8000, "search_spend": 12000}
    result = optimize_budget(roas, current, 40000)
    allocated = sum(result["suggested_allocation"].values())
    assert abs(allocated - 40000) < 1.0


def test_optimize_budget_increases_high_roas_channel():
    roas = {"tv_spend": 3.0, "social_spend": 0.5, "search_spend": 1.0}
    current = {"tv_spend": 10000, "social_spend": 15000, "search_spend": 15000}
    result = optimize_budget(roas, current, 40000)
    assert result["suggested_allocation"]["tv_spend"] > current["tv_spend"]


def test_optimize_budget_returns_uplift():
    roas = {"tv_spend": 2.5, "social_spend": 1.2, "search_spend": 1.8}
    current = {"tv_spend": 20000, "social_spend": 8000, "search_spend": 12000}
    result = optimize_budget(roas, current, 40000)
    assert "uplift_percent" in result
    assert isinstance(result["uplift_percent"], float)


def test_optimize_budget_no_channel_gets_negative():
    roas = {"tv_spend": 2.5, "social_spend": 1.2}
    current = {"tv_spend": 20000, "social_spend": 20000}
    result = optimize_budget(roas, current, 40000)
    for alloc in result["suggested_allocation"].values():
        assert alloc >= 0
