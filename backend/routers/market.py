"""
Market Router – /api/market/banner & /api/market/calendar
"""
import logging
from fastapi import APIRouter, Query

from ..core.cache import cache
from ..core.config import settings
from ..services.market_service import fetch_live_market_data, build_earnings_calendar
from ..models.schemas import MarketBannerSchema, CalendarEventSchema, ApiResponseSchema

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/banner", response_model=ApiResponseSchema)
async def get_market_banner():
    """Live market indices + FX rates."""
    cache_key = "market:banner"
    cached = await cache.get(cache_key)
    if cached:
        return ApiResponseSchema(data=cached, cached=True)

    try:
        data = fetch_live_market_data()
        await cache.set(cache_key, data, ttl=settings.CACHE_TTL_MARKET)
        return ApiResponseSchema(data=data, cached=False)
    except Exception as e:
        logger.error(f"Market banner error: {e}")
        return ApiResponseSchema(
            data={"indices": [], "exchangeRates": [], "lastUpdated": ""},
            status="error",
            message=str(e),
            cached=False,
        )


@router.get("/calendar", response_model=ApiResponseSchema)
async def get_market_calendar(
    days: int = Query(7, ge=1, le=30),
):
    """Upcoming earnings and economic events."""
    cache_key = f"market:calendar:{days}"
    cached = await cache.get(cache_key)
    if cached:
        return ApiResponseSchema(data=cached, cached=True)

    try:
        events = build_earnings_calendar(days_ahead=days)
        await cache.set(cache_key, events, ttl=60 * 60)  # 1 hour TTL
        return ApiResponseSchema(data=events, cached=False)
    except Exception as e:
        logger.error(f"Calendar error: {e}")
        return ApiResponseSchema(data=[], status="error", message=str(e), cached=False)
