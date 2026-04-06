import io
import logging
import pandas as pd
from fastapi import APIRouter, BackgroundTasks
from models.schemas import AnalyzeRequest, StatusResponse
from services import mmm as mmm_service
from services import optimizer as optimizer_service
from services import ai as ai_service
from services.supabase_client import update_analysis_status, save_analysis_results, download_csv

logger = logging.getLogger(__name__)
router = APIRouter()


def _run_analysis(analysis_id: str, csv_url: str, channels: list[str]):
    logger.info("[%s] analysis started", analysis_id)
    try:
        # 1. Download file (CSV or XLSX)
        logger.info("[%s] downloading file: %s", analysis_id, csv_url)
        update_analysis_status(analysis_id, "processing", step="downloading")
        file_bytes = download_csv(csv_url)
        df = pd.read_csv(io.BytesIO(file_bytes), parse_dates=["date"])
        df = df.dropna(subset=["date"]).drop_duplicates(subset=["date"]).reset_index(drop=True)
        logger.info("[%s] file loaded — shape=%s  columns=%s", analysis_id, df.shape, list(df.columns))

        # Auto-detect control columns (not date, revenue, or _spend)
        control_columns = [
            c for c in df.columns
            if c not in ("date", "revenue") and not c.endswith("_spend")
        ]
        logger.info("[%s] control columns: %s", analysis_id, control_columns)

        # 2. Fit MMM
        logger.info("[%s] fitting MMM", analysis_id)
        update_analysis_status(analysis_id, "processing", step="fitting")
        model = mmm_service.fit_mmm(df, channels, control_columns=control_columns)

        # 3. Extract results
        logger.info("[%s] extracting results", analysis_id)
        update_analysis_status(analysis_id, "processing", step="extracting")
        results = mmm_service.extract_results(model, df, channels, control_columns=control_columns)

        # 4. Budget optimizer
        logger.info("[%s] optimizing budget", analysis_id)
        update_analysis_status(analysis_id, "processing", step="optimizing")
        current_allocation = {ch: float(df[ch].sum()) for ch in channels}
        total_budget = sum(current_allocation.values())
        opt = optimizer_service.optimize_budget(results["roas"], current_allocation, total_budget)
        results["budget_recommendation"] = opt

        # 5. AI narrative
        logger.info("[%s] generating narrative", analysis_id)
        update_analysis_status(analysis_id, "processing", step="narrative")
        results["ai_narrative"] = ai_service.generate_narrative(results)

        # 6. Save to Supabase
        logger.info("[%s] saving results", analysis_id)
        update_analysis_status(analysis_id, "processing", step="saving")
        save_analysis_results(analysis_id, results)
        update_analysis_status(analysis_id, "completed", step="done")
        logger.info("[%s] completed", analysis_id)

    except Exception as e:
        logger.exception("[%s] FAILED: %s", analysis_id, e)
        try:
            update_analysis_status(analysis_id, "failed", step="error")
        except Exception:
            logger.exception("[%s] could not update status to failed", analysis_id)
        raise


@router.post("", response_model=StatusResponse)
async def start_analysis(req: AnalyzeRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(_run_analysis, req.analysis_id, req.csv_url, req.channels)
    return StatusResponse(analysis_id=req.analysis_id, status="processing")
