"use client";

import { Suspense } from "react";
import { MarketBanner } from "@/components/MarketBanner";
import { ThemeSelector } from "@/components/ThemeSelector";
import { StockTable } from "@/components/StockTable";
import { MarketCalendar } from "@/components/MarketCalendar";
import { MarketOverview } from "@/components/MarketOverview";
import { useThemeStore } from "@/lib/store";
import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardPage() {
  const { activeTheme } = useThemeStore();

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Top Ticker Banner ── */}
      <Suspense fallback={<div className="h-9 shimmer-bg" />}>
        <MarketBanner />
      </Suspense>

      {/* ── Header ── */}
      <header className="border-b border-[hsl(var(--border))] px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-bull flex items-center justify-center">
            <span className="text-[hsl(var(--background))] text-xs font-bold font-display">Q</span>
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-foreground">
            Quant<span className="text-bull">Screen</span>
          </span>
          <span className="hidden md:block text-xs text-muted-foreground font-mono border border-[hsl(var(--border))] px-2 py-0.5 rounded">
            BETA
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground font-mono hidden sm:block">
            Last updated: {new Date().toLocaleString("ko-KR", { timeZone: "America/New_York" })} ET
          </span>
          <div className="w-2 h-2 rounded-full bg-bull animate-pulse-slow" title="Live" />
        </div>
      </header>

      <main className="flex-1 px-4 md:px-8 py-6 space-y-6">
        {/* ── Market Overview Row ── */}
        <Suspense fallback={<div className="h-24 shimmer-bg rounded-lg" />}>
          <MarketOverview />
        </Suspense>

        {/* ── Main Content Grid ── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6">
          {/* Left: Theme + Table */}
          <div className="space-y-4">
            <ThemeSelector />
            <Suspense fallback={<Skeleton rows={10} />}>
              <StockTable themeKey={activeTheme} />
            </Suspense>
          </div>

          {/* Right: Calendar + Info Panel */}
          <div className="space-y-4">
            <Suspense fallback={<div className="h-64 shimmer-bg rounded-lg" />}>
              <MarketCalendar />
            </Suspense>
            <RiskGuardInfo />
          </div>
        </div>
      </main>

      <footer className="border-t border-[hsl(var(--border))] px-4 md:px-8 py-4 flex items-center justify-between text-xs text-muted-foreground font-mono">
        <span>QuantScreen © 2025 · 투자 참고용 데이터, 투자 손익의 책임은 본인에게 있습니다.</span>
        <span className="hidden sm:block">Data: Yahoo Finance · yfinance</span>
      </footer>
    </div>
  );
}

function RiskGuardInfo() {
  return (
    <div className="card-dark p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-warn text-sm">⚠</span>
        <h3 className="text-sm font-display font-semibold text-foreground">리스크 가드 필터</h3>
      </div>
      <div className="space-y-2 text-xs font-mono text-muted-foreground">
        {[
          { label: "Penny Stock 제외", desc: "주가 $1.00 미만 종목" },
          { label: "소형주 제외", desc: "시가총액 $50M 미만" },
          { label: "파산위험 제외", desc: ".Q/.E 티커 심볼" },
        ].map((item) => (
          <div key={item.label} className="flex items-start gap-2 p-2 bg-[hsl(var(--muted))] rounded">
            <span className="text-bull mt-0.5">✓</span>
            <div>
              <p className="text-foreground font-semibold">{item.label}</p>
              <p className="text-[10px]">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
