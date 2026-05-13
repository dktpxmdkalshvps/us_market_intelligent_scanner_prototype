"""
Stocks Router – /api/stocks/{ticker}
"""
import logging
from fastapi import APIRouter, HTTPException, Query

from ..core.cache import cache
from ..core.config import settings
from ..services.fetcher import (
    fetch_ticker_data,
    fetch_price_history,
    fetch_quarterly_financials,
)
from ..services.filters import annotate_risk_fields
from ..models.schemas import StockDetailSchema, ApiResponseSchema

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/{ticker}", response_model=ApiResponseSchema)
async def get_stock_detail(
    ticker: str,
    period: str = Query("1y", pattern="^(1mo|3mo|6mo|1y|2y|5y)$"),
):
    ticker = ticker.upper()
    cache_key = f"stock:{ticker}:{period}"

    cached = await cache.get(cache_key)
    if cached:
        return ApiResponseSchema(data=cached, cached=True)

    try:
        # Fetch base info
        info = fetch_ticker_data(ticker)
        if not info:
            raise HTTPException(status_code=404, detail=f"Ticker '{ticker}' not found")

        annotate_risk_fields(info)

        # Price history with MAs
        hist_df = fetch_price_history(ticker, period=period)
        chart_data = []
        if not hist_df.empty:
            for _, row in hist_df.iterrows():
                chart_data.append({
                    "date": row["date"],
                    "open": round(row["open"], 4),
                    "high": round(row["high"], 4),
                    "low": round(row["low"], 4),
                    "close": round(row["close"], 4),
                    "volume": int(row["volume"]),
                    "ma50": round(row["ma50"], 4) if row["ma50"] == row["ma50"] else None,
                    "ma200": round(row["ma200"], 4) if row["ma200"] == row["ma200"] else None,
                })
            # Populate MA fields on stock
            if chart_data:
                latest = chart_data[-1]
                info["ma50"] = latest.get("ma50")
                info["ma200"] = latest.get("ma200")
                info["is_above_ma200"] = (
                    latest["close"] > latest["ma200"]
                    if latest.get("ma200") else False
                )

        # Quarterly financials
        financials = fetch_quarterly_financials(ticker)

        payload = StockDetailSchema(
            ticker=ticker,
            name=info.get("name", ticker),
            sector=info.get("sector", ""),
            industry=info.get("industry", ""),
            price=info.get("price", 0),
            change=info.get("change", 0),
            changePercent=info.get("change_percent", 0),
            marketCap=info.get("market_cap", 0),
            volume=info.get("volume", 0),
            per=info.get("per"),
            peg=info.get("peg"),
            pbr=info.get("pbr"),
            roe=info.get("roe"),
            revenueGrowth=info.get("revenue_growth"),
            operatingMargin=info.get("operating_margin"),
            debtToEquity=info.get("debt_to_equity"),
            dividendYield=info.get("dividend_yield"),
            eps=info.get("eps"),
            ma50=info.get("ma50"),
            ma200=info.get("ma200"),
            isAboveMa200=info.get("is_above_ma200", False),
            isPennyStock=info.get("is_penny_stock", False),
            isBankruptcyRisk=info.get("is_bankruptcy_risk", False),
            isSmallCap=info.get("is_small_cap", False),
            riskScore=info.get("risk_score", 0),
            themeScore=0,
            description=info.get("description", ""),
            website=info.get("website", ""),
            employees=info.get("employees"),
            chartData=chart_data,
            financials=financials,
        )

        await cache.set(cache_key, payload.model_dump(), ttl=settings.CACHE_TTL_STOCK)
        return ApiResponseSchema(data=payload.model_dump(), cached=False)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Stock detail error ({ticker}): {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch stock detail")
