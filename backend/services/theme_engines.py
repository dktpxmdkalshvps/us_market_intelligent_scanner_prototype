"""
Theme Engines – 9가지 투자 테마 퀀트 필터링 알고리즘
Each engine receives a list of pre-filtered stock dicts
and returns (scored_stocks, theme_score_per_stock).
"""
import logging
from typing import Callable

import pandas as pd

logger = logging.getLogger(__name__)

ThemeEngine = Callable[[list[dict]], list[dict]]


# ── Helper ───────────────────────────────────────────────────────────────────

def _to_df(stocks: list[dict]) -> pd.DataFrame:
    return pd.DataFrame(stocks)


def _clamp(val: float, lo: float = 0, hi: float = 100) -> int:
    return int(max(lo, min(hi, val)))


# ── 1. 저평가 성장주 ──────────────────────────────────────────────────────────
def theme_undervalued_growth(stocks: list[dict]) -> list[dict]:
    """PEG < 1.0 AND revenue_growth > 15%"""
    df = _to_df(stocks)
    mask = (
        df["peg"].notna() & (df["peg"] < 1.0) &
        df["revenue_growth"].notna() & (df["revenue_growth"] > 0.15)
    )
    result = df[mask].copy()

    def score(row):
        s = 50
        if pd.notna(row["peg"]):
            s += _clamp((1.0 - row["peg"]) * 50)          # lower PEG → higher
        if pd.notna(row["revenue_growth"]):
            s += _clamp((row["revenue_growth"] - 0.15) * 200)  # extra growth bonus
        return _clamp(s)

    result["themeScore"] = result.apply(score, axis=1)
    result = result.sort_values("themeScore", ascending=False)
    return result.to_dict("records")


# ── 2. 성장 기대주 (모멘텀) ───────────────────────────────────────────────────
def theme_growth_momentum(stocks: list[dict]) -> list[dict]:
    """
    Proxy: positive revenue_growth AND positive operating_margin
    (True quarter-level acceleration requires financials endpoint data;
     this is a simplified version usable from yfinance .info fields.)
    """
    df = _to_df(stocks)
    mask = (
        df["revenue_growth"].notna() & (df["revenue_growth"] > 0.10) &
        df["operating_margin"].notna() & (df["operating_margin"] > 0.05)
    )
    result = df[mask].copy()

    def score(row):
        s = 40
        s += _clamp(row.get("revenue_growth", 0) * 200)
        s += _clamp(row.get("operating_margin", 0) * 150)
        return _clamp(s)

    result["themeScore"] = result.apply(score, axis=1)
    result = result.sort_values("themeScore", ascending=False)
    return result.to_dict("records")


# ── 3. 안전 성장주 ────────────────────────────────────────────────────────────
def theme_safe_growth(stocks: list[dict]) -> list[dict]:
    """Positive revenue_growth + D/E < 50%"""
    df = _to_df(stocks)
    mask = (
        df["revenue_growth"].notna() & (df["revenue_growth"] > 0.05) &
        (df["debt_to_equity"].isna() | (df["debt_to_equity"] < 50))
    )
    result = df[mask].copy()

    def score(row):
        s = 50
        de = row.get("debt_to_equity") or 0
        s += _clamp((50 - de) / 50 * 30) if de >= 0 else 30
        s += _clamp(row.get("revenue_growth", 0) * 100)
        return _clamp(s)

    result["themeScore"] = result.apply(score, axis=1)
    result = result.sort_values("themeScore", ascending=False)
    return result.to_dict("records")


# ── 4. 저렴한 평가주 (딥 밸류) ──────────────────────────────────────────────
def theme_deep_value(stocks: list[dict]) -> list[dict]:
    """PBR < 1.0"""
    df = _to_df(stocks)
    mask = df["pbr"].notna() & (df["pbr"] < 1.0) & (df["pbr"] > 0)
    result = df[mask].copy()

    def score(row):
        pbr = row.get("pbr") or 1.0
        s = _clamp((1.0 - pbr) * 100 + 30)
        return s

    result["themeScore"] = result.apply(score, axis=1)
    result = result.sort_values("themeScore", ascending=False)
    return result.to_dict("records")


# ── 5. 고수익 저평가 (ROE + PER) ──────────────────────────────────────────────
def theme_high_roe(stocks: list[dict]) -> list[dict]:
    """ROE > 15% AND PER < 15"""
    df = _to_df(stocks)
    mask = (
        df["roe"].notna() & (df["roe"] > 15) &
        df["per"].notna() & (df["per"] > 0) & (df["per"] < 15)
    )
    result = df[mask].copy()

    def score(row):
        s = 40
        s += _clamp((row.get("roe", 0) - 15) * 2)
        s += _clamp((15 - row.get("per", 15)) * 3)
        return _clamp(s)

    result["themeScore"] = result.apply(score, axis=1)
    result = result.sort_values("themeScore", ascending=False)
    return result.to_dict("records")


# ── 6. 저평가 탈출 (브레이크아웃) ────────────────────────────────────────────
def theme_breakout(stocks: list[dict]) -> list[dict]:
    """
    Price > MA200 AND MA50 > MA200 (Golden Cross / 정배열).
    Requires ma50 and ma200 fields populated from price history.
    """
    df = _to_df(stocks)

    # Ensure columns exist
    for col in ["ma50", "ma200", "is_above_ma200"]:
        if col not in df.columns:
            df[col] = None

    mask = (
        df["ma50"].notna() & df["ma200"].notna() &
        (df["ma50"] > df["ma200"]) &              # 정배열
        (df["price"] > df["ma200"])               # price above 200MA
    )
    result = df[mask].copy()

    def score(row):
        if pd.isna(row.get("ma200")) or row["ma200"] == 0:
            return 50
        pct_above = (row["price"] - row["ma200"]) / row["ma200"] * 100
        s = _clamp(50 + pct_above * 2)
        return s

    result["themeScore"] = result.apply(score, axis=1)
    result = result.sort_values("themeScore", ascending=False)
    return result.to_dict("records")


# ── 7. 부가티주 (Top-Tier 영업이익률) ───────────────────────────────────────
def theme_bugatti(stocks: list[dict]) -> list[dict]:
    """Operating margin > 30%"""
    df = _to_df(stocks)
    mask = df["operating_margin"].notna() & (df["operating_margin"] > 0.30)
    result = df[mask].copy()

    def score(row):
        margin = row.get("operating_margin", 0.30)
        s = _clamp(50 + (margin - 0.30) * 200)
        return s

    result["themeScore"] = result.apply(score, axis=1)
    result = result.sort_values("themeScore", ascending=False)
    return result.to_dict("records")


# ── 8. 배당주 ──────────────────────────────────────────────────────────────
def theme_dividend(stocks: list[dict]) -> list[dict]:
    """Dividend yield > 4%"""
    df = _to_df(stocks)
    mask = df["dividend_yield"].notna() & (df["dividend_yield"] > 0.04)
    result = df[mask].copy()

    def score(row):
        dy = row.get("dividend_yield", 0.04)
        s = _clamp(50 + (dy - 0.04) * 1000)
        return s

    result["themeScore"] = result.apply(score, axis=1)
    result = result.sort_values("themeScore", ascending=False)
    return result.to_dict("records")


# ── 9. 미래왕 배당주 (배당귀족) ─────────────────────────────────────────────
def theme_dividend_aristocrat(stocks: list[dict]) -> list[dict]:
    """
    Dividend yield > 1% (proxy; real 10yr consecutive growth
    requires additional data source or pre-built list).
    Uses S&P Dividend Aristocrats list when available.
    """
    # Known Dividend Aristocrats (partial list – extend with full S&P list)
    ARISTOCRATS = {
        "ABT", "ABBVIE", "ACN", "AMCR", "ATO", "AWK", "AWR", "ADP",
        "ALB", "ALLE", "AME", "AOS", "APD", "BDX", "BEN", "CAH", "CAT",
        "CB", "CHRW", "CINF", "CTAS", "CLX", "CL", "ED", "DOV",
        "ECL", "EMR", "ES", "EXPD", "FAST", "FRT", "GD", "GPC", "HRL",
        "ITW", "J", "JNJ", "KMB", "KO", "LEG", "LIN", "LOW", "MCD",
        "MDT", "MKC", "MMC", "MMM", "NEE", "NDSN", "NUE", "O",
        "PBCT", "PBYI", "PEP", "PG", "PNR", "PPG", "ROP", "ROST",
        "SBUX", "SHW", "SPGI", "SWK", "SYY", "T", "TGT", "TROW",
        "WBA", "WMT", "XOM",
    }

    df = _to_df(stocks)
    mask = (
        df["ticker"].isin(ARISTOCRATS) &
        df["dividend_yield"].notna() & (df["dividend_yield"] > 0.01)
    )
    result = df[mask].copy()

    def score(row):
        dy = row.get("dividend_yield", 0) or 0
        s = _clamp(60 + dy * 500)
        return s

    result["themeScore"] = result.apply(score, axis=1)
    result = result.sort_values("themeScore", ascending=False)
    return result.to_dict("records")


# ── Registry ─────────────────────────────────────────────────────────────────

THEME_ENGINES: dict[str, ThemeEngine] = {
    "undervalued_growth": theme_undervalued_growth,
    "growth_momentum": theme_growth_momentum,
    "safe_growth": theme_safe_growth,
    "deep_value": theme_deep_value,
    "high_roe": theme_high_roe,
    "breakout": theme_breakout,
    "bugatti": theme_bugatti,
    "dividend": theme_dividend,
    "dividend_aristocrat": theme_dividend_aristocrat,
}


def run_theme(theme_key: str, filtered_stocks: list[dict]) -> list[dict]:
    engine = THEME_ENGINES.get(theme_key)
    if not engine:
        raise ValueError(f"Unknown theme: {theme_key}")
    try:
        result = engine(filtered_stocks)
        logger.info(f"Theme '{theme_key}': {len(result)} stocks matched")
        return result
    except Exception as e:
        logger.error(f"Theme engine '{theme_key}' error: {e}", exc_info=True)
        return []
