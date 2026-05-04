"""
데이터베이스 엔진 및 세션 설정
SQLite (로컬) / PostgreSQL (프로덕션) 자동 감지
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

from .config import settings
from ..models.stock import Base


def _make_engine():
    url = settings.DATABASE_URL
    kwargs = {}
    if url.startswith("sqlite"):
        # SQLite는 멀티스레드 접근 허용 필요
        kwargs["connect_args"] = {"check_same_thread": False}
    return create_engine(url, **kwargs)


engine = _make_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """테이블 자동 생성 (존재하면 건너뜀)"""
    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI 의존성 주입용 세션 제공자"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
