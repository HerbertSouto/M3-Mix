import io
import pandas as pd
from fastapi import APIRouter, BackgroundTasks
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

        # 3. Budget optimizer with annualized current allocation
        current_allocation = {ch: float(df[ch].sum()) for ch in channels}
        total_budget = sum(current_allocation.values())
        opt = optimizer_service.optimize_budget(results["roas"], current_allocation, total_budget)
        results["budget_recommendation"] = opt

        # 4. AI narrative
        results["ai_narrative"] = ai_service.generate_narrative(results)

        # 5. Save to Supabase
        save_analysis_results(analysis_id, results)
        update_analysis_status(analysis_id, "completed")

    except Exception as e:
        update_analysis_status(analysis_id, "failed")
        raise e


@router.post("", response_model=StatusResponse)
async def start_analysis(req: AnalyzeRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(_run_analysis, req.analysis_id, req.csv_url, req.channels)
    return StatusResponse(analysis_id=req.analysis_id, status="processing")
