import axios from "axios";
import type {
  ApiResponse,
  ThemeKey,
  ThemeResponse,
  MarketBannerData,
  MarketCalendarEvent,
  StockDetail,
  TechnicalAnalysis,
  ForecastData,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "/api";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Theme API ───────────────────────────────────────────────────────────────

export async function fetchThemeStocks(
  themeKey: ThemeKey,
  signal?: AbortSignal
): Promise<ThemeResponse> {
  const { data } = await apiClient.get<ApiResponse<ThemeResponse>>(
    `/theme/${themeKey}`,
    { signal }
  );
  return data.data;
}

// ── Market API ──────────────────────────────────────────────────────────────

export async function fetchMarketBanner(): Promise<MarketBannerData> {
  const { data } = await apiClient.get<ApiResponse<MarketBannerData>>(
    "/market/banner"
  );
  return data.data;
}

export async function fetchMarketCalendar(
  days: number = 7
): Promise<MarketCalendarEvent[]> {
  const { data } = await apiClient.get<ApiResponse<MarketCalendarEvent[]>>(
    `/market/calendar?days=${days}`
  );
  return data.data;
}

// ── Stock API ───────────────────────────────────────────────────────────────

export async function fetchStockDetail(
  ticker: string,
  period: string = "1y"
): Promise<StockDetail> {
  const { data } = await apiClient.get<ApiResponse<StockDetail>>(
    `/stocks/${ticker}?period=${period}`
  );
  return data.data;
}

// ── Analysis API ────────────────────────────────────────────────────────────

export async function fetchTechnicalAnalysis(
  ticker: string,
  period: string = "6mo"
): Promise<TechnicalAnalysis> {
  const { data } = await apiClient.get<ApiResponse<TechnicalAnalysis>>(
    `/analysis/${ticker}/technical?period=${period}`
  );
  return data.data;
}

export async function fetchForecast(
  ticker: string,
  model: "prophet" | "arima" | "both" = "both",
  days: number = 7
): Promise<ForecastData> {
  const { data } = await apiClient.get<ApiResponse<ForecastData>>(
    `/analysis/${ticker}/forecast?model=${model}&days=${days}`
  );
  return data.data;
}

// ── Utility ─────────────────────────────────────────────────────────────────

export function formatMarketCap(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toLocaleString()}`;
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function formatNumber(
  value: number | null | undefined,
  decimals = 2
): string {
  if (value == null) return "—";
  return value.toFixed(decimals);
}
