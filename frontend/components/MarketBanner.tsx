"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMarketBanner } from "@/lib/api";

function TickerItem({
  symbol,
  price,
  changePercent,
}: {
  symbol: string;
  price: number;
  changePercent: number;
}) {
  const isUp = changePercent >= 0;
  return (
    <span className="inline-flex items-center gap-2 px-4">
      <span className="text-muted-foreground text-[11px] font-mono">{symbol}</span>
      <span className="text-foreground text-[11px] font-mono font-semibold">
        ${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      <span
        className={`text-[11px] font-mono font-semibold ${isUp ? "text-bull" : "text-bear"}`}
      >
        {isUp ? "▲" : "▼"} {Math.abs(changePercent).toFixed(2)}%
      </span>
      <span className="text-[hsl(var(--border))]">·</span>
    </span>
  );
}

const PLACEHOLDER_DATA = {
  indices: [
    { symbol: "S&P 500", name: "S&P 500", price: 5432.1, change: 12.3, changePercent: 0.23 },
    { symbol: "NASDAQ", name: "NASDAQ", price: 17123.45, change: -45.2, changePercent: -0.26 },
    { symbol: "DOW", name: "Dow Jones", price: 39234.56, change: 89.1, changePercent: 0.23 },
    { symbol: "VIX", name: "VIX", price: 14.32, change: -0.54, changePercent: -3.63 },
  ],
  exchangeRates: [
    { pair: "USD/KRW", rate: 1342.5, change: -2.3 },
    { pair: "USD/JPY", rate: 149.23, change: 0.12 },
  ],
  lastUpdated: new Date().toISOString(),
};

export function MarketBanner() {
  const { data } = useQuery({
    queryKey: ["marketBanner"],
    queryFn: fetchMarketBanner,
    refetchInterval: 60 * 1000, // refetch every minute
    placeholderData: PLACEHOLDER_DATA,
  });

  const items = [
    ...(data?.indices ?? []),
  ];

  const rateItems = data?.exchangeRates ?? PLACEHOLDER_DATA.exchangeRates;

  return (
    <div className="h-9 bg-[hsl(var(--muted))] border-b border-[hsl(var(--border))] flex items-center overflow-hidden relative">
      {/* Static FX rates on the right */}
      <div className="hidden md:flex items-center border-l border-[hsl(var(--border))] px-3 gap-3 shrink-0 ml-auto z-10 bg-[hsl(var(--muted))]">
        {rateItems.map((rate) => (
          <span key={rate.pair} className="flex items-center gap-1 text-[11px] font-mono">
            <span className="text-muted-foreground">{rate.pair}</span>
            <span className="text-foreground font-semibold">{rate.rate.toLocaleString()}</span>
          </span>
        ))}
      </div>

      {/* Scrolling ticker */}
      <div className="flex-1 overflow-hidden">
        <div className="ticker-tape">
          {[...items, ...items].map((item, i) => (
            <TickerItem
              key={`${item.symbol}-${i}`}
              symbol={item.symbol}
              price={item.price}
              changePercent={item.changePercent}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
