"""
Themes Router – /api/theme/{theme_key}
"""
import logging
from datetime import datetime

from fastapi import APIRouter, HTTPException, BackgroundTasks

from ..core.cache import cache
from ..core.config import settings
from ..services.fetcher import get_full_universe, bulk_fetch_universe
from ..services.filters import filter_universe
from ..services.theme_engines import run_theme, THEME_ENGINES
from ..models.schemas import ThemeResponseSchema, ApiResponseSchema

router = APIRouter()
logger = logging.getLogger(__name__)

VALID_THEMES = set(THEME_ENGINES.keys())


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

    # Try cache first
    if not force_refresh:
        cached = await cache.get(cache_key)
        if cached:
            return ApiResponseSchema(data=cached, cached=True)

    # Cache miss – compute synchronously (first request or forced refresh)
    try:
        universe = get_full_universe()
        raw_stocks = await bulk_fetch_universe(universe[:200])  # limit for serverless
        filtered, original_count = filter_universe(raw_stocks)
        themed = run_theme(theme_key, filtered)

        payload = ThemeResponseSchema(
            theme=theme_key,
            stocks=themed,
            totalCount=len(themed),
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
