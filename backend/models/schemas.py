from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime


class StockSchema(BaseModel):
    ticker: str
    name: str
    sector: str = ""
    industry: str = ""
    price: float
    change: float
    changePercent: float
    marketCap: float
    volume: int

    per: Optional[float] = None
    peg: Optional[float] = None
    pbr: Optional[float] = None
    roe: Optional[float] = None
    revenueGrowth: Optional[float] = None
    operatingMargin: Optional[float] = None
    debtToEquity: Optional[float] = None
    dividendYield: Optional[float] = None
    eps: Optional[float] = None

    ma50: Optional[float] = None
    ma200: Optional[float] = None
    isAboveMa200: bool = False

    isPennyStock: bool = False
    isBankruptcyRisk: bool = False
    isSmallCap: bool = False
    riskScore: int = 0
    themeScore: int = 0

    class Config:
        from_attributes = True


class ThemeResponseSchema(BaseModel):
    theme: str
    stocks: List[StockSchema]
    totalCount: int
    filteredCount: int
    lastUpdated: str


class MarketIndexSchema(BaseModel):
    symbol: str
    name: str
    price: float
    change: float
    changePercent: float


class ExchangeRateSchema(BaseModel):
    pair: str
    rate: float
    change: float


class MarketBannerSchema(BaseModel):
    indices: List[MarketIndexSchema]
    exchangeRates: List[ExchangeRateSchema]
    lastUpdated: str


class CalendarEventSchema(BaseModel):
    date: str
    type: str
    title: str
    tickers: Optional[List[str]] = None
    importance: str


class ChartPointSchema(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int
    ma50: Optional[float] = None
    ma200: Optional[float] = None


class QuarterlyDataSchema(BaseModel):
    period: str
    value: float
    yoyChange: Optional[float] = None


class FinancialsSchema(BaseModel):
    revenue: List[QuarterlyDataSchema] = []
    operatingIncome: List[QuarterlyDataSchema] = []
    netIncome: List[QuarterlyDataSchema] = []
    eps: List[QuarterlyDataSchema] = []


class StockDetailSchema(StockSchema):
    description: Optional[str] = None
    website: Optional[str] = None
    employees: Optional[int] = None
    chartData: List[ChartPointSchema] = []
    financials: FinancialsSchema = Field(default_factory=FinancialsSchema)


class ApiResponseSchema(BaseModel):
    data: Any
    status: str = "ok"
    message: Optional[str] = None
    cached: bool = False
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
