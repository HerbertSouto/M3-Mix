from fastapi import APIRouter
from models.schemas import OptimizeRequest, OptimizeResponse
from services import optimizer as optimizer_service

router = APIRouter()


@router.post("", response_model=OptimizeResponse)
async def run_optimizer(req: OptimizeRequest):
    result = optimizer_service.optimize_budget(
        req.roas,
        req.current_allocation,
        req.total_budget,
    )
    return OptimizeResponse(analysis_id=req.analysis_id, **result)
