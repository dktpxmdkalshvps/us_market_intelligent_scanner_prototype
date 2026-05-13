"""
SQLAlchemy ORM models.
"""
from sqlalchemy import (
    Column, String, Float, Boolean, Integer, DateTime, Text, JSON
)
from sqlalchemy.orm import DeclarativeBase
from datetime import datetime


class Base(DeclarativeBase):
    pass


class StockRecord(Base):
    __tablename__ = "stocks"

    ticker = Column(String(20), primary_key=True)
    name = Column(String(200))
    sector = Column(String(100))
    industry = Column(String(150))
    exchange = Column(String(20))

    # Prices
    price = Column(Float)
    change = Column(Float)
    change_percent = Column(Float)
    market_cap = Column(Float)
    volume = Column(Integer)

    # Quant metrics
    per = Column(Float, nullable=True)
    peg = Column(Float, nullable=True)
    pbr = Column(Float, nullable=True)
    roe = Column(Float, nullable=True)
    revenue_growth = Column(Float, nullable=True)
    operating_margin = Column(Float, nullable=True)
    debt_to_equity = Column(Float, nullable=True)
    dividend_yield = Column(Float, nullable=True)
    eps = Column(Float, nullable=True)

    # Technical
    ma50 = Column(Float, nullable=True)
    ma200 = Column(Float, nullable=True)
    is_above_ma200 = Column(Boolean, default=False)

    # Risk
    is_penny_stock = Column(Boolean, default=False)
    is_bankruptcy_risk = Column(Boolean, default=False)
    is_small_cap = Column(Boolean, default=False)
    risk_score = Column(Integer, default=0)
    passes_base_filter = Column(Boolean, default=True)

    # Theme scores (0-100)
    score_undervalued_growth = Column(Integer, default=0)
    score_growth_momentum = Column(Integer, default=0)
    score_safe_growth = Column(Integer, default=0)
    score_deep_value = Column(Integer, default=0)
    score_high_roe = Column(Integer, default=0)
    score_breakout = Column(Integer, default=0)
    score_bugatti = Column(Integer, default=0)
    score_dividend = Column(Integer, default=0)
    score_dividend_aristocrat = Column(Integer, default=0)

    # Meta
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    raw_info = Column(JSON, nullable=True)  # yfinance .info cache


class ThemeSnapshot(Base):
    """Daily snapshot of theme results for historical analysis."""
    __tablename__ = "theme_snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    theme_key = Column(String(50), index=True)
    snapshot_date = Column(String(10), index=True)  # YYYY-MM-DD
    tickers = Column(JSON)  # list of tickers in this theme
    total_count = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)


class MarketCalendarEventRecord(Base):
    __tablename__ = "market_calendar"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_date = Column(String(10), index=True)
    event_type = Column(String(30))
    title = Column(String(300))
    tickers = Column(JSON, nullable=True)
    importance = Column(String(10))
