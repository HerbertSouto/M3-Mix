import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv(dotenv_path=__file__.replace("main.py", "") + "../.env")

# Must be set before pytensor is imported (happens via routers → mmm.py)
# .env takes precedence (base_compiledir); this is the safe fallback for envs without .env
os.environ.setdefault("PYTENSOR_FLAGS", "base_compiledir=C:/Users/herbe/AppData/Local/pytensor_cache")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

from fastapi import Request
from fastapi.responses import JSONResponse
from routers import analyze, optimize, chat

INTERNAL_SECRET = os.environ.get("INTERNAL_API_SECRET", "")

app = FastAPI(title="M3-Mix API", version="0.1.0")

_raw_origins = os.environ.get("ALLOWED_ORIGINS", "")
if not _raw_origins:
    logging.warning(
        "ALLOWED_ORIGINS not set — CORS restricted to localhost:3000. "
        "Set ALLOWED_ORIGINS=https://your-app.vercel.app in production."
    )
_allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()] or ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type", "X-Internal-Token"],
)


@app.middleware("http")
async def verify_internal_secret(request: Request, call_next):
    if request.url.path == "/health":
        return await call_next(request)
    if INTERNAL_SECRET and request.headers.get("X-Internal-Token") != INTERNAL_SECRET:
        return JSONResponse({"detail": "Forbidden"}, status_code=403)
    return await call_next(request)

app.include_router(analyze.router, prefix="/analyze", tags=["analyze"])
app.include_router(optimize.router, prefix="/optimize", tags=["optimize"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])


@app.get("/health")
def health():
    return {"status": "ok"}
