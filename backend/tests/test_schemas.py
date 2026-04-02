from models.schemas import AnalyzeRequest, AnalyzeResponse, OptimizeRequest, OptimizeResponse


def test_analyze_request_requires_analysis_id():
    req = AnalyzeRequest(analysis_id="abc123", csv_url="https://example.com/file.csv", channels=["tv_spend"])
    assert req.analysis_id == "abc123"


def test_optimize_request_validates_budget():
    req = OptimizeRequest(
        analysis_id="abc123",
        total_budget=100_000,
        current_allocation={"tv_spend": 60000, "social_spend": 40000},
        roas={"tv_spend": 2.5, "social_spend": 1.2},
    )
    assert req.total_budget == 100_000
