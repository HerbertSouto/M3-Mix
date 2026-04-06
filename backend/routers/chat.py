import logging
import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from models.schemas import ChatRequest
from services import ai as ai_service
from services.supabase_client import check_and_increment_chat_limit

router = APIRouter()
logger = logging.getLogger(__name__)

CHAT_LIMIT = int(os.environ.get("CHAT_LIMIT_PER_SESSION", "30"))


@router.post("")
async def chat(req: ChatRequest):
    if req.session_id:
        allowed = check_and_increment_chat_limit(req.session_id, CHAT_LIMIT)
        if not allowed:
            raise HTTPException(
                status_code=429,
                detail=f"Limite de {CHAT_LIMIT} mensagens por sessão atingido.",
            )

    async def generate():
        try:
            logger.info("Chat request session=%s: %r", req.session_id, req.message[:80])
            chunks = 0
            for chunk in ai_service.stream_chat(req.message, req.analysis_context):
                chunks += 1
                yield f"data: {chunk}\n\n"
            logger.info("Chat complete: %d chunks", chunks)
            yield "data: [DONE]\n\n"
        except Exception as e:
            logger.exception("Chat error: %s", e)
            yield "data: [ERROR] Ocorreu um erro interno\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
