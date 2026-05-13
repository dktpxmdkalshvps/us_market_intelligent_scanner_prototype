"""
Scheduler Service – APScheduler
Runs data refresh jobs after US market close (default: 5:30 PM ET).
"""
import logging
import asyncio
from datetime import datetime

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import pytz

from ..core.config import settings

logger = logging.getLogger(__name__)
_scheduler = BackgroundScheduler(timezone=pytz.UTC)


# ── Job Definitions ──────────────────────────────────────────────────────────

def job_refresh_all_themes():
    """
    Full pipeline:
    1. Fetch universe tickers
    2. Pull yfinance data
    3. Apply base filter
    4. Run all 9 theme engines
    5. Persist to DB + invalidate cache
    """
    logger.info(f"[Scheduler] Starting full refresh at {datetime.utcnow().isoformat()}")
    try:
        # Import here to avoid circular imports at module load time
        from .fetcher import get_full_universe, bulk_fetch_universe
        from .filters import filter_universe
        from .theme_engines import run_theme, THEME_ENGINES
        from ..core.cache import cache

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        universe = get_full_universe()
        logger.info(f"Universe: {len(universe)} tickers")

        # Bulk fetch
        raw_stocks = loop.run_until_complete(bulk_fetch_universe(universe))
        logger.info(f"Fetched: {len(raw_stocks)} stocks")

        # Base filter
        filtered, original_count = filter_universe(raw_stocks)
        logger.info(f"After filter: {len(filtered)} / {original_count}")

        # Run all theme engines + cache results
        for theme_key in THEME_ENGINES.keys():
            themed = run_theme(theme_key, filtered)
            cache_key = f"theme:{theme_key}"
            payload = {
                "theme": theme_key,
                "stocks": themed,
                "totalCount": len(themed),
                "filteredCount": original_count,
                "lastUpdated": datetime.utcnow().isoformat(),
            }
            loop.run_until_complete(
                cache.set(cache_key, payload, ttl=settings.CACHE_TTL_THEME)
            )

        loop.close()
        logger.info("[Scheduler] Full refresh complete.")
    except Exception as e:
        logger.error(f"[Scheduler] Refresh failed: {e}", exc_info=True)


def job_refresh_market_data():
    """Refresh indices + FX rates (runs every minute during market hours)."""
    logger.info("[Scheduler] Refreshing market data...")
    try:
        from ..core.cache import cache
        from .market_service import fetch_live_market_data

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        data = fetch_live_market_data()
        loop.run_until_complete(
            cache.set("market:banner", data, ttl=settings.CACHE_TTL_MARKET)
        )
        loop.close()
    except Exception as e:
        logger.error(f"[Scheduler] Market data refresh failed: {e}")


# ── Lifecycle ────────────────────────────────────────────────────────────────

def start_scheduler():
    tz = pytz.timezone(settings.SCHEDULER_TIMEZONE)

    # Full theme refresh – daily after market close
    _scheduler.add_job(
        job_refresh_all_themes,
        CronTrigger(
            hour=settings.SCHEDULER_HOUR,
            minute=settings.SCHEDULER_MINUTE,
            timezone=tz,
            day_of_week="mon-fri",
        ),
        id="full_refresh",
        replace_existing=True,
        max_instances=1,
    )

    # Market data refresh – every minute, Mon-Fri 09:00–16:30 ET
    _scheduler.add_job(
        job_refresh_market_data,
        CronTrigger(
            minute="*/1",
            hour="9-16",
            day_of_week="mon-fri",
            timezone=tz,
        ),
        id="market_refresh",
        replace_existing=True,
        max_instances=1,
    )

    _scheduler.start()
    logger.info(
        f"Scheduler started. Full refresh at "
        f"{settings.SCHEDULER_HOUR:02d}:{settings.SCHEDULER_MINUTE:02d} "
        f"{settings.SCHEDULER_TIMEZONE} (Mon-Fri)"
    )


def shutdown_scheduler():
    if _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped.")


def trigger_manual_refresh():
    """For admin use – trigger immediately."""
    _scheduler.add_job(
        job_refresh_all_themes,
        id="manual_refresh",
        replace_existing=True,
    )
    logger.info("Manual refresh triggered.")
