"""
Base Filter – Risk Guard
Removes penny stocks, micro-caps, and bankruptcy-risk tickers
before any theme analysis.
"""
import re
import logging
from typing import Optional

from ..core.config import settings

logger = logging.getLogger(__name__)

# Regex for risky ticker suffixes
_RISKY_SUFFIX_RE = re.compile(
    r"(\.(Q|E|PK|OB|D|BB|SC|LF|WI|XB|XV|XO|XA|CL|CP))$",
    re.IGNORECASE,
)


def passes_base_filter(stock: dict) -> tuple[bool, list[str]]:
    """
    Returns (passes: bool, reasons: list[str]).
    reasons is non-empty when the stock is REJECTED.
    """
    reasons = []

    # 1. Price check
    price = stock.get("price", 0) or 0
    if price < settings.RISK_MIN_PRICE:
        reasons.append(f"Penny stock (price ${price:.2f} < ${settings.RISK_MIN_PRICE})")

    # 2. Market cap check
    market_cap = stock.get("market_cap", 0) or 0
    if 0 < market_cap < settings.RISK_MIN_MARKET_CAP:
        reasons.append(
            f"Micro-cap (${market_cap/1e6:.1f}M < ${settings.RISK_MIN_MARKET_CAP/1e6:.0f}M)"
        )

    # 3. Ticker suffix check (bankruptcy / OTC risk)
    ticker = stock.get("ticker", "")
    if _RISKY_SUFFIX_RE.search(ticker):
        reasons.append(f"Risky ticker suffix: {ticker}")

    # 4. Missing price data entirely (likely delisted / no data)
    if price == 0:
        reasons.append("No price data (possibly delisted)")

    passes = len(reasons) == 0
    return passes, reasons


def calculate_risk_score(stock: dict) -> int:
    """
    Composite risk score 0–100.
    Higher = riskier.
    """
    score = 0

    price = stock.get("price", 0) or 0
    market_cap = stock.get("market_cap", 0) or 0
    debt_to_equity = stock.get("debt_to_equity") or 0
    operating_margin = stock.get("operating_margin") or 0
    revenue_growth = stock.get("revenue_growth") or 0

    # Price risk
    if price < 2:
        score += 30
    elif price < 5:
        score += 15
    elif price < 10:
        score += 5

    # Market cap risk
    if market_cap < 100_000_000:  # < $100M
        score += 25
    elif market_cap < 500_000_000:  # < $500M
        score += 10
    elif market_cap < 2_000_000_000:  # < $2B
        score += 5

    # Debt risk
    if debt_to_equity > 200:
        score += 20
    elif debt_to_equity > 100:
        score += 10
    elif debt_to_equity > 50:
        score += 5

    # Profitability risk
    if operating_margin < 0:
        score += 15
    elif operating_margin < 0.05:
        score += 5

    # Growth risk (shrinking revenue)
    if revenue_growth < -0.1:
        score += 10
    elif revenue_growth < 0:
        score += 5

    return min(score, 100)


def annotate_risk_fields(stock: dict) -> dict:
    """Add risk metadata fields to a stock dict."""
    passes, reasons = passes_base_filter(stock)
    stock["passes_base_filter"] = passes
    stock["risk_reasons"] = reasons
    stock["risk_score"] = calculate_risk_score(stock)
    stock["is_penny_stock"] = (stock.get("price", 0) or 0) < settings.RISK_MIN_PRICE
    stock["is_small_cap"] = (
        0 < (stock.get("market_cap", 0) or 0) < settings.RISK_MIN_MARKET_CAP
    )
    stock["is_bankruptcy_risk"] = bool(_RISKY_SUFFIX_RE.search(stock.get("ticker", "")))
    return stock


def filter_universe(stocks: list[dict]) -> tuple[list[dict], int]:
    """
    Apply base filter to a list of stock dicts.
    Returns (filtered_list, original_count).
    """
    original_count = len(stocks)
    passed = []
    rejected = 0

    for stock in stocks:
        annotate_risk_fields(stock)
        if stock["passes_base_filter"]:
            passed.append(stock)
        else:
            rejected += 1

    logger.info(
        f"Base filter: {len(passed)} passed / {rejected} rejected "
        f"(from {original_count})"
    )
    return passed, original_count
