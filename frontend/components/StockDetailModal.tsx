"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchStockDetail, fetchTechnicalAnalysis, fetchForecast, formatMarketCap } from "@/lib/api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { TechnicalChart } from "./TechnicalChart";
import { ForecastChart } from "./ForecastChart";

interface Props {
  ticker: string;
  onClose: () => void;
}

const PERIODS = ["1mo", "3mo", "6mo", "1y", "2y"] as const;
type Period = (typeof PERIODS)[number];

type Tab = "overview" | "technical" | "forecast";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "개요" },
  { key: "technical", label: "기술분석" },
  { key: "forecast", label: "가격예측" },
];

export function StockDetailModal({ ticker, onClose }: Props) {
  const [period, setPeriod] = useState<Period>("1y");
  const [tab, setTab] = useState<Tab>("overview");

  const { data, isLoading } = useQuery({
    queryKey: ["stock", ticker, period],
    queryFn: () => fetchStockDetail(ticker, period),
  });

  const { data: technical, isLoading: techLoading } = useQuery({
    queryKey: ["technical", ticker, period],
    queryFn: () => fetchTechnicalAnalysis(ticker, period),
    enabled: tab === "technical",
  });

  const { data: forecast, isLoading: forecastLoading } = useQuery({
    queryKey: ["forecast", ticker],
    queryFn: () => fetchForecast(ticker, "both", 7),
    enabled: tab === "forecast",
  });

  const priceColor = data
    ? data.changePercent >= 0
      ? "#00d17a"
      : "#ff4757"
    : "#00d17a";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
          className="relative w-full sm:max-w-3xl max-h-[90vh] overflow-y-auto card-dark rounded-t-2xl sm:rounded-xl border border-[hsl(var(--border))] z-10"
        >
          {/* Header */}
          <div className="sticky top-0 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))] px-5 py-4 flex items-start justify-between">
            <div>
              {isLoading ? (
                <div className="space-y-1">
                  <div className="shimmer-bg h-6 w-24 rounded" />
                  <div className="shimmer-bg h-4 w-40 rounded" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <h2 className="font-display font-bold text-xl text-foreground">
                      {ticker}
                    </h2>
                    <span
                      className="text-lg font-mono font-bold"
                      style={{ color: priceColor }}
                    >
                      ${data?.price.toFixed(2)}
                    </span>
                    <span
                      className="text-sm font-mono font-semibold"
                      style={{ color: priceColor }}
                    >
                      {data?.changePercent && data.changePercent >= 0 ? "+" : ""}
                      {data?.changePercent?.toFixed(2)}%
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground font-mono mt-0.5">
                    {data?.name} · {data?.sector}
                  </p>
                </>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground text-xl leading-none transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* 탭 + 기간 선택 */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              {/* 탭 */}
              <div className="flex gap-1">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                      tab === t.key
                        ? "bg-[#58a6ff] text-[hsl(var(--background))] font-semibold"
                        : "text-muted-foreground border border-[hsl(var(--border))] hover:text-foreground"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* 기간 선택 (개요 + 기술분석 탭에서 사용) */}
              {tab !== "forecast" && (
                <div className="flex gap-1">
                  {PERIODS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                        period === p
                          ? "bg-bull text-[hsl(var(--background))] font-semibold"
                          : "text-muted-foreground border border-[hsl(var(--border))] hover:text-foreground"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── 개요 탭 ─────────────────────────────────────────────── */}
            {tab === "overview" && (
              <>
                {/* Price Chart */}
                <div className="h-52">
                  {isLoading ? (
                    <div className="shimmer-bg h-full rounded" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data?.chartData ?? []}>
                        <defs>
                          <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={priceColor} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={priceColor} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: "hsl(210 12% 52%)", fontFamily: "IBM Plex Mono" }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => {
                            const d = new Date(v);
                            return `${d.getMonth() + 1}/${d.getDate()}`;
                          }}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "hsl(210 12% 52%)", fontFamily: "IBM Plex Mono" }}
                          tickLine={false}
                          axisLine={false}
                          width={55}
                          tickFormatter={(v) => `$${v.toFixed(0)}`}
                          domain={["auto", "auto"]}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(220 14% 10%)",
                            border: "1px solid hsl(220 12% 18%)",
                            borderRadius: 6,
                            fontSize: 11,
                            fontFamily: "IBM Plex Mono",
                          }}
                          labelFormatter={(v) => new Date(v).toLocaleDateString("ko-KR")}
                          formatter={(v: number) => [`$${v.toFixed(2)}`, "종가"]}
                        />
                        <Area
                          type="monotone"
                          dataKey="close"
                          stroke={priceColor}
                          strokeWidth={1.5}
                          fill="url(#colorClose)"
                          dot={false}
                        />
                        {data?.chartData[0]?.ma50 && (
                          <Area
                            type="monotone"
                            dataKey="ma50"
                            stroke="#ffa502"
                            strokeWidth={1}
                            fill="none"
                            dot={false}
                            strokeDasharray="3 3"
                          />
                        )}
                        {data?.chartData[0]?.ma200 && (
                          <Area
                            type="monotone"
                            dataKey="ma200"
                            stroke="#1e90ff"
                            strokeWidth={1}
                            fill="none"
                            dot={false}
                            strokeDasharray="4 4"
                          />
                        )}
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                  <div className="flex gap-4 mt-1 text-[10px] font-mono text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-5 h-px bg-warn" style={{ display: "inline-block", verticalAlign: "middle" }} />
                      MA50
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-5 h-px bg-info" style={{ display: "inline-block", verticalAlign: "middle" }} />
                      MA200
                    </span>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "PER", value: data?.per?.toFixed(1) ?? "—" },
                    { label: "PEG", value: data?.peg?.toFixed(2) ?? "—" },
                    { label: "PBR", value: data?.pbr?.toFixed(2) ?? "—" },
                    { label: "ROE", value: data?.roe != null ? `${data.roe.toFixed(1)}%` : "—" },
                    { label: "영업이익률", value: data?.operatingMargin != null ? `${(data.operatingMargin * 100).toFixed(1)}%` : "—" },
                    { label: "매출성장률", value: data?.revenueGrowth != null ? `${(data.revenueGrowth * 100).toFixed(1)}%` : "—" },
                    { label: "부채비율", value: data?.debtToEquity?.toFixed(1) ?? "—" },
                    { label: "배당수익률", value: data?.dividendYield != null ? `${(data.dividendYield * 100).toFixed(2)}%` : "—" },
                  ].map((m) => (
                    <div key={m.label} className="bg-[hsl(var(--muted))] rounded p-3 space-y-1">
                      <p className="text-[10px] text-muted-foreground">{m.label}</p>
                      <p className="text-sm font-semibold font-mono text-foreground">{m.value}</p>
                    </div>
                  ))}
                </div>

                {/* Market Cap */}
                {data && (
                  <div className="flex items-center justify-between text-xs font-mono text-muted-foreground border-t border-[hsl(var(--border))] pt-3">
                    <span>시가총액: <span className="text-foreground font-semibold">{formatMarketCap(data.marketCap)}</span></span>
                    <span>거래량: <span className="text-foreground font-semibold">{data.volume.toLocaleString()}</span></span>
                    {data.website && (
                      <a href={data.website} target="_blank" rel="noopener noreferrer" className="text-bull hover:underline">
                        공식 웹사이트 →
                      </a>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ── 기술분석 탭 ─────────────────────────────────────────── */}
            {tab === "technical" && (
              <>
                {techLoading ? (
                  <div className="space-y-3">
                    {[200, 60, 80, 90].map((h, i) => (
                      <div key={i} className="shimmer-bg rounded" style={{ height: h }} />
                    ))}
                  </div>
                ) : technical ? (
                  <TechnicalChart analysis={technical} />
                ) : (
                  <p className="text-sm font-mono text-muted-foreground text-center py-8">
                    기술분석 데이터를 불러올 수 없습니다.
                  </p>
                )}
              </>
            )}

            {/* ── 가격예측 탭 ─────────────────────────────────────────── */}
            {tab === "forecast" && (
              <>
                {forecastLoading ? (
                  <div className="space-y-3">
                    <div className="shimmer-bg rounded" style={{ height: 240 }} />
                    <div className="shimmer-bg rounded" style={{ height: 160 }} />
                  </div>
                ) : forecast && data ? (
                  <ForecastChart
                    data={forecast}
                    historicalClose={data.chartData.map((d) => ({
                      date: d.date,
                      close: d.close,
                    }))}
                  />
                ) : (
                  <p className="text-sm font-mono text-muted-foreground text-center py-8">
                    예측 데이터를 불러올 수 없습니다.
                  </p>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
