"""
QuantScreen Backend – FastAPI Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from .routers import themes, stocks, market
from .core.config import settings
from .core.cache import cache
from .services.scheduler import start_scheduler, shutdown_scheduler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start/stop background scheduler on app lifecycle."""
    logger.info("Starting QuantScreen backend...")
    await cache.connect()
    start_scheduler()
    yield
    shutdown_scheduler()
    await cache.disconnect()
    logger.info("QuantScreen backend stopped.")


app = FastAPI(
    title="QuantScreen API",
    description="리스크 필터링 기반 테마별 미국 주식 분석 API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Router Registration ──────────────────────────────────────────────────────
app.include_router(themes.router, prefix="/api/theme", tags=["Themes"])
app.include_router(stocks.router, prefix="/api/stocks", tags=["Stocks"])
app.include_router(market.router, prefix="/api/market", tags=["Market"])


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}
