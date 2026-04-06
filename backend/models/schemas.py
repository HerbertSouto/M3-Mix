from pydantic import BaseModel, field_validator
from typing import Any
import uuid


def _validate_uuid(v: str) -> str:
    try:
        uuid.UUID(v)
    except ValueError:
        raise ValueError("must be a valid UUID")
    return v


class AnalyzeRequest(BaseModel):
    analysis_id: str
    csv_url: str
    channels: list[str]

    @field_validator("analysis_id")
    @classmethod
    def validate_analysis_id(cls, v: str) -> str:
        return _validate_uuid(v)


class ChannelResult(BaseModel):
    roas: float
    contribution_share: float
    adstock_alpha: float
    saturation_curve: list[dict[str, float]]


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

    @field_validator("analysis_id")
    @classmethod
    def validate_analysis_id(cls, v: str) -> str:
        return _validate_uuid(v)


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

    @field_validator("analysis_id")
    @classmethod
    def validate_analysis_id(cls, v: str) -> str:
        return _validate_uuid(v)

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("message cannot be empty")
        if len(v) > 2000:
            raise ValueError("message too long (max 2000 chars)")
        return v

    @field_validator("session_id")
    @classmethod
    def validate_session_id(cls, v: str | None) -> str | None:
        if v is None:
            return v
        try:
            uuid.UUID(v, version=4)
        except ValueError:
            raise ValueError("session_id must be a valid UUID v4")
        return v


class StatusResponse(BaseModel):
    analysis_id: str
    status: str  # 'processing' | 'completed' | 'failed'
