"""
로컬 개발용 설정 – SQLite 기본값 사용 (PostgreSQL 설치 불필요)
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # ── Database ──────────────────────────────────────────────────────────────
    # 로컬 기본값: SQLite (파일 자동 생성, 별도 설치 불필요)
    # 프로덕션 배포 시 PostgreSQL URL로 교체:
    #   DATABASE_URL=postgresql://user:pass@host:5432/quantscreen
    DATABASE_URL: str = "sqlite:///./quantscreen.db"

    # ── Redis (선택) ──────────────────────────────────────────────────────────
    # 비어 있으면 자동으로 인메모리 캐시 사용
    REDIS_URL: str = ""

    # ── CORS ─────────────────────────────────────────────────────────────────
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # ── Cache TTL (seconds) ──────────────────────────────────────────────────
    CACHE_TTL_THEME: int = 300     # 5분 – 테마 종목 리스트
    CACHE_TTL_MARKET: int = 60     # 1분 – 실시간 지수/환율
    CACHE_TTL_STOCK: int = 900     # 15분 – 종목 상세

    # ── Scheduler (America/New_York) ─────────────────────────────────────────
    SCHEDULER_HOUR: int = 17
    SCHEDULER_MINUTE: int = 30
    SCHEDULER_TIMEZONE: str = "America/New_York"

    # ── Risk Filter 기본값 ────────────────────────────────────────────────────
    RISK_MIN_PRICE: float = 1.0
    RISK_MIN_MARKET_CAP: float = 50_000_000
    RISK_EXCLUDE_SUFFIXES: List[str] = [".Q", ".E", ".PK", ".OB"]

    # ── 데이터 수집 범위 (0 = 전체, 양수 = 상위 N개) ──────────────────────────
    UNIVERSE_LIMIT: int = 200

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
