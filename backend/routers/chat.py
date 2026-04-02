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
