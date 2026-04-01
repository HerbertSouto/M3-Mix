# M3-Mix Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a FastAPI backend that receives CSV data, runs Bayesian MMM via PyMC-Marketing, optimizes budget allocation via scipy, and streams AI insights via Claude API.

**Architecture:** FastAPI app with three routers (`/analyze`, `/optimize`, `/chat`). Long-running model fitting runs as a BackgroundTask that updates Supabase on completion. All results stored as JSONB in Supabase; CSV files stored in Supabase Storage.

**Tech Stack:** Python 3.11+, uv, FastAPI, PyMC-Marketing, scipy, Anthropic SDK, Supabase Python client, pytest

---

## File Structure

```
backend/
  pyproject.toml              # uv project + dependencies
  main.py                     # FastAPI app, CORS, router registration
  routers/
    analyze.py                # POST /analyze — triggers background MMM job
    optimize.py               # POST /optimize — budget optimizer
    chat.py                   # POST /chat — streaming Claude response
  services/
    mmm.py                    # PyMC-Marketing model fitting + result extraction
    optimizer.py              # scipy budget allocation optimizer
    ai.py                     # Claude API — narrative generation + chat
    supabase_client.py        # Supabase client singleton
  models/
    schemas.py                # Pydantic request/response models
  tests/
    conftest.py               # fixtures: sample DataFrame, mock results
    test_mmm.py               # unit tests for MMM service
    test_optimizer.py         # unit tests for optimizer
    test_api.py               # integration tests for endpoints
```

---

## Task 1: Scaffold backend with uv

**Files:**
- Create: `backend/pyproject.toml`
- Create: `backend/main.py`

- [ ] **Step 1: Initialize uv project**

```bash
cd C:/Users/herbe/OneDrive/Documentos/Workspace/M3
mkdir backend && cd backend
uv init --no-workspace
```

- [ ] **Step 2: Replace pyproject.toml with project dependencies**

```toml
[project]
name = "m3-mix-backend"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.30.0",
    "pymc-marketing>=0.9.0",
    "scipy>=1.13.0",
    "pandas>=2.2.0",
    "numpy>=1.26.0",
    "anthropic>=0.34.0",
    "python-multipart>=0.0.9",
    "supabase>=2.7.0",
    "httpx>=0.27.0",
    "pydantic>=2.7.0",
    "python-dotenv>=1.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.23.0",
    "httpx>=0.27.0",
]

[tool.pytest.ini_options]
asyncio_mode = "auto"
```

- [ ] **Step 3: Install dependencies**

```bash
uv sync --extra dev
```

- [ ] **Step 4: Create main.py**

```python
# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routers import analyze, optimize, chat

app = FastAPI(title="M3-Mix API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router, prefix="/analyze", tags=["analyze"])
app.include_router(optimize.router, prefix="/optimize", tags=["optimize"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])


@app.get("/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 5: Verify server starts**

```bash
uv run uvicorn main:app --reload
# Expected: Uvicorn running on http://127.0.0.1:8000
# GET http://127.0.0.1:8000/health → {"status": "ok"}
```

- [ ] **Step 6: Create folder structure**

```bash
mkdir -p routers services models tests
touch routers/__init__.py services/__init__.py models/__init__.py
touch routers/analyze.py routers/optimize.py routers/chat.py
touch services/mmm.py services/optimizer.py services/ai.py services/supabase_client.py
touch models/schemas.py tests/conftest.py tests/test_mmm.py tests/test_optimizer.py tests/test_api.py
```

- [ ] **Step 7: Commit**

```bash
git add backend/
git commit -m "feat: scaffold FastAPI backend with uv"
```

---

## Task 2: Pydantic schemas

**Files:**
- Modify: `backend/models/schemas.py`

- [ ] **Step 1: Write the failing test**

```python
# backend/tests/test_schemas.py
from models.schemas import AnalyzeRequest, AnalyzeResponse, OptimizeRequest, OptimizeResponse

def test_analyze_request_requires_analysis_id():
    req = AnalyzeRequest(analysis_id="abc123", csv_url="https://example.com/file.csv", channels=["tv_spend"])
    assert req.analysis_id == "abc123"

def test_optimize_request_validates_budget():
    req = OptimizeRequest(
        analysis_id="abc123",
        total_budget=100_000,
        current_allocation={"tv_spend": 60000, "social_spend": 40000},
    )
    assert req.total_budget == 100_000
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && uv run pytest tests/test_schemas.py -v
# Expected: FAIL — ImportError: cannot import name 'AnalyzeRequest'
```

- [ ] **Step 3: Write schemas**

```python
# backend/models/schemas.py
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


class StatusResponse(BaseModel):
    analysis_id: str
    status: str  # 'processing' | 'completed' | 'failed'
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
uv run pytest tests/test_schemas.py -v
# Expected: PASS
```

- [ ] **Step 5: Commit**

```bash
git add models/schemas.py tests/test_schemas.py
git commit -m "feat: add Pydantic schemas for all endpoints"
```

---

## Task 3: Supabase client

**Files:**
- Modify: `backend/services/supabase_client.py`

- [ ] **Step 1: Write client singleton**

```python
# backend/services/supabase_client.py
import os
from supabase import create_client, Client

_client: Client | None = None


def get_supabase() -> Client:
    global _client
    if _client is None:
        url = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
        key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
        _client = create_client(url, key)
    return _client


def update_analysis_status(analysis_id: str, status: str) -> None:
    get_supabase().table("analyses").update({"status": status}).eq("id", analysis_id).execute()


def save_analysis_results(analysis_id: str, results: dict) -> None:
    get_supabase().table("analysis_results").insert({
        "analysis_id": analysis_id,
        **results,
    }).execute()


def download_csv(csv_url: str) -> bytes:
    """Download CSV from Supabase Storage given full URL."""
    # Extract bucket and path from URL
    # URL format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
    parts = csv_url.split("/storage/v1/object/public/")
    bucket_and_path = parts[1]
    bucket, *path_parts = bucket_and_path.split("/")
    path = "/".join(path_parts)
    response = get_supabase().storage.from_(bucket).download(path)
    return response
```

- [ ] **Step 2: Commit**

```bash
git add services/supabase_client.py
git commit -m "feat: add Supabase client with status/result helpers"
```

---

## Task 4: MMM service

**Files:**
- Modify: `backend/services/mmm.py`
- Modify: `backend/tests/conftest.py`
- Modify: `backend/tests/test_mmm.py`

- [ ] **Step 1: Write test fixtures in conftest.py**

```python
# backend/tests/conftest.py
import pandas as pd
import numpy as np
import pytest


@pytest.fixture
def sample_df():
    """48 weeks of synthetic MMM data."""
    np.random.seed(42)
    n = 48
    dates = pd.date_range("2023-01-02", periods=n, freq="W-MON")
    tv = np.random.uniform(5000, 25000, n)
    social = np.random.uniform(2000, 10000, n)
    search = np.random.uniform(3000, 15000, n)
    baseline = 80_000
    revenue = (
        baseline
        + tv * 2.5
        + social * 1.2
        + search * 1.8
        + np.random.normal(0, 5000, n)
    )
    return pd.DataFrame({
        "date": dates,
        "revenue": revenue,
        "tv_spend": tv,
        "social_spend": social,
        "search_spend": search,
    })


@pytest.fixture
def channel_columns():
    return ["tv_spend", "social_spend", "search_spend"]
```

- [ ] **Step 2: Write failing tests for MMM service**

```python
# backend/tests/test_mmm.py
import pytest
from services.mmm import fit_mmm, extract_results


def test_fit_mmm_returns_fitted_model(sample_df, channel_columns):
    model = fit_mmm(sample_df, channel_columns, draws=100, tune=100)
    assert model is not None


def test_extract_results_has_all_channels(sample_df, channel_columns):
    model = fit_mmm(sample_df, channel_columns, draws=100, tune=100)
    results = extract_results(model, sample_df, channel_columns)
    for ch in channel_columns:
        assert ch in results["roas"]
        assert ch in results["contributions"]
        assert ch in results["adstock"]
        assert ch in results["saturation"]


def test_roas_values_are_positive(sample_df, channel_columns):
    model = fit_mmm(sample_df, channel_columns, draws=100, tune=100)
    results = extract_results(model, sample_df, channel_columns)
    for ch in channel_columns:
        assert results["roas"][ch] > 0


def test_contributions_sum_to_one(sample_df, channel_columns):
    model = fit_mmm(sample_df, channel_columns, draws=100, tune=100)
    results = extract_results(model, sample_df, channel_columns)
    total = sum(results["contributions"].values())
    assert abs(total - 1.0) < 0.01


def test_decomposition_has_date_entries(sample_df, channel_columns):
    model = fit_mmm(sample_df, channel_columns, draws=100, tune=100)
    results = extract_results(model, sample_df, channel_columns)
    assert len(results["decomposition"]) > 0
    first = results["decomposition"][0]
    assert "date" in first and "channel" in first and "value" in first
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
uv run pytest tests/test_mmm.py -v
# Expected: FAIL — ImportError: cannot import name 'fit_mmm'
```

- [ ] **Step 4: Implement MMM service**

```python
# backend/services/mmm.py
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
    idata = mmm.idata
    posterior = idata.posterior

    # ROAS: mean revenue per unit spend per channel
    roas = {}
    for ch in channel_columns:
        total_spend = df[ch].sum()
        # contribution mean across samples
        ch_contrib = mmm.get_channel_contributions().mean(("chain", "draw"))[ch].values
        total_contribution = ch_contrib.sum()
        roas[ch] = float(total_contribution / total_spend) if total_spend > 0 else 0.0

    # Contribution shares
    contributions_abs = {
        ch: float(mmm.get_channel_contributions().mean(("chain", "draw"))[ch].values.sum())
        for ch in channel_columns
    }
    total_revenue = df["revenue"].sum()
    # Include baseline
    channels_total = sum(contributions_abs.values())
    baseline_contrib = total_revenue - channels_total
    contributions = {ch: v / total_revenue for ch, v in contributions_abs.items()}
    contributions["baseline"] = float(baseline_contrib / total_revenue)

    # Adstock alpha (geometric decay rate) — mean of posterior
    adstock = {}
    for ch in channel_columns:
        alpha_samples = posterior["adstock_alpha"].sel(channel=ch).values.flatten()
        adstock[ch] = float(alpha_samples.mean())

    # Saturation curves — evaluate lam/lam saturation over spend range
    saturation = {}
    for ch in channel_columns:
        spend_range = np.linspace(0, df[ch].max() * 1.5, 50)
        lam_samples = posterior["saturation_lam"].sel(channel=ch).values.flatten()
        lam_mean = lam_samples.mean()
        # LogisticSaturation: L / (1 + exp(-k*(x - x0))) simplified to 1 - exp(-lam*x)
        curve = [
            {"x": float(x), "y": float(1 - np.exp(-lam_mean * x))}
            for x in spend_range
        ]
        saturation[ch] = curve

    # Temporal decomposition
    contributions_ts = mmm.get_channel_contributions().mean(("chain", "draw"))
    decomposition = []
    for ch in channel_columns:
        for i, date in enumerate(df["date"]):
            decomposition.append({
                "date": str(date.date()),
                "channel": ch,
                "value": float(contributions_ts[ch].values[i]),
            })
    # Add baseline
    ch_total_per_date = sum(
        contributions_ts[ch].values for ch in channel_columns
    )
    for i, date in enumerate(df["date"]):
        decomposition.append({
            "date": str(date.date()),
            "channel": "baseline",
            "value": float(df["revenue"].iloc[i] - ch_total_per_date[i]),
        })

    return {
        "roas": roas,
        "contributions": contributions,
        "adstock": adstock,
        "saturation": saturation,
        "decomposition": decomposition,
    }
```

- [ ] **Step 5: Run tests**

```bash
uv run pytest tests/test_mmm.py -v --timeout=300
# Expected: PASS (model fitting takes ~1-2min with draws=100, tune=100)
```

- [ ] **Step 6: Commit**

```bash
git add services/mmm.py tests/conftest.py tests/test_mmm.py
git commit -m "feat: MMM service with PyMC-Marketing fit and result extraction"
```

---

## Task 5: Budget optimizer service

**Files:**
- Modify: `backend/services/optimizer.py`
- Modify: `backend/tests/test_optimizer.py`

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/test_optimizer.py
from services.optimizer import optimize_budget


def test_optimize_budget_respects_total_budget():
    roas = {"tv_spend": 2.5, "social_spend": 1.2, "search_spend": 1.8}
    current = {"tv_spend": 20000, "social_spend": 8000, "search_spend": 12000}
    total_budget = 40000
    result = optimize_budget(roas, current, total_budget)
    allocated = sum(result["suggested_allocation"].values())
    assert abs(allocated - total_budget) < 1.0


def test_optimize_budget_increases_high_roas_channel():
    roas = {"tv_spend": 3.0, "social_spend": 0.5, "search_spend": 1.0}
    current = {"tv_spend": 10000, "social_spend": 15000, "search_spend": 15000}
    total_budget = 40000
    result = optimize_budget(roas, current, total_budget)
    # High ROAS channel should get more budget
    assert result["suggested_allocation"]["tv_spend"] > current["tv_spend"]


def test_optimize_budget_returns_uplift():
    roas = {"tv_spend": 2.5, "social_spend": 1.2, "search_spend": 1.8}
    current = {"tv_spend": 20000, "social_spend": 8000, "search_spend": 12000}
    result = optimize_budget(roas, current, 40000)
    assert "uplift_percent" in result
    assert isinstance(result["uplift_percent"], float)


def test_optimize_budget_no_channel_gets_zero():
    roas = {"tv_spend": 2.5, "social_spend": 1.2}
    current = {"tv_spend": 20000, "social_spend": 20000}
    result = optimize_budget(roas, current, 40000)
    for ch, alloc in result["suggested_allocation"].items():
        assert alloc >= 0
```

- [ ] **Step 2: Run to verify failure**

```bash
uv run pytest tests/test_optimizer.py -v
# Expected: FAIL — ImportError
```

- [ ] **Step 3: Implement optimizer**

```python
# backend/services/optimizer.py
import numpy as np
from scipy.optimize import minimize


def _revenue_estimate(allocation: np.ndarray, roas: list[float]) -> float:
    """Simple linear revenue model: sum(spend * roas) per channel."""
    return -float(np.dot(allocation, roas))  # negative for minimization


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
    # Normalize x0 to match total_budget
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
```

- [ ] **Step 4: Run tests**

```bash
uv run pytest tests/test_optimizer.py -v
# Expected: PASS
```

- [ ] **Step 5: Commit**

```bash
git add services/optimizer.py tests/test_optimizer.py
git commit -m "feat: budget optimizer using scipy SLSQP"
```

---

## Task 6: AI service (Claude)

**Files:**
- Modify: `backend/services/ai.py`

- [ ] **Step 1: Implement AI service**

```python
# backend/services/ai.py
import os
from typing import Iterator
import anthropic

_client: anthropic.Anthropic | None = None


def get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    return _client


def generate_narrative(analysis_results: dict) -> str:
    """Generate a one-shot narrative analysis of MMM results."""
    roas = analysis_results["roas"]
    contributions = analysis_results["contributions"]

    top_channel = max(roas, key=lambda ch: roas[ch])
    low_roas_channels = [ch for ch, v in roas.items() if v < 1.0]

    prompt = f"""Você é um analista de marketing especialista em Marketing Mix Modeling.
Analise os resultados abaixo e produza um relatório executivo em português do Brasil.

## Resultados do Modelo MMM

**ROAS por canal:**
{chr(10).join(f"- {ch}: {v:.2f}" for ch, v in roas.items())}

**Contribuição de cada canal para a receita total:**
{chr(10).join(f"- {ch}: {v*100:.1f}%" for ch, v in contributions.items())}

## Instruções para o relatório

Escreva em 3 seções:
1. **Resumo executivo** (2-3 frases): qual canal performa melhor, qual é a situação geral
2. **Pontos de atenção**: canais com ROAS abaixo de 1.0 (prejuízo), canais próximos da saturação
3. **Recomendações**: 2-3 ações concretas baseadas nos dados

Seja direto e use linguagem de negócios. Não explique o que é MMM."""

    message = get_client().messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text


def stream_chat(message: str, analysis_context: dict) -> Iterator[str]:
    """Stream a chat response with analysis context."""
    system = f"""Você é um assistente especialista em Marketing Mix Modeling.
Você tem acesso aos resultados de uma análise MMM específica.

Resultados da análise:
- ROAS por canal: {analysis_context.get('roas', {})}
- Contribuições: {analysis_context.get('contributions', {})}
- Recomendação de budget: {analysis_context.get('budget_recommendation', {})}

Responda em português do Brasil. Seja conciso e direto. Use os dados acima para fundamentar suas respostas."""

    with get_client().messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=system,
        messages=[{"role": "user", "content": message}],
    ) as stream:
        for text in stream.text_stream:
            yield text
```

- [ ] **Step 2: Commit**

```bash
git add services/ai.py
git commit -m "feat: AI service with narrative generation and streaming chat"
```

---

## Task 7: FastAPI routers

**Files:**
- Modify: `backend/routers/analyze.py`
- Modify: `backend/routers/optimize.py`
- Modify: `backend/routers/chat.py`

- [ ] **Step 1: Implement /analyze router**

```python
# backend/routers/analyze.py
import io
import os
import pandas as pd
from fastapi import APIRouter, BackgroundTasks, HTTPException
from models.schemas import AnalyzeRequest, StatusResponse
from services import mmm as mmm_service
from services import optimizer as optimizer_service
from services import ai as ai_service
from services.supabase_client import update_analysis_status, save_analysis_results, download_csv

router = APIRouter()


def _run_analysis(analysis_id: str, csv_url: str, channels: list[str]):
    try:
        # 1. Download CSV
        csv_bytes = download_csv(csv_url)
        df = pd.read_csv(io.BytesIO(csv_bytes), parse_dates=["date"])

        # 2. Fit MMM
        model = mmm_service.fit_mmm(df, channels)
        results = mmm_service.extract_results(model, df, channels)

        # 3. Budget optimizer with current allocation
        current_allocation = {ch: float(df[ch].mean() * len(df)) for ch in channels}
        total_budget = sum(current_allocation.values())
        opt = optimizer_service.optimize_budget(results["roas"], current_allocation, total_budget)
        results["budget_recommendation"] = opt

        # 4. AI narrative
        results["ai_narrative"] = ai_service.generate_narrative(results)

        # 5. Save results
        save_analysis_results(analysis_id, results)
        update_analysis_status(analysis_id, "completed")

    except Exception as e:
        update_analysis_status(analysis_id, "failed")
        raise e


@router.post("", response_model=StatusResponse)
async def start_analysis(req: AnalyzeRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(_run_analysis, req.analysis_id, req.csv_url, req.channels)
    return StatusResponse(analysis_id=req.analysis_id, status="processing")
```

- [ ] **Step 2: Implement /optimize router**

```python
# backend/routers/optimize.py
from fastapi import APIRouter
from models.schemas import OptimizeRequest, OptimizeResponse
from services import optimizer as optimizer_service

router = APIRouter()


@router.post("", response_model=OptimizeResponse)
async def run_optimizer(req: OptimizeRequest):
    # Reconstruct ROAS from stored results (passed in request context)
    # For simplicity, require roas in the request body — frontend fetches from Supabase
    result = optimizer_service.optimize_budget(
        req.roas,  # added to OptimizeRequest below
        req.current_allocation,
        req.total_budget,
    )
    return OptimizeResponse(analysis_id=req.analysis_id, **result)
```

> **Note:** Update `OptimizeRequest` in `schemas.py` to include `roas: dict[str, float]`.

- [ ] **Step 3: Update OptimizeRequest schema**

```python
# In backend/models/schemas.py — update OptimizeRequest:
class OptimizeRequest(BaseModel):
    analysis_id: str
    total_budget: float
    current_allocation: dict[str, float]
    roas: dict[str, float]
```

- [ ] **Step 4: Implement /chat router**

```python
# backend/routers/chat.py
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from models.schemas import ChatRequest
from services import ai as ai_service

router = APIRouter()


@router.post("")
async def chat(req: ChatRequest):
    def generate():
        for chunk in ai_service.stream_chat(req.message, req.analysis_context):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
```

- [ ] **Step 5: Write integration tests**

```python
# backend/tests/test_api.py
import pytest
from httpx import AsyncClient, ASGITransport
from main import app
from unittest.mock import patch, MagicMock


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
```

- [ ] **Step 6: Run all tests**

```bash
uv run pytest tests/test_api.py tests/test_optimizer.py tests/test_schemas.py -v
# Expected: all PASS
```

- [ ] **Step 7: Commit**

```bash
git add routers/ models/schemas.py tests/test_api.py
git commit -m "feat: FastAPI routers for analyze, optimize, and chat"
```

---

## Task 8: Railway deploy config

**Files:**
- Create: `backend/Dockerfile`
- Create: `backend/railway.toml`

- [ ] **Step 1: Create Dockerfile**

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

COPY pyproject.toml uv.lock* ./
RUN uv sync --no-dev --frozen

COPY . .

EXPOSE 8000
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 2: Create railway.toml**

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "uv run uvicorn main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
healthcheckTimeout = 300
```

- [ ] **Step 3: Commit**

```bash
git add backend/Dockerfile backend/railway.toml
git commit -m "chore: add Railway deploy config for FastAPI backend"
```
