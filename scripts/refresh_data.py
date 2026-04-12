"""
Manual Data Refresh Script
Fetches all stock data and runs all 9 theme engines immediately.
Usage:
  python scripts/refresh_data.py [--theme undervalued_growth]
"""
import sys
import os
import asyncio
import argparse
import logging
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s – %(message)s",
)
logger = logging.getLogger("refresh")

from backend.services.fetcher import get_full_universe, bulk_fetch_universe
from backend.services.filters import filter_universe
from backend.services.theme_engines import run_theme, THEME_ENGINES
from backend.core.cache import cache


async def main(theme_filter: str | None = None):
    await cache.connect()

    start = datetime.utcnow()
    logger.info("=== QuantScreen Manual Data Refresh ===")

    # Step 1: Universe
    universe = get_full_universe()
    logger.info(f"Universe: {len(universe)} tickers")

    # Step 2: Fetch
    logger.info("Fetching yfinance data (this may take a few minutes)...")
    raw = await bulk_fetch_universe(universe, chunk_size=50)
    logger.info(f"Fetched: {len(raw)} stocks")

    # Step 3: Filter
    filtered, original_count = filter_universe(raw)
    logger.info(f"After base filter: {len(filtered)} / {original_count}")

    # Step 4: Theme engines
    themes_to_run = [theme_filter] if theme_filter else list(THEME_ENGINES.keys())

    for theme_key in themes_to_run:
        logger.info(f"Running theme: {theme_key} ...")
        themed = run_theme(theme_key, filtered)

        payload = {
            "theme": theme_key,
            "stocks": themed,
            "totalCount": len(themed),
            "filteredCount": original_count,
            "lastUpdated": datetime.utcnow().isoformat(),
        }
        await cache.set(f"theme:{theme_key}", payload, ttl=86400)
        logger.info(f"  ✓ {theme_key}: {len(themed)} stocks (cached)")

    elapsed = (datetime.utcnow() - start).total_seconds()
    logger.info(f"=== Done in {elapsed:.1f}s ===")
    await cache.disconnect()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="QuantScreen data refresh")
    parser.add_argument(
        "--theme",
        type=str,
        default=None,
        help=f"Run single theme only. Options: {list(THEME_ENGINES.keys())}",
    )
    args = parser.parse_args()
    asyncio.run(main(theme_filter=args.theme))
