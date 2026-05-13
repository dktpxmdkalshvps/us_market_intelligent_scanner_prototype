"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMarketBanner } from "@/lib/api";

export function MarketOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ["marketBanner"],
    queryFn: fetchMarketBanner,
    refetchInterval: 60 * 1000,
  });

  const indices = data?.indices ?? [
    { symbol: "S&P 500", name: "S&P 500", price: 5432.1, change: 12.3, changePercent: 0.23 },
    { symbol: "NASDAQ", name: "NASDAQ 100", price: 17123.45, change: -45.2, changePercent: -0.26 },
    { symbol: "DOW", name: "Dow Jones", price: 39234.56, change: 89.1, changePercent: 0.23 },
    { symbol: "VIX", name: "VIX", price: 14.32, change: -0.54, changePercent: -3.63 },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {indices.map((idx, i) => {
        const isUp = idx.changePercent >= 0;
        return (
          <div
            key={idx.symbol}
            className="card-dark p-4 space-y-1 animate-slide-up"
            style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
          >
            {isLoading ? (
              <>
                <div className="shimmer-bg h-3 w-20 rounded" />
                <div className="shimmer-bg h-6 w-28 rounded mt-1" />
              </>
            ) : (
              <>
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                  {idx.name}
                </p>
                <p className="font-display font-bold text-lg text-foreground">
                  {idx.price.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-mono font-semibold ${
                      isUp ? "text-bull" : "text-bear"
                    }`}
                  >
                    {isUp ? "▲" : "▼"} {Math.abs(idx.changePercent).toFixed(2)}%
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {isUp ? "+" : ""}
                    {idx.change.toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
