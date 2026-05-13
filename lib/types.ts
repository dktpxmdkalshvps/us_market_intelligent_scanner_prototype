// ── Stock & Theme Types ──────────────────────────────────────────────────────

export type ThemeKey =
  | "undervalued_growth"
  | "growth_momentum"
  | "safe_growth"
  | "deep_value"
  | "high_roe"
  | "breakout"
  | "bugatti"
  | "dividend"
  | "dividend_aristocrat";

export interface ThemeConfig {
  key: ThemeKey;
  label: string;
  shortLabel: string;
  description: string;
  criteria: string[];
  color: string;
  icon: string;
}

export interface StockInfo {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number;
  volume: number;
  // Quant metrics
  per?: number | null;
  peg?: number | null;
  pbr?: number | null;
  roe?: number | null;
  revenueGrowth?: number | null;
  operatingMargin?: number | null;
  debtToEquity?: number | null;
  dividendYield?: number | null;
  eps?: number | null;
  // Technical
  ma200?: number | null;
  ma50?: number | null;
  isAboveMa200?: boolean;
  // Risk flags
  isPennyStock?: boolean;
  isBankruptcyRisk?: boolean;
  isSmallCap?: boolean;
  riskScore: number; // 0-100
  // Theme-specific score
  themeScore: number;
}

export interface ThemeResponse {
  theme: ThemeKey;
  stocks: StockInfo[];
  totalCount: number;
  filteredCount: number;
  lastUpdated: string;
}

export interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface ExchangeRate {
  pair: string;
  rate: number;
  change: number;
}

export interface MarketBannerData {
  indices: MarketIndex[];
  exchangeRates: ExchangeRate[];
  lastUpdated: string;
}

export interface MarketCalendarEvent {
  date: string;
  type: "earnings" | "economic" | "holiday" | "fomc";
  title: string;
  tickers?: string[];
  importance: "high" | "medium" | "low";
}

export interface StockDetail extends StockInfo {
  description?: string;
  website?: string;
  employees?: number;
  founded?: string;
  chartData: ChartPoint[];
  financials: Financials;
}

export interface ChartPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ma50?: number;
  ma200?: number;
}

export interface Financials {
  revenue: QuarterlyData[];
  operatingIncome: QuarterlyData[];
  netIncome: QuarterlyData[];
  eps: QuarterlyData[];
}

export interface QuarterlyData {
  period: string;
  value: number;
  yoyChange?: number;
}

// ── API Response Wrapper ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  status: "ok" | "error";
  message?: string;
  cached: boolean;
  timestamp: string;
}

// ── Technical Analysis & Forecast Types ─────────────────────────────────────

export interface IndicatorPoint {
  date: string;
  close: number;
  volume: number;
  ma5?: number | null;
  ma20?: number | null;
  ma60?: number | null;
  bb_upper?: number | null;
  bb_lower?: number | null;
  bb_mid?: number | null;
  rsi?: number | null;
  macd?: number | null;
  macd_signal?: number | null;
  macd_hist?: number | null;
}

export interface SignalDetail {
  signal: "buy" | "sell" | "hold";
  description: string;
}

export interface TradingSignal {
  overall: "buy" | "sell" | "hold";
  buy_count: number;
  sell_count: number;
  details: SignalDetail[];
}

export interface TechnicalAnalysis {
  ticker: string;
  period: string;
  data: IndicatorPoint[];
  signal: TradingSignal;
  lastUpdated: string;
}

export interface ForecastPoint {
  date: string;
  yhat: number;
  yhat_lower?: number | null;
  yhat_upper?: number | null;
}

export interface ForecastModel {
  ticker: string;
  model: string;
  forecast: ForecastPoint[];
  error?: string;
}

export interface ForecastData {
  lastPrice: number;
  lastDate: string;
  prophet?: ForecastModel;
  arima?: ForecastModel;
}

// ── Sort / Filter State ─────────────────────────────────────────────────────

export type SortField =
  | "ticker"
  | "name"
  | "price"
  | "changePercent"
  | "marketCap"
  | "per"
  | "peg"
  | "roe"
  | "dividendYield"
  | "themeScore";

export type SortDirection = "asc" | "desc";

export interface TableState {
  sortField: SortField;
  sortDirection: SortDirection;
  searchQuery: string;
  sectorFilter: string;
  page: number;
  pageSize: number;
}
