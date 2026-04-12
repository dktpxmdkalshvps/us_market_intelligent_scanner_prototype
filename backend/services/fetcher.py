"""
Data Fetcher Service
- Fetches S&P 500 / NASDAQ 100 constituent lists
- Pulls yfinance info, financials, and price history per ticker
"""
import logging
import asyncio
from typing import Optional
from functools import lru_cache

import pandas as pd
import yfinance as yf
import requests
from io import StringIO

from ..core.config import settings

logger = logging.getLogger(__name__)

# ── Universe Lists ───────────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def get_sp500_tickers() -> list[str]:
    """Fetch S&P 500 constituents from Wikipedia."""
    try:
        tables = pd.read_html(
            "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"
        )
        df = tables[0]
        tickers = df["Symbol"].str.replace(".", "-", regex=False).tolist()
        logger.info(f"Fetched {len(tickers)} S&P 500 tickers")
        return tickers
    except Exception as e:
        logger.error(f"Failed to fetch S&P 500 list: {e}")
        return _sp500_fallback()


@lru_cache(maxsize=1)
def get_nasdaq100_tickers() -> list[str]:
    """Fetch NASDAQ 100 constituents from Wikipedia."""
    try:
        tables = pd.read_html(
            "https://en.wikipedia.org/wiki/Nasdaq-100"
        )
        for df in tables:
            cols = [c.lower() for c in df.columns]
            if "ticker" in cols or "symbol" in cols:
                col = "Ticker" if "Ticker" in df.columns else "Symbol"
                tickers = df[col].str.replace(".", "-", regex=False).tolist()
                logger.info(f"Fetched {len(tickers)} NASDAQ 100 tickers")
                return tickers
    except Exception as e:
        logger.error(f"Failed to fetch NASDAQ 100 list: {e}")
    return []


def get_full_universe() -> list[str]:
    """Combined de-duplicated universe."""
    sp500 = get_sp500_tickers()
    nasdaq = get_nasdaq100_tickers()
    universe = list(dict.fromkeys(sp500 + nasdaq))  # preserve order, no dups
    return universe


# ── Single Stock Fetch ───────────────────────────────────────────────────────

def fetch_ticker_data(ticker: str) -> Optional[dict]:
    """
    Fetch all data for a single ticker via yfinance.
    Returns a normalized dict or None on failure.
    """
    try:
        t = yf.Ticker(ticker)
        info = t.info or {}

        if not info.get("regularMarketPrice") and not info.get("currentPrice"):
            return None

        price = info.get("currentPrice") or info.get("regularMarketPrice", 0)
        prev_close = info.get("previousClose") or info.get("regularMarketPreviousClose", price)
        change = price - prev_close
        change_pct = (change / prev_close * 100) if prev_close else 0

        return {
            "ticker": ticker,
            "name": info.get("longName") or info.get("shortName", ticker),
            "sector": info.get("sector", ""),
            "industry": info.get("industry", ""),
            "price": price,
            "change": change,
            "change_percent": change_pct,
            "market_cap": info.get("marketCap", 0),
            "volume": info.get("volume") or info.get("averageVolume", 0),
            # Quant
            "per": info.get("trailingPE") or info.get("forwardPE"),
            "peg": info.get("pegRatio"),
            "pbr": info.get("priceToBook"),
            "roe": _safe_pct(info.get("returnOnEquity")),
            "revenue_growth": info.get("revenueGrowth"),
            "operating_margin": info.get("operatingMargins"),
            "debt_to_equity": info.get("debtToEquity"),
            "dividend_yield": info.get("dividendYield"),
            "eps": info.get("trailingEps") or info.get("forwardEps"),
            "description": info.get("longBusinessSummary", ""),
            "website": info.get("website", ""),
            "employees": info.get("fullTimeEmployees"),
            "raw_info": info,
        }
    except Exception as e:
        logger.warning(f"Failed to fetch {ticker}: {e}")
        return None


def fetch_price_history(
    ticker: str,
    period: str = "1y",
    interval: str = "1d",
) -> pd.DataFrame:
    """Return OHLCV DataFrame with MA columns."""
    try:
        t = yf.Ticker(ticker)
        hist = t.history(period=period, interval=interval, auto_adjust=True)
        if hist.empty:
            return pd.DataFrame()

        hist = hist.reset_index()
        hist.columns = [c.lower() for c in hist.columns]
        hist["date"] = hist["date"].dt.strftime("%Y-%m-%d")

        # Moving averages
        hist["ma50"] = hist["close"].rolling(50).mean().round(4)
        hist["ma200"] = hist["close"].rolling(200).mean().round(4)

        return hist[["date", "open", "high", "low", "close", "volume", "ma50", "ma200"]]
    except Exception as e:
        logger.warning(f"Price history failed for {ticker}: {e}")
        return pd.DataFrame()


def fetch_quarterly_financials(ticker: str) -> dict:
    """Return quarterly P&L data for trend analysis."""
    try:
        t = yf.Ticker(ticker)
        qf = t.quarterly_financials

        if qf is None or qf.empty:
            return {}

        def _extract(row_labels: list[str]) -> list[dict]:
            for label in row_labels:
                if label in qf.index:
                    series = qf.loc[label].dropna().sort_index()
                    results = []
                    values = list(series.items())
                    for i, (date, val) in enumerate(values):
                        yoy = None
                        if i >= 4:
                            prev_val = values[i - 4][1]
                            yoy = ((val - prev_val) / abs(prev_val) * 100) if prev_val else None
                        results.append({
                            "period": date.strftime("%Y-Q%q") if hasattr(date, "strftime") else str(date)[:7],
                            "value": float(val),
                            "yoyChange": round(yoy, 2) if yoy is not None else None,
                        })
                    return results[-8:]  # last 8 quarters
            return []

        return {
            "revenue": _extract(["Total Revenue", "Revenue"]),
            "operatingIncome": _extract(["Operating Income", "EBIT"]),
            "netIncome": _extract(["Net Income", "Net Income Common Stockholders"]),
            "eps": _extract(["Basic EPS", "Diluted EPS"]),
        }
    except Exception as e:
        logger.warning(f"Financials fetch failed for {ticker}: {e}")
        return {}


# ── Bulk Fetch ───────────────────────────────────────────────────────────────

async def bulk_fetch_universe(tickers: list[str], chunk_size: int = 50) -> list[dict]:
    """Async bulk fetch using yfinance download for efficiency."""
    results = []
    for i in range(0, len(tickers), chunk_size):
        chunk = tickers[i : i + chunk_size]
        try:
            data = await asyncio.get_event_loop().run_in_executor(
                None, lambda c=chunk: _fetch_chunk(c)
            )
            results.extend(data)
        except Exception as e:
            logger.error(f"Chunk {i}-{i+chunk_size} failed: {e}")
    return results


def _fetch_chunk(tickers: list[str]) -> list[dict]:
    chunk_results = []
    for t in tickers:
        d = fetch_ticker_data(t)
        if d:
            chunk_results.append(d)
    return chunk_results


# ── Helpers ──────────────────────────────────────────────────────────────────

def _safe_pct(val) -> Optional[float]:
    if val is None:
        return None
    return round(float(val) * 100, 4)


def _sp500_fallback() -> list[str]:
    """Minimal hardcoded fallback for critical failures."""
    return [
        "AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA", "BRK-B",
        "LLY", "V", "JPM", "UNH", "XOM", "MA", "AVGO", "PG", "JNJ", "HD",
        "COST", "MRK", "ABBV", "CVX", "NFLX", "KO", "PEP", "AMD", "WMT",
        "BAC", "CRM", "ACN", "MCD", "CSCO", "ABT", "DHR", "ADBE", "TXN",
        "TMO", "QCOM", "NKE", "PM", "ORCL", "INTC", "VZ", "DIS", "CMCSA",
    ]
