"use client";

import {
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import type { TechnicalAnalysis, IndicatorPoint, TradingSignal } from "@/lib/types";

interface Props {
  analysis: TechnicalAnalysis;
}

const COLORS = {
  close: "#e6edf3",
  ma5: "#58a6ff",
  ma20: "#f0883e",
  ma60: "#bc8cff",
  bb: "#58a6ff",
  rsi: "#f0883e",
  macd: "#58a6ff",
  signal: "#f85149",
  bull: "#3fb950",
  bear: "#f85149",
  hold: "#d2993e",
  grid: "#21262d",
  muted: "#8b949e",
};

const tickStyle = {
  fontSize: 10,
  fill: COLORS.muted,
  fontFamily: "IBM Plex Mono",
};

const tooltipStyle = {
  background: "hsl(220 14% 10%)",
  border: "1px solid hsl(220 12% 18%)",
  borderRadius: 6,
  fontSize: 11,
  fontFamily: "IBM Plex Mono",
};

function formatDate(v: string) {
  const d = new Date(v);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function processData(data: IndicatorPoint[]) {
  return data.map((d) => ({
    ...d,
    bb_band_base: d.bb_lower ?? undefined,
    bb_band_height:
      d.bb_upper != null && d.bb_lower != null
        ? d.bb_upper - d.bb_lower
        : undefined,
  }));
}

const SIGNAL_LABEL: Record<string, string> = {
  buy: "매수",
  sell: "매도",
  hold: "중립",
};

function SignalBadge({ signal }: { signal: "buy" | "sell" | "hold" }) {
  const styles: Record<string, string> = {
    buy: "bg-[rgba(63,185,80,0.15)] text-[#3fb950] border border-[#3fb950]",
    sell: "bg-[rgba(248,81,73,0.15)] text-[#f85149] border border-[#f85149]",
    hold: "bg-[rgba(210,153,34,0.15)] text-[#d2993e] border border-[#d2993e]",
  };
  return (
    <span
      className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold font-mono ${styles[signal]}`}
    >
      {SIGNAL_LABEL[signal]}
    </span>
  );
}

export function TechnicalChart({ analysis }: Props) {
  const { data, signal } = analysis;
  const processed = processData(data);

  const lastClose = data[data.length - 1]?.close ?? 0;
  const lastRsi = data[data.length - 1]?.rsi;
  const lastMacd = data[data.length - 1]?.macd;

  return (
    <div className="space-y-4">
      {/* 트레이딩 시그널 */}
      <TradingSignalPanel signal={signal} />

      {/* 가격 + MA + 볼린저 */}
      <div className="space-y-1">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest border-l-2 border-[#58a6ff] pl-2">
          가격 · 이동평균 · 볼린저밴드
        </p>
        <div className="flex gap-3 text-[10px] font-mono text-muted-foreground mb-1 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-px bg-[#e6edf3]" />Close
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-px bg-[#58a6ff]" />MA5
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-px bg-[#f0883e]" />MA20
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-px bg-[#bc8cff]" />MA60
          </span>
        </div>
        <ResponsiveContainer width="100%" height={200} >
          <ComposedChart data={processed} syncId="tech" margin={{ left: 0, right: 8 }}>
            <XAxis
              dataKey="date"
              tick={tickStyle}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatDate}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={tickStyle}
              tickLine={false}
              axisLine={false}
              width={55}
              tickFormatter={(v) => `$${v.toFixed(0)}`}
              domain={["auto", "auto"]}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={(v) => new Date(v as string).toLocaleDateString("ko-KR")}
              formatter={(v: number, name: string) => {
                const labels: Record<string, string> = {
                  close: "종가",
                  ma5: "MA5",
                  ma20: "MA20",
                  ma60: "MA60",
                };
                return [`$${v?.toFixed(2)}`, labels[name] ?? name];
              }}
            />
            {/* 볼린저 밴드 채우기 (스택 영역) */}
            <Area
              type="monotone"
              dataKey="bb_band_base"
              stackId="bb"
              stroke="none"
              fill="none"
              dot={false}
              legendType="none"
            />
            <Area
              type="monotone"
              dataKey="bb_band_height"
              stackId="bb"
              stroke="none"
              fill="rgba(88,166,255,0.07)"
              dot={false}
              legendType="none"
            />
            {/* 볼린저 밴드 선 */}
            <Line
              type="monotone"
              dataKey="bb_upper"
              stroke={COLORS.bb}
              strokeWidth={0.8}
              strokeDasharray="3 3"
              dot={false}
              legendType="none"
            />
            <Line
              type="monotone"
              dataKey="bb_lower"
              stroke={COLORS.bb}
              strokeWidth={0.8}
              strokeDasharray="3 3"
              dot={false}
              legendType="none"
            />
            {/* 이동평균선 */}
            <Line type="monotone" dataKey="ma5" stroke={COLORS.ma5} strokeWidth={1.2} dot={false} />
            <Line type="monotone" dataKey="ma20" stroke={COLORS.ma20} strokeWidth={1.2} dot={false} />
            <Line type="monotone" dataKey="ma60" stroke={COLORS.ma60} strokeWidth={1.2} dot={false} />
            {/* 종가 */}
            <Line
              type="monotone"
              dataKey="close"
              stroke={COLORS.close}
              strokeWidth={1.5}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 거래량 */}
      <div className="space-y-1">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest border-l-2 border-[#58a6ff] pl-2">
          거래량
        </p>
        <ResponsiveContainer width="100%" height={60}>
          <ComposedChart data={processed} syncId="tech" margin={{ left: 0, right: 8 }}>
            <XAxis dataKey="date" hide />
            <YAxis
              tick={tickStyle}
              tickLine={false}
              axisLine={false}
              width={55}
              tickFormatter={(v) =>
                v >= 1e9 ? `${(v / 1e9).toFixed(1)}B` : v >= 1e6 ? `${(v / 1e6).toFixed(0)}M` : `${v}`
              }
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={(v) => new Date(v as string).toLocaleDateString("ko-KR")}
              formatter={(v: number) => [v.toLocaleString(), "거래량"]}
            />
            <Bar dataKey="volume" maxBarSize={4}>
              {processed.map((d, i) => {
                const prev = i > 0 ? processed[i - 1].close : d.close;
                return (
                  <Cell
                    key={`vol-${i}`}
                    fill={d.close >= prev ? COLORS.bull : COLORS.bear}
                    fillOpacity={0.7}
                  />
                );
              })}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* RSI */}
      <div className="space-y-1">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest border-l-2 border-[#58a6ff] pl-2">
          RSI (14){lastRsi != null && (
            <span className="ml-2 text-foreground">{lastRsi.toFixed(1)}</span>
          )}
        </p>
        <ResponsiveContainer width="100%" height={80}>
          <ComposedChart data={processed} syncId="tech" margin={{ left: 0, right: 8 }}>
            <XAxis dataKey="date" hide />
            <YAxis
              tick={tickStyle}
              tickLine={false}
              axisLine={false}
              width={55}
              domain={[0, 100]}
              ticks={[0, 30, 70, 100]}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={(v) => new Date(v as string).toLocaleDateString("ko-KR")}
              formatter={(v: number) => [v.toFixed(1), "RSI"]}
            />
            <ReferenceLine y={70} stroke={COLORS.bear} strokeDasharray="3 3" strokeOpacity={0.6} />
            <ReferenceLine y={30} stroke={COLORS.bull} strokeDasharray="3 3" strokeOpacity={0.6} />
            <Line
              type="monotone"
              dataKey="rsi"
              stroke={COLORS.rsi}
              strokeWidth={1.5}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* MACD */}
      <div className="space-y-1">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest border-l-2 border-[#58a6ff] pl-2">
          MACD{lastMacd != null && (
            <span className="ml-2 text-foreground">{lastMacd.toFixed(4)}</span>
          )}
        </p>
        <div className="flex gap-3 text-[10px] font-mono text-muted-foreground mb-1">
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-px bg-[#58a6ff]" />MACD
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-px bg-[#f85149]" />Signal
          </span>
        </div>
        <ResponsiveContainer width="100%" height={90}>
          <ComposedChart data={processed} syncId="tech" margin={{ left: 0, right: 8 }}>
            <XAxis
              dataKey="date"
              tick={tickStyle}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatDate}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={tickStyle}
              tickLine={false}
              axisLine={false}
              width={55}
              tickFormatter={(v) => v.toFixed(2)}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={(v) => new Date(v as string).toLocaleDateString("ko-KR")}
              formatter={(v: number, name: string) => {
                const labels: Record<string, string> = {
                  macd: "MACD",
                  macd_signal: "Signal",
                  macd_hist: "Histogram",
                };
                return [v?.toFixed(4), labels[name] ?? name];
              }}
            />
            <ReferenceLine y={0} stroke={COLORS.grid} />
            <Bar dataKey="macd_hist" maxBarSize={4}>
              {processed.map((d, i) => (
                <Cell
                  key={`hist-${i}`}
                  fill={(d.macd_hist ?? 0) >= 0 ? COLORS.bull : COLORS.bear}
                  fillOpacity={0.7}
                />
              ))}
            </Bar>
            <Line type="monotone" dataKey="macd" stroke={COLORS.macd} strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="macd_signal" stroke={COLORS.signal} strokeWidth={1.5} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TradingSignalPanel({ signal }: { signal: TradingSignal }) {
  const overall = signal.overall;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* 종합 판단 */}
      <div className="bg-[hsl(var(--muted))] rounded-lg p-4 flex flex-col items-center justify-center gap-2">
        <p className="text-[10px] font-mono text-muted-foreground">종합 판단</p>
        <SignalBadge signal={overall} />
        <p className="text-[10px] font-mono text-muted-foreground">
          매수 {signal.buy_count}개 · 매도 {signal.sell_count}개
        </p>
      </div>

      {/* 세부 신호 */}
      <div className="bg-[hsl(var(--muted))] rounded-lg overflow-hidden">
        <table className="w-full text-xs font-mono">
          <tbody>
            {signal.details.map((d, i) => (
              <tr key={i} className="border-t border-[hsl(var(--border))] first:border-0">
                <td className="px-3 py-1.5 w-20">
                  <SignalBadge signal={d.signal} />
                </td>
                <td className="px-3 py-1.5 text-muted-foreground">{d.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
