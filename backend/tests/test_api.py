import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch
from main import app


@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_optimize_endpoint():
    payload = {
        "analysis_id": "test-123",
        "total_budget": 40000,
        "current_allocation": {"tv_spend": 20000, "social_spend": 20000},
        "roas": {"tv_spend": 2.5, "social_spend": 1.0},
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/optimize", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "suggested_allocation" in data
    assert "uplift_percent" in data


@pytest.mark.asyncio
async def test_analyze_returns_processing_status():
    with patch("routers.analyze._run_analysis") as mock_run:
        mock_run.return_value = None
        payload = {
            "analysis_id": "test-456",
            "csv_url": "https://example.com/file.csv",
            "channels": ["tv_spend"],
        }
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/analyze", json=payload)
    assert response.status_code == 200
    assert response.json()["status"] == "processing"
