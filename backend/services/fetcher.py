"""
Data Fetcher Service – 버그 수정 버전
수정사항:
  1. fetch_quarterly_financials: strftime("%Y-Q%q") → f"{year}-Q{quarter}" 로 변경
  2. fetch_ticker_data: ma50/ma200 필드 추가 (breakout 테마 지원)
  3. get_full_universe: UNIVERSE_LIMIT 설정 반영
"""
import logging
import asyncio
from typing import Optional
from functools import lru_cache

import pandas as pd
import yfinance as yf

from ..core.config import settings

logger = logging.getLogger(__name__)


# ── Universe Lists ──────────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def get_sp500_tickers() -> list[str]:
    try:
        tables = pd.read_html(
            "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"
        )
        df = tables[0]
        tickers = df["Symbol"].str.replace(".", "-", regex=False).tolist()
        logger.info(f"S&P 500 티커 {len(tickers)}개 수신")
        return tickers
    except Exception as e:
        logger.error(f"S&P 500 목록 수신 실패: {e}")
        return _sp500_fallback()


@lru_cache(maxsize=1)
def get_nasdaq100_tickers() -> list[str]:
    try:
        tables = pd.read_html("https://en.wikipedia.org/wiki/Nasdaq-100")
        for df in tables:
            cols = [c.lower() for c in df.columns]
            if "ticker" in cols or "symbol" in cols:
                col = "Ticker" if "Ticker" in df.columns else "Symbol"
                tickers = df[col].str.replace(".", "-", regex=False).tolist()
                logger.info(f"NASDAQ 100 티커 {len(tickers)}개 수신")
                return tickers
    except Exception as e:
        logger.error(f"NASDAQ 100 목록 수신 실패: {e}")
    return []


def get_full_universe() -> list[str]:
    sp500 = get_sp500_tickers()
    nasdaq = get_nasdaq100_tickers()
    universe = list(dict.fromkeys(sp500 + nasdaq))

    # 개발 환경 제한 (config의 UNIVERSE_LIMIT > 0 이면 잘라냄)
    if settings.UNIVERSE_LIMIT > 0:
        universe = universe[: settings.UNIVERSE_LIMIT]
        logger.info(f"유니버스 제한 적용: {len(universe)}개")

    return universe


# ── Single Stock Fetch ──────────────────────────────────────────────────────

def fetch_ticker_data(ticker: str) -> Optional[dict]:
    """
    yfinance .info + 최근 가격 이력(MA50/MA200 포함)을 하나의 dict로 반환.
    [수정] MA 데이터를 함께 계산하여 breakout 테마가 동작하도록 수정.
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

        # ── MA50/MA200 계산 ────────────────────────────────────────────────
        ma50, ma200 = None, None
        is_above_ma200 = False
        try:
            hist = t.history(period="1y", interval="1d", auto_adjust=True)
            if not hist.empty and len(hist) >= 10:
                closes = hist["Close"]
                if len(closes) >= 50:
                    ma50 = round(float(closes.rolling(50).mean().iloc[-1]), 4)
                if len(closes) >= 200:
                    ma200 = round(float(closes.rolling(200).mean().iloc[-1]), 4)
                if ma200 and price:
                    is_above_ma200 = price > ma200
        except Exception:
            pass  # MA 계산 실패 시 None 유지 (breakout 필터에서 자동 제외)

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
            # Quant 지표
            "per": info.get("trailingPE") or info.get("forwardPE"),
            "peg": info.get("pegRatio"),
            "pbr": info.get("priceToBook"),
            "roe": _safe_pct(info.get("returnOnEquity")),
            "revenue_growth": info.get("revenueGrowth"),
            "operating_margin": info.get("operatingMargins"),
            "debt_to_equity": info.get("debtToEquity"),
            "dividend_yield": info.get("dividendYield"),
            "eps": info.get("trailingEps") or info.get("forwardEps"),
            # 기술적 지표 (breakout 테마 지원)
            "ma50": ma50,
            "ma200": ma200,
            "is_above_ma200": is_above_ma200,
            # 기타
            "description": info.get("longBusinessSummary", ""),
            "website": info.get("website", ""),
            "employees": info.get("fullTimeEmployees"),
            "raw_info": info,
        }
    except Exception as e:
        logger.warning(f"{ticker} fetch 실패: {e}")
        return None


def fetch_price_history(
    ticker: str,
    period: str = "1y",
    interval: str = "1d",
) -> pd.DataFrame:
    """OHLCV + MA 컬럼이 포함된 DataFrame 반환"""
    try:
        t = yf.Ticker(ticker)
        hist = t.history(period=period, interval=interval, auto_adjust=True)
        if hist.empty:
            return pd.DataFrame()

        hist = hist.reset_index()
        hist.columns = [c.lower() for c in hist.columns]
        hist["date"] = hist["date"].dt.strftime("%Y-%m-%d")
        hist["ma50"] = hist["close"].rolling(50).mean().round(4)
        hist["ma200"] = hist["close"].rolling(200).mean().round(4)
        return hist[["date", "open", "high", "low", "close", "volume", "ma50", "ma200"]]
    except Exception as e:
        logger.warning(f"{ticker} 가격 이력 fetch 실패: {e}")
        return pd.DataFrame()


def fetch_quarterly_financials(ticker: str) -> dict:
    """
    분기 실적 데이터 반환.
    [버그 수정] strftime('%Y-Q%q') → %q는 Python 표준 아님.
               (month-1)//3+1 로 직접 계산.
    """
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

                        # ── 수정: %q 대신 직접 분기 계산 ──────────────────
                        if hasattr(date, "month"):
                            quarter = (date.month - 1) // 3 + 1
                            period_str = f"{date.year}-Q{quarter}"
                        else:
                            period_str = str(date)[:7]

                        results.append({
                            "period": period_str,
                            "value": float(val),
                            "yoyChange": round(yoy, 2) if yoy is not None else None,
                        })
                    return results[-8:]
            return []

        return {
            "revenue": _extract(["Total Revenue", "Revenue"]),
            "operatingIncome": _extract(["Operating Income", "EBIT"]),
            "netIncome": _extract(["Net Income", "Net Income Common Stockholders"]),
            "eps": _extract(["Basic EPS", "Diluted EPS"]),
        }
    except Exception as e:
        logger.warning(f"{ticker} 실적 데이터 fetch 실패: {e}")
        return {}


# ── Bulk Fetch ──────────────────────────────────────────────────────────────

async def bulk_fetch_universe(tickers: list[str], chunk_size: int = 20) -> list[dict]:
    """비동기 청크 단위 bulk fetch"""
    results = []
    for i in range(0, len(tickers), chunk_size):
        chunk = tickers[i: i + chunk_size]
        try:
            data = await asyncio.get_event_loop().run_in_executor(
                None, lambda c=chunk: _fetch_chunk(c)
            )
            results.extend(data)
            logger.info(f"  청크 {i+1}~{i+len(chunk)}: {len(data)}개 수신")
        except Exception as e:
            logger.error(f"청크 {i}-{i+chunk_size} 실패: {e}")
    return results


def _fetch_chunk(tickers: list[str]) -> list[dict]:
    return [d for t in tickers if (d := fetch_ticker_data(t)) is not None]


# ── Helpers ─────────────────────────────────────────────────────────────────

def _safe_pct(val) -> Optional[float]:
    if val is None:
        return None
    return round(float(val) * 100, 4)


def _sp500_fallback() -> list[str]:
    return [
        "AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA", "BRK-B",
        "LLY", "V", "JPM", "UNH", "XOM", "MA", "AVGO", "PG", "JNJ", "HD",
        "COST", "MRK", "ABBV", "CVX", "NFLX", "KO", "PEP", "AMD", "WMT",
        "BAC", "CRM", "ACN", "MCD", "CSCO", "ABT", "DHR", "ADBE", "TXN",
        "TMO", "QCOM", "NKE", "PM", "ORCL", "INTC", "VZ", "DIS", "CMCSA",
    ]
