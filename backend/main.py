import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

# Must be set before pytensor is imported (happens via routers → mmm.py)
# Disables C compilation to avoid "Access Denied" DLL errors on Windows/OneDrive
os.environ.setdefault("PYTENSOR_FLAGS", "cxx=")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

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
