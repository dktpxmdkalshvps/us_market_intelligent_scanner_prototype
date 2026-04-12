"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMarketCalendar } from "@/lib/api";
import type { MarketCalendarEvent } from "@/lib/types";

const TYPE_CONFIG = {
  earnings: { label: "실적", color: "#00d17a", bg: "rgba(0,209,122,0.1)" },
  economic: { label: "경제지표", color: "#1e90ff", bg: "rgba(30,144,255,0.1)" },
  holiday: { label: "휴장", color: "#ffa502", bg: "rgba(255,165,2,0.1)" },
  fomc: { label: "FOMC", color: "#ff6b81", bg: "rgba(255,107,129,0.1)" },
};

const IMPORTANCE_DOT: Record<string, string> = {
  high: "bg-bear",
  medium: "bg-warn",
  low: "bg-muted-foreground",
};

const PLACEHOLDER: MarketCalendarEvent[] = [
  {
    date: new Date(Date.now() + 1 * 86400000).toISOString().split("T")[0],
    type: "earnings",
    title: "NVDA 실적 발표",
    tickers: ["NVDA"],
    importance: "high",
  },
  {
    date: new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0],
    type: "economic",
    title: "CPI 소비자물가 발표",
    importance: "high",
  },
  {
    date: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
    type: "earnings",
    title: "AAPL, MSFT 실적",
    tickers: ["AAPL", "MSFT"],
    importance: "high",
  },
  {
    date: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0],
    type: "fomc",
    title: "FOMC 의사록 공개",
    importance: "high",
  },
  {
    date: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    type: "economic",
    title: "비농업 고용지수 (NFP)",
    importance: "high",
  },
];

function groupByDate(events: MarketCalendarEvent[]) {
  return events.reduce(
    (acc, evt) => {
      if (!acc[evt.date]) acc[evt.date] = [];
      acc[evt.date].push(evt);
      return acc;
    },
    {} as Record<string, MarketCalendarEvent[]>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const label = `${d.getMonth() + 1}/${d.getDate()} (${weekdays[d.getDay()]})`;
  if (diff === 0) return { label, badge: "TODAY", badgeClass: "text-bull" };
  if (diff === 1) return { label, badge: "내일", badgeClass: "text-warn" };
  return { label, badge: `D-${diff}`, badgeClass: "text-muted-foreground" };
}

export function MarketCalendar() {
  const { data, isLoading } = useQuery({
    queryKey: ["marketCalendar"],
    queryFn: () => fetchMarketCalendar(10),
    placeholderData: PLACEHOLDER,
  });

  const events = data ?? PLACEHOLDER;
  const grouped = groupByDate(events);
  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="card-dark overflow-hidden">
      <div className="px-4 py-3 border-b border-[hsl(var(--border))] flex items-center gap-2">
        <span className="text-sm">📅</span>
        <h3 className="text-sm font-display font-semibold text-foreground">
          증시 캘린더
        </h3>
      </div>

      <div className="divide-y divide-[hsl(var(--border))]">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-4 py-3 shimmer-bg h-16" />
            ))
          : sortedDates.map((date) => {
              const { label, badge, badgeClass } = formatDate(date);
              const dayEvents = grouped[date];
              return (
                <div key={date} className="px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {label}
                    </span>
                    <span className={`text-[10px] font-mono font-bold ${badgeClass}`}>
                      {badge}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {dayEvents.map((evt, i) => {
                      const cfg = TYPE_CONFIG[evt.type];
                      return (
                        <div
                          key={i}
                          className="flex items-start gap-2 p-2 rounded text-xs font-mono"
                          style={{ backgroundColor: cfg.bg }}
                        >
                          <span
                            className={`shrink-0 w-2 h-2 mt-0.5 rounded-full ${IMPORTANCE_DOT[evt.importance]}`}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-foreground leading-snug">{evt.title}</p>
                            {evt.tickers && (
                              <p className="text-[10px] mt-0.5" style={{ color: cfg.color }}>
                                {evt.tickers.join(" · ")}
                              </p>
                            )}
                          </div>
                          <span
                            className="shrink-0 text-[10px] font-bold"
                            style={{ color: cfg.color }}
                          >
                            {cfg.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}
