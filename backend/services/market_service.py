"""
Market Service – live indices, FX rates, earnings calendar
"""
import logging
from datetime import datetime, timedelta

import yfinance as yf

logger = logging.getLogger(__name__)

INDEX_SYMBOLS = {
    "^GSPC": "S&P 500",
    "^IXIC": "NASDAQ",
    "^DJI": "Dow Jones",
    "^VIX": "VIX",
    "^RUT": "Russell 2000",
}

FX_SYMBOLS = {
    "KRW=X": "USD/KRW",
    "JPY=X": "USD/JPY",
    "EURUSD=X": "EUR/USD",
    "CNY=X": "USD/CNY",
}


def fetch_live_market_data() -> dict:
    """Return market banner payload."""
    indices = []
    for symbol, name in INDEX_SYMBOLS.items():
        try:
            t = yf.Ticker(symbol)
            info = t.fast_info
            price = info.last_price or 0
            prev = info.previous_close or price
            change = price - prev
            change_pct = (change / prev * 100) if prev else 0
            indices.append({
                "symbol": name,
                "name": name,
                "price": round(price, 2),
                "change": round(change, 2),
                "changePercent": round(change_pct, 3),
            })
        except Exception as e:
            logger.warning(f"Index {symbol} failed: {e}")

    fx_rates = []
    for symbol, pair in FX_SYMBOLS.items():
        try:
            t = yf.Ticker(symbol)
            info = t.fast_info
            rate = info.last_price or 0
            prev = info.previous_close or rate
            change = rate - prev
            fx_rates.append({
                "pair": pair,
                "rate": round(rate, 4),
                "change": round(change, 4),
            })
        except Exception as e:
            logger.warning(f"FX {symbol} failed: {e}")

    return {
        "indices": indices,
        "exchangeRates": fx_rates,
        "lastUpdated": datetime.utcnow().isoformat(),
    }


def build_earnings_calendar(days_ahead: int = 7) -> list[dict]:
    """
    Returns upcoming earnings events.
    yfinance doesn't provide a full calendar; we use a curated approach.
    For production, integrate with a paid earnings calendar API.
    """
    events = []
    today = datetime.utcnow().date()

    # Placeholder major earnings (replace with real API integration)
    MAJOR_UPCOMING = [
        ("NVDA", 1), ("AAPL", 3), ("MSFT", 3), ("GOOGL", 5),
        ("META", 5), ("AMZN", 7), ("TSLA", 10), ("AMD", 12),
    ]

    for ticker, days in MAJOR_UPCOMING:
        event_date = today + timedelta(days=days)
        events.append({
            "date": str(event_date),
            "type": "earnings",
            "title": f"{ticker} 실적 발표",
            "tickers": [ticker],
            "importance": "high",
        })

    # Economic calendar placeholders
    ECONOMIC = [
        (2, "CPI 소비자물가지수", "high"),
        (4, "비농업 고용지수 (NFP)", "high"),
        (6, "FOMC 회의록 공개", "high"),
        (9, "PPI 생산자물가지수", "medium"),
    ]
    for days, title, importance in ECONOMIC:
        event_date = today + timedelta(days=days)
        events.append({
            "date": str(event_date),
            "type": "economic" if "FOMC" not in title else "fomc",
            "title": title,
            "tickers": None,
            "importance": importance,
        })

    events.sort(key=lambda e: e["date"])
    cutoff = str(today + timedelta(days=days_ahead))
    return [e for e in events if e["date"] <= cutoff]
