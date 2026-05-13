"""
Technical Analysis Service
finance-prediction의 지표 계산 로직을 QuantScreen FastAPI 백엔드에 통합
"""
import logging
from datetime import datetime

import numpy as np
import pandas as pd
import yfinance as yf

logger = logging.getLogger(__name__)


def fetch_technical_data(ticker: str, period: str = "6mo") -> dict:
    try:
        t = yf.Ticker(ticker)
        hist = t.history(period=period, interval="1d", auto_adjust=True)
        if hist.empty or len(hist) < 20:
            return {}

        df = hist.reset_index()
        df.columns = [c.lower() for c in df.columns]
        date_col = next((c for c in df.columns if "date" in c), None)
        if date_col:
            df["date"] = pd.to_datetime(df[date_col]).dt.strftime("%Y-%m-%d")

        close = df["close"]

        for w in [5, 20, 60]:
            df[f"ma{w}"] = close.rolling(w).mean().round(4)

        bb_mid = close.rolling(20).mean()
        bb_std = close.rolling(20).std()
        df["bb_upper"] = (bb_mid + 2 * bb_std).round(4)
        df["bb_lower"] = (bb_mid - 2 * bb_std).round(4)
        df["bb_mid"] = bb_mid.round(4)

        delta = close.diff()
        gain = delta.clip(lower=0).rolling(14).mean()
        loss = (-delta.clip(upper=0)).rolling(14).mean()
        rs = gain / loss.replace(0, np.nan)
        df["rsi"] = (100 - (100 / (1 + rs))).round(2)

        ema12 = close.ewm(span=12, adjust=False).mean()
        ema26 = close.ewm(span=26, adjust=False).mean()
        df["macd"] = (ema12 - ema26).round(4)
        df["macd_signal"] = df["macd"].ewm(span=9, adjust=False).mean().round(4)
        df["macd_hist"] = (df["macd"] - df["macd_signal"]).round(4)

        indicator_cols = [
            "ma5", "ma20", "ma60",
            "bb_upper", "bb_lower", "bb_mid",
            "rsi", "macd", "macd_signal", "macd_hist",
        ]

        data_points = []
        for _, row in df.iterrows():
            point = {
                "date": row["date"],
                "close": round(float(row["close"]), 4),
                "volume": int(row.get("volume", 0)),
            }
            for col in indicator_cols:
                val = row.get(col)
                point[col] = round(float(val), 4) if pd.notna(val) else None
            data_points.append(point)

        return {
            "ticker": ticker,
            "period": period,
            "data": data_points,
            "signal": _trading_signal(df),
            "lastUpdated": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        logger.error(f"Technical analysis failed for {ticker}: {e}", exc_info=True)
        return {}


def _trading_signal(df: pd.DataFrame) -> dict:
    last = df.iloc[-1]
    signals = []

    if pd.notna(last.get("ma5")) and pd.notna(last.get("ma20")):
        if float(last["ma5"]) > float(last["ma20"]):
            signals.append({"signal": "buy", "description": "MA5 > MA20 (골든크로스)"})
        else:
            signals.append({"signal": "sell", "description": "MA5 < MA20 (데드크로스)"})

    if pd.notna(last.get("rsi")):
        rsi = float(last["rsi"])
        if rsi < 30:
            signals.append({"signal": "buy", "description": f"RSI {rsi:.1f} — 과매도"})
        elif rsi > 70:
            signals.append({"signal": "sell", "description": f"RSI {rsi:.1f} — 과매수"})
        else:
            signals.append({"signal": "hold", "description": f"RSI {rsi:.1f} — 중립"})

    if pd.notna(last.get("macd")) and pd.notna(last.get("macd_signal")):
        if float(last["macd"]) > float(last["macd_signal"]):
            signals.append({"signal": "buy", "description": "MACD > Signal"})
        else:
            signals.append({"signal": "sell", "description": "MACD < Signal"})

    if pd.notna(last.get("bb_upper")) and pd.notna(last.get("bb_lower")):
        price = float(last["close"])
        if price < float(last["bb_lower"]):
            signals.append({"signal": "buy", "description": "볼린저 하단 이탈 — 반등 가능성"})
        elif price > float(last["bb_upper"]):
            signals.append({"signal": "sell", "description": "볼린저 상단 이탈 — 조정 가능성"})
        else:
            signals.append({"signal": "hold", "description": "볼린저 밴드 내부"})

    buy_cnt = sum(1 for s in signals if s["signal"] == "buy")
    sell_cnt = sum(1 for s in signals if s["signal"] == "sell")
    overall = "buy" if buy_cnt > sell_cnt else ("sell" if sell_cnt > buy_cnt else "hold")

    return {
        "overall": overall,
        "buy_count": buy_cnt,
        "sell_count": sell_cnt,
        "details": signals,
    }
