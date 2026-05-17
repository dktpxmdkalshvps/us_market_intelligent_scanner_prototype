"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchThemeStocks, formatMarketCap, formatPercent, formatNumber } from "@/lib/api";
import { useTableStore } from "@/lib/store";
import { THEMES } from "@/lib/themes";
import type { ThemeKey, StockInfo, SortField } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { StockDetailModal } from "./StockDetailModal";

interface StockTableProps {
  themeKey: ThemeKey;
}

const COLUMNS: { key: SortField; label: string; align?: "right" }[] = [
  { key: "ticker", label: "티커" },
  { key: "name", label: "종목명" },
  { key: "price", label: "현재가", align: "right" },
  { key: "changePercent", label: "등락률", align: "right" },
  { key: "marketCap", label: "시가총액", align: "right" },
  { key: "per", label: "PER", align: "right" },
  { key: "peg", label: "PEG", align: "right" },
  { key: "roe", label: "ROE%", align: "right" },
  { key: "themeScore", label: "점수", align: "right" },
];

function SortIcon({ field, active, direction }: { field: SortField; active: boolean; direction: "asc" | "desc" }) {
  if (!active) return <span className="text-[hsl(var(--border))] text-[10px]">⇅</span>;
  return <span className="text-bull text-[10px]">{direction === "asc" ? "↑" : "↓"}</span>;
}

function RiskBadge({ stock }: { stock: StockInfo }) {
  if (stock.riskScore >= 70) return (
    <span className="inline-block w-2 h-2 rounded-full bg-bear" title="고위험" />
  );
  if (stock.riskScore >= 40) return (
    <span className="inline-block w-2 h-2 rounded-full bg-warn" title="중위험" />
  );
  return (
    <span className="inline-block w-2 h-2 rounded-full bg-bull" title="저위험" />
  );
}

export function StockTable({ themeKey }: StockTableProps) {
  const theme = THEMES[themeKey];
  const { sortField, sortDirection, toggleSort, searchQuery, setSearchQuery, page, pageSize, setPage } = useTableStore();
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["theme", themeKey],
    queryFn: () => fetchThemeStocks(themeKey),
    staleTime: 5 * 60 * 1000,
  });

  const stocks = data?.stocks ?? [];

  // Client-side filter + sort
  const filtered = stocks
    .filter((s) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const av = a[sortField as keyof StockInfo];
      const bv = b[sortField as keyof StockInfo];
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDirection === "asc" ? cmp : -cmp;
    });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  if (isLoading) return <TableSkeleton />;

  if (isError) {
    return (
      <div className="card-dark p-8 text-center">
        <p className="text-bear font-mono text-sm">데이터를 불러오는 중 오류가 발생했습니다.</p>
        <p className="text-muted-foreground text-xs mt-1 font-mono">잠시 후 다시 시도해주세요.</p>
      </div>
    );
  }

  return (
    <>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="티커 또는 종목명 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 px-3 bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded text-xs font-mono text-foreground placeholder:text-muted-foreground outline-none focus:border-[hsl(var(--muted-foreground))] w-48"
          />
          {isFetching && (
            <span className="text-[10px] text-muted-foreground font-mono animate-pulse">업데이트 중...</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <span>총 {filtered.length}개 종목</span>
          {data?.filteredCount && (
            <span className="text-[10px]">
              (필터 전 {data.filteredCount}개)
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card-dark overflow-x-auto">
        <table className="w-full text-xs font-mono min-w-[700px]">
          <thead>
            <tr className="border-b border-[hsl(var(--border))]">
              <th className="w-6 px-3 py-2.5" />
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-2.5 text-muted-foreground font-medium cursor-pointer select-none hover:text-foreground transition-colors ${col.align === "right" ? "text-right" : "text-left"}`}
                  onClick={() => toggleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    <SortIcon
                      field={col.key}
                      active={sortField === col.key}
                      direction={sortDirection}
                    />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="wait">
              {paged.map((stock, i) => (
                <motion.tr
                  key={stock.ticker}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-[hsl(var(--border))]/50 table-row-hover cursor-pointer"
                  onClick={() => setSelectedTicker(stock.ticker)}
                >
                  <td className="px-3 py-2.5">
                    <RiskBadge stock={stock} />
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-foreground">{stock.ticker}</td>
                  <td className="px-3 py-2.5 max-w-[160px] truncate text-muted-foreground">
                    {stock.name}
                  </td>
                  <td className="px-3 py-2.5 text-right text-foreground">
                    ${stock.price.toFixed(2)}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-semibold ${stock.changePercent >= 0 ? "text-bull" : "text-bear"}`}>
                    {formatPercent(stock.changePercent)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-muted-foreground">
                    {formatMarketCap(stock.marketCap)}
                  </td>
                  <td className="px-3 py-2.5 text-right">{formatNumber(stock.per)}</td>
                  <td className="px-3 py-2.5 text-right" style={{ color: stock.peg && stock.peg < 1 ? theme.color : undefined }}>
                    {formatNumber(stock.peg)}
                  </td>
                  <td className="px-3 py-2.5 text-right" style={{ color: stock.roe && stock.roe > 15 ? theme.color : undefined }}>
                    {stock.roe != null ? `${stock.roe.toFixed(1)}%` : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span
                      className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-[hsl(var(--background))]"
                      style={{ backgroundColor: theme.color }}
                    >
                      {stock.themeScore}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
            {paged.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-12 text-center text-muted-foreground">
                  조건에 맞는 종목이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1">
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-7 h-7 rounded text-xs font-mono transition-colors ${
                p === page
                  ? "text-[hsl(var(--background))] font-bold"
                  : "text-muted-foreground hover:text-foreground border border-[hsl(var(--border))]"
              }`}
              style={p === page ? { backgroundColor: theme.color } : {}}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {selectedTicker && (
        <StockDetailModal
          ticker={selectedTicker}
          onClose={() => setSelectedTicker(null)}
        />
      )}
    </>
  );
}

function TableSkeleton() {
  return (
    <div className="card-dark overflow-hidden">
      <div className="shimmer-bg h-10 border-b border-[hsl(var(--border))]" />
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="shimmer-bg h-10 border-b border-[hsl(var(--border))]/50" />
      ))}
    </div>
  );
}
