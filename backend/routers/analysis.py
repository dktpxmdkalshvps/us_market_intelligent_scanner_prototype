"""
Analysis Router – /api/analysis/{ticker}/technical | /forecast
"""
import logging
from fastapi import APIRouter, HTTPException, Query

from ..core.cache import cache
from ..models.schemas import ApiResponseSchema
from ..services.technical_analysis import fetch_technical_data
from ..services.forecasting import run_forecast

router = APIRouter()
logger = logging.getLogger(__name__)

_TTL_TECHNICAL = 600   # 10분
_TTL_FORECAST = 3600   # 1시간


@router.get("/{ticker}/technical", response_model=ApiResponseSchema)
async def get_technical_analysis(
    ticker: str,
    period: str = Query("6mo", pattern="^(1mo|3mo|6mo|1y|2y)$"),
):
    ticker = ticker.upper()
    cache_key = f"analysis:tech:{ticker}:{period}"

    cached = await cache.get(cache_key)
    if cached:
        return ApiResponseSchema(data=cached, cached=True)

    data = fetch_technical_data(ticker, period)
    if not data:
        raise HTTPException(
            status_code=404,
            detail=f"Could not compute technical analysis for '{ticker}'",
        )

    await cache.set(cache_key, data, ttl=_TTL_TECHNICAL)
    return ApiResponseSchema(data=data, cached=False)


@router.get("/{ticker}/forecast", response_model=ApiResponseSchema)
async def get_forecast(
    ticker: str,
    model: str = Query("both", pattern="^(prophet|arima|both)$"),
    days: int = Query(7, ge=1, le=30),
):
    ticker = ticker.upper()
    cache_key = f"analysis:forecast:{ticker}:{model}:{days}"

    cached = await cache.get(cache_key)
    if cached:
        return ApiResponseSchema(data=cached, cached=True)

    data = run_forecast(ticker, model=model, days=days)
    if not data:
        raise HTTPException(
            status_code=500,
            detail=f"Forecast computation failed for '{ticker}'",
        )

    await cache.set(cache_key, data, ttl=_TTL_FORECAST)
    return ApiResponseSchema(data=data, cached=False)
