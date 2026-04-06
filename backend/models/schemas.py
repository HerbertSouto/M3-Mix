from pydantic import BaseModel
from typing import Any


class AnalyzeRequest(BaseModel):
    analysis_id: str
    csv_url: str
    channels: list[str]


class ChannelResult(BaseModel):
    roas: float
    contribution_share: float
    adstock_alpha: float
    saturation_curve: list[dict[str, float]]  # [{"x": spend, "y": revenue}, ...]


class DecompositionPoint(BaseModel):
    date: str
    channel: str
    value: float


class AnalyzeResponse(BaseModel):
    analysis_id: str
    roas: dict[str, float]
    contributions: dict[str, float]
    saturation: dict[str, list[dict[str, float]]]
    adstock: dict[str, float]
    decomposition: list[DecompositionPoint]
    budget_recommendation: dict[str, Any]
    ai_narrative: str


class OptimizeRequest(BaseModel):
    analysis_id: str
    total_budget: float
    current_allocation: dict[str, float]
    roas: dict[str, float]


class OptimizeResponse(BaseModel):
    analysis_id: str
    current_allocation: dict[str, float]
    suggested_allocation: dict[str, float]
    current_revenue_estimate: float
    suggested_revenue_estimate: float
    uplift_percent: float


class ChatRequest(BaseModel):
    analysis_id: str
    message: str
    analysis_context: dict[str, Any]
    session_id: str | None = None


class StatusResponse(BaseModel):
    analysis_id: str
    status: str  # 'processing' | 'completed' | 'failed'
