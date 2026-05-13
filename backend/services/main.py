"""
QuantScreen Backend – FastAPI Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from .routers import themes, stocks, market, analysis
from .core.config import settings
from .core.cache import cache
from .core.db import init_db
from .services.scheduler import start_scheduler, shutdown_scheduler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("QuantScreen 백엔드 시작 중...")

    # DB 테이블 자동 생성 (SQLite면 파일도 함께 생성)
    init_db()
    logger.info("DB 초기화 완료")

    await cache.connect()
    start_scheduler()
    yield
    shutdown_scheduler()
    await cache.disconnect()
    logger.info("QuantScreen 백엔드 종료")


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

app.include_router(themes.router, prefix="/api/theme", tags=["Themes"])
app.include_router(stocks.router, prefix="/api/stocks", tags=["Stocks"])
app.include_router(market.router, prefix="/api/market", tags=["Market"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["Analysis"])


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "1.0.0", "db": settings.DATABASE_URL.split("://")[0]}
