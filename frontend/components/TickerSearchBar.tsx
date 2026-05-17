"use client";

import { useState, useRef } from "react";
import { useSearchStore } from "@/lib/store";

const POPULAR: { label: string; tickers: { name: string; ticker: string }[] }[] = [
  {
    label: "🇺🇸 미국 주요",
    tickers: [
      { name: "애플", ticker: "AAPL" },
      { name: "엔비디아", ticker: "NVDA" },
      { name: "마이크로소프트", ticker: "MSFT" },
      { name: "테슬라", ticker: "TSLA" },
      { name: "아마존", ticker: "AMZN" },
      { name: "구글", ticker: "GOOGL" },
      { name: "메타", ticker: "META" },
      { name: "팔란티어", ticker: "PLTR" },
    ],
  },
  {
    label: "🇰🇷 한국 주요",
    tickers: [
      { name: "삼성전자", ticker: "005930.KS" },
      { name: "SK하이닉스", ticker: "000660.KS" },
      { name: "NAVER", ticker: "035420.KS" },
      { name: "카카오", ticker: "035720.KS" },
      { name: "현대차", ticker: "005380.KS" },
      { name: "기아", ticker: "000270.KS" },
      { name: "한화에어로", ticker: "012450.KS" },
      { name: "셀트리온", ticker: "068270.KS" },
    ],
  },
  {
    label: "💰 암호화폐",
    tickers: [
      { name: "비트코인", ticker: "BTC-USD" },
      { name: "이더리움", ticker: "ETH-USD" },
      { name: "솔라나", ticker: "SOL-USD" },
      { name: "BNB", ticker: "BNB-USD" },
      { name: "XRP", ticker: "XRP-USD" },
    ],
  },
];

export function TickerSearchBar() {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const { setSearchTicker } = useSearchStore();
  const inputRef = useRef<HTMLInputElement>(null);

  function submit(ticker?: string) {
    const t = (ticker ?? input).trim().toUpperCase();
    if (!t) return;
    setSearchTicker(t);
    setInput("");
    setOpen(false);
  }

  return (
    <div className="relative">
      {/* 검색 입력창 */}
      <div className="flex items-center gap-1 border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--muted))] px-3 py-1.5">
        <svg className="w-3.5 h-3.5 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
          }}
          placeholder="ticker 검색 (AAPL, 005930.KS…)"
          className="bg-transparent text-xs font-mono text-foreground placeholder:text-muted-foreground outline-none w-44 sm:w-56"
        />
        {input && (
          <button
            onMouseDown={(e) => { e.preventDefault(); submit(); }}
            className="text-[10px] font-mono text-bull hover:text-foreground transition-colors"
          >
            분석 →
          </button>
        )}
      </div>

      {/* 드롭다운 */}
      {open && !input && (
        <div className="absolute top-full right-0 mt-1 w-72 sm:w-80 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg shadow-xl z-40 max-h-80 overflow-y-auto">
          {POPULAR.map((group) => (
            <div key={group.label}>
              <p className="px-3 py-2 text-[10px] font-mono text-muted-foreground uppercase tracking-wider border-b border-[hsl(var(--border))]">
                {group.label}
              </p>
              <div className="grid grid-cols-2">
                {group.tickers.map((t) => (
                  <button
                    key={t.ticker}
                    onMouseDown={() => submit(t.ticker)}
                    className="flex items-center justify-between px-3 py-2 text-xs font-mono hover:bg-[hsl(var(--muted))] transition-colors text-left"
                  >
                    <span className="text-foreground truncate">{t.name}</span>
                    <span className="text-muted-foreground ml-2 shrink-0">{t.ticker}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          <p className="px-3 py-2 text-[10px] text-muted-foreground font-mono border-t border-[hsl(var(--border))]">
            yfinance 지원 ticker 전부 검색 가능
          </p>
        </div>
      )}
    </div>
  );
}
