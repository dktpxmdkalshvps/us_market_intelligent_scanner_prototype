"""
Forecasting Service – Prophet + ARIMA
finance-prediction의 예측 로직을 QuantScreen FastAPI 백엔드에 통합
"""
import logging
from datetime import datetime, timedelta

import pandas as pd
import yfinance as yf

logger = logging.getLogger(__name__)


def run_forecast(ticker: str, model: str = "both", days: int = 7) -> dict:
    try:
        t = yf.Ticker(ticker)
        hist = t.history(period="2y", interval="1d", auto_adjust=True)
        if hist.empty or len(hist) < 30:
            return {}

        df = hist.reset_index()
        df.columns = [c.lower() for c in df.columns]
        date_col = next((c for c in df.columns if "date" in c), None)
        if date_col:
            df["date"] = pd.to_datetime(df[date_col]).dt.tz_localize(None)

        last_price = round(float(df["close"].iloc[-1]), 4)
        last_date = df["date"].iloc[-1].strftime("%Y-%m-%d")

        result: dict = {"lastPrice": last_price, "lastDate": last_date}

        if model in ("prophet", "both"):
            result["prophet"] = _run_prophet(df, ticker, days)

        if model in ("arima", "both"):
            result["arima"] = _run_arima(df, ticker, days)

        return result
    except Exception as e:
        logger.error(f"Forecast failed for {ticker}: {e}", exc_info=True)
        return {}


def _run_prophet(df: pd.DataFrame, ticker: str, days: int) -> dict:
    try:
        from prophet import Prophet
    except ImportError:
        return {"error": "Prophet not installed"}

    try:
        ts = df[["date", "close"]].rename(columns={"date": "ds", "close": "y"}).copy()
        ts["ds"] = pd.to_datetime(ts["ds"]).dt.tz_localize(None)

        m = Prophet(
            daily_seasonality=False,
            weekly_seasonality=True,
            yearly_seasonality=True,
            changepoint_prior_scale=0.05,
        )
        m.fit(ts)
        future = m.make_future_dataframe(periods=days)
        forecast = m.predict(future)

        last_ts = ts["ds"].iloc[-1]
        future_fc = forecast[forecast["ds"] > last_ts].head(days)

        points = []
        for _, row in future_fc.iterrows():
            points.append({
                "date": row["ds"].strftime("%Y-%m-%d"),
                "yhat": round(float(row["yhat"]), 4),
                "yhat_lower": round(float(row["yhat_lower"]), 4) if "yhat_lower" in row.index else None,
                "yhat_upper": round(float(row["yhat_upper"]), 4) if "yhat_upper" in row.index else None,
            })

        return {"ticker": ticker, "model": "prophet", "forecast": points}
    except Exception as e:
        logger.warning(f"Prophet failed for {ticker}: {e}")
        return {"error": str(e)}


def _run_arima(df: pd.DataFrame, ticker: str, days: int) -> dict:
    try:
        from statsmodels.tsa.arima.model import ARIMA
    except ImportError:
        return {"error": "statsmodels not installed"}

    try:
        series = df["close"].values.astype(float)
        model = ARIMA(series, order=(5, 1, 0))
        result = model.fit()
        fc = result.forecast(steps=days)

        last_date = pd.to_datetime(df["date"].iloc[-1])
        fc_dates = pd.bdate_range(start=last_date + timedelta(days=1), periods=days)

        points = [
            {
                "date": date.strftime("%Y-%m-%d"),
                "yhat": round(float(val), 4),
                "yhat_lower": None,
                "yhat_upper": None,
            }
            for date, val in zip(fc_dates, fc)
        ]

        return {"ticker": ticker, "model": "arima", "forecast": points}
    except Exception as e:
        logger.warning(f"ARIMA failed for {ticker}: {e}")
        return {"error": str(e)}
