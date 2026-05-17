"use client";

import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import type { ForecastData } from "@/lib/types";

interface Props {
  data: ForecastData;
  historicalClose: { date: string; close: number }[];
}

const COLORS = {
  historical: "#58a6ff",
  prophet: "#f0883e",
  arima: "#bc8cff",
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

export function ForecastChart({ data, historicalClose }: Props) {
  const { prophet, arima, lastDate, lastPrice } = data;

  // 최근 60일 이력 데이터
  const recent = historicalClose.slice(-60);

  type ChartRow = {
    date: string;
    close: number | null;
    prophet_yhat: number | null;
    prophet_lower: number | null;
    prophet_upper: number | null;
    arima_yhat: number | null;
  };

  const prophetMap = new Map(
    prophet?.forecast?.map((p) => [
      p.date,
      { yhat: p.yhat, lower: p.yhat_lower, upper: p.yhat_upper },
    ]) ?? []
  );
  const arimaMap = new Map(arima?.forecast?.map((a) => [a.date, a.yhat]) ?? []);

  const forecastDates = Array.from(
    new Set([
      ...(prophet?.forecast?.map((p) => p.date) ?? []),
      ...(arima?.forecast?.map((a) => a.date) ?? []),
    ])
  ).sort();

  const chartData: ChartRow[] = [
    ...recent.map((d) => ({
      date: d.date,
      close: d.close,
      prophet_yhat: d.date === lastDate ? lastPrice : null,
      prophet_lower: d.date === lastDate ? lastPrice : null,
      prophet_upper: d.date === lastDate ? lastPrice : null,
      arima_yhat: d.date === lastDate ? lastPrice : null,
    })),
    ...forecastDates.map((date) => {
      const p = prophetMap.get(date);
      const a = arimaMap.get(date);
      return {
        date,
        close: null,
        prophet_yhat: p?.yhat ?? null,
        prophet_lower: p?.lower ?? null,
        prophet_upper: p?.upper != null && p?.lower != null ? p.upper - p.lower : null,
        arima_yhat: a ?? null,
      };
    }),
  ];

  // 예측 수치 테이블
  const prophetRows = prophet?.forecast ?? [];
  const arimaRows = arima?.forecast ?? [];
  const maxRows = Math.max(prophetRows.length, arimaRows.length);

  return (
    <div className="space-y-4">
      {/* 차트 */}
      <div className="space-y-1">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest border-l-2 border-[#58a6ff] pl-2">
          향후 7일 가격 예측
        </p>
        <div className="flex gap-4 text-[10px] font-mono text-muted-foreground mb-1 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-px bg-[#58a6ff]" />실제 가격
          </span>
          {prophet && !prophet.error && (
            <span className="flex items-center gap-1">
              <span className="inline-block w-4 h-px border-t border-dashed border-[#f0883e]" />
              Prophet
            </span>
          )}
          {arima && !arima.error && (
            <span className="flex items-center gap-1">
              <span className="inline-block w-4 h-px border-t border-dashed border-[#bc8cff]" />
              ARIMA
            </span>
          )}
        </div>

        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={chartData} margin={{ left: 0, right: 8 }}>
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
                if (v == null) return [null, name];
                const labels: Record<string, string> = {
                  close: "실제 가격",
                  prophet_yhat: "Prophet 예측",
                  arima_yhat: "ARIMA 예측",
                };
                return [`$${v.toFixed(2)}`, labels[name] ?? name];
              }}
            />
            {/* 예측 시작 기준선 */}
            <ReferenceLine
              x={lastDate}
              stroke={COLORS.grid}
              strokeDasharray="4 4"
              label={{
                value: "예측 시작",
                position: "top",
                fontSize: 9,
                fill: COLORS.muted,
                fontFamily: "IBM Plex Mono",
              }}
            />

            {/* Prophet 신뢰 구간 (스택 영역) */}
            {prophet && !prophet.error && (
              <>
                <Area
                  type="monotone"
                  dataKey="prophet_lower"
                  stackId="prophet_ci"
                  stroke="none"
                  fill="none"
                  dot={false}
                  legendType="none"
                />
                <Area
                  type="monotone"
                  dataKey="prophet_upper"
                  stackId="prophet_ci"
                  stroke="none"
                  fill="rgba(240,136,62,0.12)"
                  dot={false}
                  legendType="none"
                />
              </>
            )}

            {/* 실제 가격 */}
            <Area
              type="monotone"
              dataKey="close"
              stroke={COLORS.historical}
              strokeWidth={1.5}
              fill="rgba(88,166,255,0.07)"
              dot={false}
              connectNulls={false}
            />

            {/* Prophet 예측선 */}
            {prophet && !prophet.error && (
              <Line
                type="monotone"
                dataKey="prophet_yhat"
                stroke={COLORS.prophet}
                strokeWidth={2}
                strokeDasharray="5 3"
                dot={false}
                connectNulls
              />
            )}

            {/* ARIMA 예측선 */}
            {arima && !arima.error && (
              <Line
                type="monotone"
                dataKey="arima_yhat"
                stroke={COLORS.arima}
                strokeWidth={2}
                strokeDasharray="5 3"
                dot={false}
                connectNulls
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 예측 수치 테이블 */}
      {maxRows > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-[hsl(var(--border))]">
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">날짜</th>
                {prophet && !prophet.error && (
                  <>
                    <th className="text-right py-2 px-3 text-[#f0883e] font-medium">Prophet</th>
                    {prophetRows[0]?.yhat_lower != null && (
                      <th className="text-right py-2 px-3 text-muted-foreground font-medium">
                        하한 / 상한
                      </th>
                    )}
                  </>
                )}
                {arima && !arima.error && (
                  <th className="text-right py-2 px-3 text-[#bc8cff] font-medium">ARIMA</th>
                )}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: maxRows }).map((_, i) => {
                const p = prophetRows[i];
                const a = arimaRows[i];
                const date = p?.date ?? a?.date;
                return (
                  <tr
                    key={i}
                    className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors"
                  >
                    <td className="py-1.5 px-3 text-muted-foreground">{date}</td>
                    {prophet && !prophet.error && (
                      <>
                        <td className="py-1.5 px-3 text-right text-foreground">
                          {p ? `$${p.yhat.toFixed(2)}` : "—"}
                        </td>
                        {prophetRows[0]?.yhat_lower != null && (
                          <td className="py-1.5 px-3 text-right text-muted-foreground">
                            {p?.yhat_lower != null && p?.yhat_upper != null
                              ? `$${p.yhat_lower.toFixed(2)} / $${p.yhat_upper.toFixed(2)}`
                              : "—"}
                          </td>
                        )}
                      </>
                    )}
                    {arima && !arima.error && (
                      <td className="py-1.5 px-3 text-right text-foreground">
                        {a ? `$${a.yhat.toFixed(2)}` : "—"}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 에러 표시 */}
      {prophet?.error && (
        <p className="text-xs font-mono text-[#f85149]">Prophet 오류: {prophet.error}</p>
      )}
      {arima?.error && (
        <p className="text-xs font-mono text-[#f85149]">ARIMA 오류: {arima.error}</p>
      )}

      <p className="text-[10px] font-mono text-muted-foreground pt-2 border-t border-[hsl(var(--border))]">
        ⚠️ 예측은 통계 모델 기반이며 실제 투자 결정에 활용하지 마세요.
      </p>
    </div>
  );
}
