"""
Themes Router – /api/theme/{theme_key}
"""
import logging
import math
from datetime import datetime

from fastapi import APIRouter, HTTPException, BackgroundTasks

from ..core.cache import cache
from ..core.config import settings
from ..services.fetcher import get_full_universe, bulk_fetch_universe
from ..services.filters import filter_universe
from ..services.theme_engines import run_theme, THEME_ENGINES
from ..models.schemas import StockSchema, ThemeResponseSchema, ApiResponseSchema

router = APIRouter()
logger = logging.getLogger(__name__)

VALID_THEMES = set(THEME_ENGINES.keys())


def _nan_to_none(val):
    if val is None:
        return None
    try:
        if math.isnan(val) or math.isinf(val):
            return None
    except (TypeError, ValueError):
        pass
    return val


def _map_to_stock_schema(d: dict) -> StockSchema:
    return StockSchema(
        ticker=d.get("ticker", ""),
        name=d.get("name", ""),
        sector=d.get("sector", "") or "",
        industry=d.get("industry", "") or "",
        price=float(d.get("price", 0) or 0),
        change=float(d.get("change", 0) or 0),
        changePercent=float(d.get("change_percent", 0) or 0),
        marketCap=float(d.get("market_cap", 0) or 0),
        volume=int(d.get("volume", 0) or 0),
        per=_nan_to_none(d.get("per")),
        peg=_nan_to_none(d.get("peg")),
        pbr=_nan_to_none(d.get("pbr")),
        roe=_nan_to_none(d.get("roe")),
        revenueGrowth=_nan_to_none(d.get("revenue_growth")),
        operatingMargin=_nan_to_none(d.get("operating_margin")),
        debtToEquity=_nan_to_none(d.get("debt_to_equity")),
        dividendYield=_nan_to_none(d.get("dividend_yield")),
        eps=_nan_to_none(d.get("eps")),
        ma50=_nan_to_none(d.get("ma50")),
        ma200=_nan_to_none(d.get("ma200")),
        isAboveMa200=bool(d.get("is_above_ma200", False)),
        isPennyStock=bool(d.get("is_penny_stock", False)),
        isBankruptcyRisk=bool(d.get("is_bankruptcy_risk", False)),
        isSmallCap=bool(d.get("is_small_cap", False)),
        riskScore=int(d.get("risk_score", 0) or 0),
        themeScore=int(d.get("themeScore", 0) or 0),
    )


@router.get("/{theme_key}", response_model=ApiResponseSchema)
async def get_theme_stocks(
    theme_key: str,
    background_tasks: BackgroundTasks,
    force_refresh: bool = False,
):
    """
    Return filtered & scored stocks for a given investment theme.
    Results are cached; stale data triggers a background refresh.
    """
    if theme_key not in VALID_THEMES:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown theme '{theme_key}'. Valid: {sorted(VALID_THEMES)}",
        )

    cache_key = f"theme:{theme_key}"

    if not force_refresh:
        cached = await cache.get(cache_key)
        if cached:
            return ApiResponseSchema(data=cached, cached=True)

    try:
        universe = get_full_universe()
        raw_stocks = await bulk_fetch_universe(universe[:200])
        filtered, original_count = filter_universe(raw_stocks)
        themed = run_theme(theme_key, filtered)

        stock_schemas = [_map_to_stock_schema(s) for s in themed]

        payload = ThemeResponseSchema(
            theme=theme_key,
            stocks=stock_schemas,
            totalCount=len(stock_schemas),
            filteredCount=original_count,
            lastUpdated=datetime.utcnow().isoformat(),
        )

        await cache.set(cache_key, payload.model_dump(), ttl=settings.CACHE_TTL_THEME)
        return ApiResponseSchema(data=payload.model_dump(), cached=False)

    except Exception as e:
        logger.error(f"Theme compute error ({theme_key}): {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to compute theme data")


@router.get("/", response_model=ApiResponseSchema)
async def list_themes():
    """List all available theme keys."""
    return ApiResponseSchema(
        data={"themes": sorted(VALID_THEMES)},
        cached=False,
    )
