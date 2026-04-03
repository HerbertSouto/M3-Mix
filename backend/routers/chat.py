import logging
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from models.schemas import ChatRequest
from services import ai as ai_service

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("")
async def chat(req: ChatRequest):
    async def generate():
        try:
            logger.info("Chat request: %r", req.message[:80])
            chunks = 0
            for chunk in ai_service.stream_chat(req.message, req.analysis_context):
                chunks += 1
                yield f"data: {chunk}\n\n"
            logger.info("Chat complete: %d chunks", chunks)
            yield "data: [DONE]\n\n"
        except Exception as e:
            logger.exception("Chat error: %s", e)
            yield f"data: [ERROR] {e}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
