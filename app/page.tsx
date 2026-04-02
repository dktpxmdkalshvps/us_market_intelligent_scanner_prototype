"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  TrendingUp,
  Rocket,
  Gem,
  Wallet,
  Radar,
  Crown,
  Banknote,
  Building2,
  LineChart,
  ChevronUp,
  ChevronDown,
  Sparkles,
  CalendarDays,
  Database,
  RefreshCw,
} from "lucide-react";

const marketTicker = [
  { name: "S&P 500", value: 5248.42, change: 0.82 },
  { name: "NASDAQ", value: 16421.87, change: 1.24 },
  { name: "DOW", value: 39127.14, change: 0.31 },
  { name: "VIX", value: 14.82, change: -3.21 },
  { name: "USD/KRW", value: 1342.5, change: 0.18 },
  { name: "10Y Treasury", value: 4.48, change: -0.02, suffix: "%" },
];

const roadmap = [
  {
    phase: "Phase 1",
    title: "데이터 파이프라인 구축",
    period: "1~2주",
    items: [
      "S&P 500 / NASDAQ 100 종목 리스트 확보",
      "yfinance 기반 기초 데이터 수집 모듈 개발",
      "상장폐지 위험 종목 필터링(Base Filter) 구현",
    ],
  },
  {
    phase: "Phase 2",
    title: "테마 분석 엔진 개발",
    period: "2~3주",
    items: [
      "9가지 테마별 퀀트 필터링 알고리즘 구현",
      "이동평균선·추세 데이터 가공 로직 추가",
      "APScheduler 기반 일일 배치 갱신 설정",
    ],
  },
  {
    phase: "Phase 3",
    title: "백엔드 API 설계",
    period: "1주",
    items: [
      "/api/theme/{theme_name} 설계",
      "환율 및 증시 캘린더 API 연동",
      "종목 상세/차트 데이터 API 구현",
    ],
  },
  {
    phase: "Phase 4",
    title: "프론트엔드 대시보드 구현",
    period: "2~3주",
    items: [
      "테마 탭 + 정렬 가능한 종목 테이블",
      "인터랙티브 차트 영역 연결",
      "환율·지수·캘린더 상단 위젯 배치",
    ],
  },
  {
    phase: "Phase 5",
    title: "최적화 및 배포",
    period: "1주",
    items: [
      "캐싱으로 응답 속도 최적화",
      "Vercel + Render/AWS 배포 구성",
      "모바일 반응형 최종 점검",
    ],
  },
];

const themes = [
  {
    id: "undervalue_growth",
    icon: TrendingUp,
    emoji: "📈",
    label: "저평가 성장주",
    sub: "PEG < 1.0 & 매출성장 > 15%",
    desc: "성장 대비 밸류에이션이 과도하지 않은 종목을 선별합니다. PEG와 매출 성장률을 함께 확인해 단순 고PER 성장주를 제외합니다.",
    criteria: ["PEG < 1.0", "매출 성장률 > 15%", "Price ≥ $1", "MktCap ≥ $50M"],
    stocks: [
      { ticker: "META", name: "Meta Platforms", price: 497.2, chg: 2.14, mktcap: 1270, per: 23.1, peg: 0.81, roe: 38.2, rev_growth: 21.4, score: 95 },
      { ticker: "GOOGL", name: "Alphabet", price: 172.5, chg: 0.87, mktcap: 2140, per: 21.4, peg: 0.76, roe: 31.5, rev_growth: 18.7, score: 93 },
      { ticker: "ANET", name: "Arista Networks", price: 312.4, chg: 3.21, mktcap: 97.8, per: 38.2, peg: 0.92, roe: 28.4, rev_growth: 22.1, score: 89 },
      { ticker: "CPRT", name: "Copart", price: 54.3, chg: 1.12, mktcap: 52.4, per: 32.4, peg: 0.94, roe: 22.8, rev_growth: 17.8, score: 82 },
    ],
  },
  {
    id: "accel_growth",
    icon: Rocket,
    emoji: "🚀",
    label: "성장 기대주",
    sub: "3분기 연속 영업이익 가속",
    desc: "최근 3개 분기 YoY 기준 영업이익 개선 폭이 확대되는 종목을 포착합니다. 실적 모멘텀이 살아 있는 구간에 집중합니다.",
    criteria: ["3분기 연속 YoY 영업이익 증가", "Price ≥ $1", "MktCap ≥ $50M"],
    stocks: [
      { ticker: "NVDA", name: "NVIDIA", price: 875.4, chg: 4.23, mktcap: 2160, per: 42.1, peg: null, roe: 91.4, rev_growth: 122.4, score: 98 },
      { ticker: "AXON", name: "Axon Enterprise", price: 312.1, chg: 1.87, mktcap: 23.4, per: 78.4, peg: null, roe: 18.2, rev_growth: 34.7, score: 91 },
      { ticker: "CELH", name: "Celsius Holdings", price: 68.4, chg: -1.24, mktcap: 5.1, per: 41.2, peg: null, roe: 22.1, rev_growth: 28.4, score: 84 },
      { ticker: "FTNT", name: "Fortinet", price: 89.7, chg: 2.11, mktcap: 69.1, per: 52.4, peg: null, roe: null, rev_growth: 19.8, score: 80 },
    ],
  },
  {
    id: "safe_growth",
    icon: ShieldCheck,
    emoji: "🛡️",
    label: "안전 성장주",
    sub: "5년 연속 이익성장 & 부채비율 < 50%",
    desc: "실적의 지속성과 재무 안정성을 동시에 보는 테마입니다. 변동성이 큰 장에서 방어적인 성장주 선별에 적합합니다.",
    criteria: ["5년 연속 이익 성장", "부채비율 < 50%", "Price ≥ $1", "MktCap ≥ $50M"],
    stocks: [
      { ticker: "MSFT", name: "Microsoft", price: 415.2, chg: 0.54, mktcap: 3080, per: 34.2, peg: null, roe: 42.1, rev_growth: 17.2, score: 97 },
      { ticker: "V", name: "Visa", price: 287.4, chg: 0.78, mktcap: 593.2, per: 29.8, peg: null, roe: 48.7, rev_growth: 9.8, score: 92 },
      { ticker: "MA", name: "Mastercard", price: 491.7, chg: 1.12, mktcap: 453.1, per: 37.4, peg: null, roe: 192.4, rev_growth: 11.2, score: 91 },
      { ticker: "UNH", name: "UnitedHealth", price: 527.8, chg: -0.34, mktcap: 483.2, per: 22.1, peg: null, roe: 27.4, rev_growth: 8.4, score: 88 },
    ],
  },
  {
    id: "deep_value",
    icon: Gem,
    emoji: "💎",
    label: "저렴한 평가주",
    sub: "PBR < 1.0 & 순자산 우량",
    desc: "장부가치 대비 저평가되었지만 현금 보유력까지 검토한 밸류 테마입니다. 단순 숫자 함정을 줄이도록 리스크 필터와 함께 작동합니다.",
    criteria: ["PBR < 1.0", "순현금 보유", "Price ≥ $1", "MktCap ≥ $50M"],
    stocks: [
      { ticker: "INTC", name: "Intel", price: 21.4, chg: -0.87, mktcap: 91.2, per: null, peg: null, roe: -8.4, rev_growth: -8.7, score: 72 },
      { ticker: "T", name: "AT&T", price: 17.8, chg: 0.24, mktcap: 127.4, per: 11.2, peg: null, roe: 12.4, rev_growth: 0.8, score: 68 },
      { ticker: "WBD", name: "Warner Bros. Discovery", price: 8.42, chg: 2.14, mktcap: 20.4, per: null, peg: null, roe: -14.2, rev_growth: -2.1, score: 58 },
      { ticker: "PARA", name: "Paramount Global", price: 10.24, chg: 0.87, mktcap: 6.8, per: null, peg: null, roe: -18.4, rev_growth: -5.4, score: 52 },
    ],
  },
  {
    id: "high_roe",
    icon: Wallet,
    emoji: "💰",
    label: "고수익 저평가",
    sub: "ROE > 15% & PER < 15",
    desc: "수익성과 밸류에이션을 동시에 보며, 자본 효율이 높은데 아직 비싸지 않은 종목을 탐색합니다.",
    criteria: ["ROE > 15%", "PER < 15", "Price ≥ $1", "MktCap ≥ $50M"],
    stocks: [
      { ticker: "JPM", name: "JPMorgan", price: 194.2, chg: 0.34, mktcap: 558.4, per: 12.4, peg: null, roe: 18.7, rev_growth: 12.4, score: 91 },
      { ticker: "MRK", name: "Merck", price: 104.2, chg: -1.21, mktcap: 262.4, per: 13.8, peg: null, roe: 38.4, rev_growth: 7.4, score: 85 },
      { ticker: "BAC", name: "Bank of America", price: 38.7, chg: 0.54, mktcap: 305.2, per: 11.8, peg: null, roe: 10.4, rev_growth: 8.7, score: 84 },
      { ticker: "CVX", name: "Chevron", price: 147.8, chg: 0.87, mktcap: 268.1, per: 13.1, peg: null, roe: 14.2, rev_growth: -4.8, score: 79 },
    ],
  },
  {
    id: "technical",
    icon: Radar,
    emoji: "📡",
    label: "저평가 탈출",
    sub: "200일 이평 돌파 & 정배열",
    desc: "기술적 신호를 이용해 추세 전환 초기 구간을 포착합니다. 퀀트 지표와 차트 데이터 가공이 함께 들어가는 테마입니다.",
    criteria: ["200MA 상향 돌파", "이동평균 정배열", "Price ≥ $1", "MktCap ≥ $50M"],
    stocks: [
      { ticker: "PLTR", name: "Palantir", price: 24.8, chg: 5.47, mktcap: 53.7, per: null, peg: null, roe: 8.4, rev_growth: 20.1, score: 88 },
      { ticker: "RBLX", name: "Roblox", price: 38.4, chg: 2.87, mktcap: 23.1, per: null, peg: null, roe: null, rev_growth: 22.4, score: 82 },
      { ticker: "SOFI", name: "SoFi", price: 8.74, chg: 3.21, mktcap: 8.4, per: null, peg: null, roe: 4.2, rev_growth: 26.1, score: 76 },
      { ticker: "IONQ", name: "IonQ", price: 14.2, chg: 6.84, mktcap: 3.1, per: null, peg: null, roe: null, rev_growth: 89.4, score: 71 },
    ],
  },
  {
    id: "bugatti",
    icon: Crown,
    emoji: "🏎️",
    label: "부가티주",
    sub: "영업이익률 > 30% & 압도적 점유율",
    desc: "강한 브랜드와 높은 마진, 시장 지배력을 갖춘 프리미엄 기업군입니다. 질적 해자(Moat)를 수치화해 표현하는 테마입니다.",
    criteria: ["영업이익률 > 30%", "시장 지배력 최상위", "Price ≥ $1", "MktCap ≥ $50M"],
    stocks: [
      { ticker: "ADBE", name: "Adobe", price: 478.2, chg: 1.24, mktcap: 208.4, per: 26.4, peg: null, roe: 37.4, rev_growth: 10.8, score: 96 },
      { ticker: "INTU", name: "Intuit", price: 612.4, chg: 0.87, mktcap: 171.2, per: 52.4, peg: null, roe: 18.7, rev_growth: 13.4, score: 94 },
      { ticker: "NOW", name: "ServiceNow", price: 845.2, chg: 2.14, mktcap: 174.8, per: 62.4, peg: null, roe: 14.2, rev_growth: 21.4, score: 93 },
      { ticker: "MELI", name: "MercadoLibre", price: 1847.4, chg: 3.21, mktcap: 93.4, per: 48.4, peg: null, roe: 24.7, rev_growth: 35.4, score: 91 },
    ],
  },
  {
    id: "dividend",
    icon: Banknote,
    emoji: "💵",
    label: "배당주",
    sub: "배당수익률 > 4% & 안정 현금흐름",
    desc: "인컴 목적의 투자자를 위한 테마입니다. 배당률만 보지 않고 현금흐름 지속 가능성까지 함께 확인합니다.",
    criteria: ["배당수익률 > 4%", "FCF 커버리지 충분", "Price ≥ $1", "MktCap ≥ $50M"],
    stocks: [
      { ticker: "MO", name: "Altria", price: 42.4, chg: 0.14, mktcap: 74.2, per: 9.8, peg: null, roe: null, rev_growth: -2.4, score: 82 },
      { ticker: "T", name: "AT&T", price: 17.8, chg: 0.24, mktcap: 127.4, per: 11.2, peg: null, roe: 12.4, rev_growth: 0.8, score: 78 },
      { ticker: "VZ", name: "Verizon", price: 38.4, chg: -0.21, mktcap: 162.1, per: 8.7, peg: null, roe: 21.4, rev_growth: -0.4, score: 75 },
      { ticker: "WPC", name: "W.P. Carey", price: 54.2, chg: -0.34, mktcap: 14.2, per: null, peg: null, roe: 9.4, rev_growth: 4.8, score: 72 },
    ],
  },
  {
    id: "div_king",
    icon: Building2,
    emoji: "👑",
    label: "미래왕 배당주",
    sub: "10년 이상 배당 증액",
    desc: "장기 배당 성장 이력을 중심으로 신뢰도 높은 배당 귀족 후보를 보여줍니다. 보수적 투자자에게 설득력이 큰 테마입니다.",
    criteria: ["10년+ 배당 증액", "배당 귀족 조건", "Price ≥ $1", "MktCap ≥ $50M"],
    stocks: [
      { ticker: "JNJ", name: "Johnson & Johnson", price: 147.4, chg: 0.12, mktcap: 353.2, per: 16.4, peg: null, roe: 27.4, rev_growth: 4.2, score: 97 },
      { ticker: "KO", name: "Coca-Cola", price: 62.4, chg: 0.34, mktcap: 268.4, per: 22.4, peg: null, roe: 40.4, rev_growth: 2.8, score: 95 },
      { ticker: "PG", name: "P&G", price: 162.4, chg: -0.12, mktcap: 382.4, per: 25.4, peg: null, roe: 31.4, rev_growth: 2.4, score: 94 },
      { ticker: "TROW", name: "T. Rowe Price", price: 108.4, chg: -0.54, mktcap: 24.2, per: 14.4, peg: null, roe: 24.4, rev_growth: -8.4, score: 85 },
    ],
  },
];

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function formatMoney(num) {
  return `$${num.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function formatCap(cap) {
  if (cap >= 1000) return `${(cap / 1000).toFixed(2)}T`;
  return `${cap.toFixed(1)}B`;
}

function formatChange(change) {
  return `${change > 0 ? "+" : ""}${change.toFixed(2)}%`;
}

function getScoreTone(score) {
  if (score >= 90) {
    return "bg-emerald-500/15 text-emerald-300 border-emerald-400/30";
  }
  if (score >= 80) {
    return "bg-amber-500/15 text-amber-300 border-amber-400/30";
  }
  return "bg-zinc-500/15 text-zinc-300 border-zinc-400/30";
}

function getAIInsight(theme) {
  const best = [...theme.stocks].sort((a, b) => b.score - a.score)[0];
  const fastGrower = [...theme.stocks].sort(
    (a, b) => (b.rev_growth ?? -999) - (a.rev_growth ?? -999)
  )[0];

  return {
    summary: `${theme.label} 테마는 ${theme.criteria
      .slice(0, 2)
      .join(
        " · "
      )} 조건으로 필터링되어, 단순 인기주가 아니라 기준을 통과한 종목군만 보여줍니다. 현재 샘플 데이터 기준으로 ${
      best.ticker
    }가 가장 높은 종합 점수를 기록했고, ${
      fastGrower.ticker
    }는 성장률 측면에서 가장 강한 모멘텀을 보입니다.`,
    topPick: `${best.ticker}는 AI 점수 ${best.score}점으로 테마 내 최상위이며, 핵심 지표 밸런스가 가장 좋습니다. 보조 후보로는 ${fastGrower.ticker}를 제시할 수 있으며, 성장률이 높아 추세형 투자자에게 설득력이 있습니다.`,
    risk: `이 테마의 핵심 리스크는 첫째, 성장 둔화 시 밸류에이션 프리미엄이 빠르게 축소될 수 있다는 점입니다. 둘째, 일부 종목은 실적은 좋지만 이미 기대가 선반영되어 변동성이 큽니다. 셋째, 기술적 신호 테마는 추세 실패 시 손절 규칙이 반드시 필요합니다.`,
  };
}

function Panel({ children, className = "" }) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/10 bg-zinc-900/80 text-zinc-50 shadow-xl",
        className
      )}
    >
      {children}
    </div>
  );
}

function Badge({ children, className = "" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
        className
      )}
    >
      {children}
    </span>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-2xl border px-4 py-2 text-sm transition",
        active
          ? "border-white/10 bg-white text-zinc-950"
          : "border-white/15 bg-white/5 text-zinc-100 hover:bg-white/10"
      )}
    >
      {children}
    </button>
  );
}

function SortableHeader({ label, active, direction, onClick }) {
  return (
    <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.18em] text-zinc-400">
      <button
        onClick={onClick}
        className="flex items-center gap-1 transition hover:text-zinc-200"
      >
        <span>{label}</span>
        {active ? (
          direction === "asc" ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )
        ) : (
          <ChevronDown className="h-3.5 w-3.5 opacity-30" />
        )}
      </button>
    </th>
  );
}

export default function Page() {
  const [selectedThemeId, setSelectedThemeId] = useState(themes[0].id);
  const [sortKey, setSortKey] = useState("score");
  const [sortDirection, setSortDirection] = useState("desc");
  const [insightMode, setInsightMode] = useState("summary");

  const selectedTheme = useMemo(
    () => themes.find((theme) => theme.id === selectedThemeId) ?? themes[0],
    [selectedThemeId]
  );

  const sortedStocks = useMemo(() => {
    const list = [...selectedTheme.stocks];
    return list.sort((a, b) => {
      const av =
        a[sortKey] ??
        (sortDirection === "asc"
          ? Number.POSITIVE_INFINITY
          : Number.NEGATIVE_INFINITY);
      const bv =
        b[sortKey] ??
        (sortDirection === "asc"
          ? Number.POSITIVE_INFINITY
          : Number.NEGATIVE_INFINITY);
      return sortDirection === "asc" ? av - bv : bv - av;
    });
  }, [selectedTheme, sortKey, sortDirection]);

  const summaryStats = useMemo(() => {
    const items = selectedTheme.stocks;
    const avgScore = Math.round(
      items.reduce((sum, item) => sum + item.score, 0) / items.length
    );

    const avgPerItems = items.filter((item) => typeof item.per === "number");
    const avgRoeItems = items.filter((item) => typeof item.roe === "number");

    return {
      count: items.length,
      avgScore,
      avgPer: avgPerItems.length
        ? (
            avgPerItems.reduce((sum, item) => sum + item.per, 0) /
            avgPerItems.length
          ).toFixed(1)
        : "N/A",
      avgRoe: avgRoeItems.length
        ? `${(
            avgRoeItems.reduce((sum, item) => sum + item.roe, 0) /
            avgRoeItems.length
          ).toFixed(1)}%`
        : "N/A",
    };
  }, [selectedTheme]);

  const insights = getAIInsight(selectedTheme);

  const onSort = (key) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection("desc");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 shadow-2xl">
          <div className="border-b border-white/10 px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <Badge className="border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                  US Market Intelligent Scanner
                </Badge>

                <div>
                  <h1 className="text-2xl font-semibold tracking-tight md:text-4xl">
                    리스크 필터링 기반 테마별 미국 주식 분석 대시보드
                  </h1>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400 md:text-base">
                    데이터 정제, 테마 분류, 시각화를 한 화면에 결합한
                    포트폴리오형 대시보드입니다. 공통 리스크 가드를 먼저 적용한
                    뒤, 9개 투자 테마 엔진으로 종목을 스캔하는 구조입니다.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  { label: "Backend", value: "FastAPI" },
                  { label: "Frontend", value: "Next.js" },
                  { label: "Data", value: "yfinance + Pandas" },
                  { label: "DB / Job", value: "PostgreSQL + APScheduler" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur"
                  >
                    <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                      {item.label}
                    </div>
                    <div className="mt-1 text-sm font-medium text-zinc-100">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto px-5 py-3">
            {marketTicker.map((item) => (
              <div
                key={item.name}
                className="flex min-w-fit items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2"
              >
                <div className="text-xs text-zinc-400">{item.name}</div>
                <div className="font-mono text-sm text-zinc-100">
                  {item.suffix
                    ? `${item.value.toFixed(2)}${item.suffix}`
                    : item.value.toLocaleString("en-US", {
                        maximumFractionDigits: 2,
                      })}
                </div>
                <div
                  className={cn(
                    "font-mono text-xs",
                    item.change >= 0 ? "text-emerald-400" : "text-rose-400"
                  )}
                >
                  {formatChange(item.change)}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <div className="space-y-6">
            <Panel>
              <div className="px-6 pb-3 pt-6">
                <div className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-zinc-400">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  Risk Guard
                </div>
              </div>

              <div className="space-y-3 px-6 pb-6 text-sm text-zinc-200">
                {[
                  "Price ≥ $1.00",
                  "Market Cap ≥ $50M",
                  ".Q / .E 등 위험 티커 제외",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 rounded-2xl border border-emerald-400/15 bg-emerald-400/5 px-3 py-2"
                  >
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span>{item}</span>
                  </div>
                ))}

                <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-3.5 w-3.5" />
                    데이터 기준: 장 마감 후 일일 배치 갱신
                  </div>
                </div>
              </div>
            </Panel>

            <Panel>
              <div className="px-6 pb-3 pt-6">
                <div className="text-sm uppercase tracking-[0.2em] text-zinc-400">
                  Thematic Engines
                </div>
              </div>

              <div className="space-y-2 px-6 pb-6">
                {themes.map((theme) => {
                  const Icon = theme.icon;
                  const active = theme.id === selectedThemeId;

                  return (
                    <button
                      key={theme.id}
                      onClick={() => setSelectedThemeId(theme.id)}
                      className={cn(
                        "w-full rounded-2xl border p-3 text-left transition",
                        active
                          ? "border-emerald-400/30 bg-emerald-400/10 shadow-lg shadow-emerald-500/10"
                          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "rounded-xl p-2",
                            active ? "bg-emerald-400/15" : "bg-white/5"
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-4 w-4",
                              active ? "text-emerald-300" : "text-zinc-300"
                            )}
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="text-sm font-medium text-zinc-100">
                            {theme.label}
                          </div>
                          <div className="mt-1 text-xs text-zinc-400">
                            {theme.sub}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Panel>
          </div>

          <div className="space-y-6">
            <motion.div
              key={selectedTheme.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <Panel>
                <div className="p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="border-sky-400/20 bg-sky-400/10 text-sky-300">
                          {selectedTheme.emoji} {selectedTheme.label}
                        </Badge>
                        <Badge className="border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                          공통 리스크 필터 적용
                        </Badge>
                      </div>

                      <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                        {selectedTheme.sub}
                      </h2>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                        {selectedTheme.desc}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300">
                      검출 종목{" "}
                      <span className="ml-2 font-mono text-lg text-zinc-50">
                        {selectedTheme.stocks.length}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedTheme.criteria.map((criterion, index) => (
                      <Badge
                        key={criterion}
                        className={cn(
                          "px-3 py-1",
                          index >= selectedTheme.criteria.length - 2
                            ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
                            : "border-sky-400/30 bg-sky-400/10 text-sky-300"
                        )}
                      >
                        {criterion}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Panel>

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    label: "검출 종목",
                    value: `${summaryStats.count}`,
                    sub: "리스크 가드 통과",
                  },
                  {
                    label: "평균 AI 점수",
                    value: `${summaryStats.avgScore}`,
                    sub: "/100 점수",
                  },
                  {
                    label: "평균 PER",
                    value: `${summaryStats.avgPer}`,
                    sub: "Valuation",
                  },
                  {
                    label: "평균 ROE",
                    value: `${summaryStats.avgRoe}`,
                    sub: "Profitability",
                  },
                ].map((stat) => (
                  <Panel key={stat.label}>
                    <div className="p-5">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                        {stat.label}
                      </div>
                      <div className="mt-2 font-mono text-3xl font-semibold text-zinc-50">
                        {stat.value}
                      </div>
                      <div className="mt-1 text-sm text-zinc-400">
                        {stat.sub}
                      </div>
                    </div>
                  </Panel>
                ))}
              </section>

              <Panel>
                <div className="flex flex-row items-center justify-between gap-3 px-6 pb-2 pt-6">
                  <div>
                    <div className="text-lg font-semibold">테마 종목 스캐너</div>
                    <p className="mt-1 text-sm text-zinc-400">
                      정렬 가능한 테이블 구조로 설계되어 실제 API 응답을 바로
                      연결할 수 있습니다.
                    </p>
                  </div>

                  <div className="hidden items-center gap-2 text-xs text-zinc-400 md:flex">
                    <LineChart className="h-4 w-4" />
                    상세 차트 드릴다운 연결 준비 완료
                  </div>
                </div>

                <div className="px-6 pb-6">
                  <div className="overflow-x-auto rounded-2xl border border-white/10">
                    <table className="w-full min-w-[900px] border-collapse">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.18em] text-zinc-400">
                            종목
                          </th>
                          <SortableHeader
                            label="현재가"
                            active={sortKey === "price"}
                            direction={sortDirection}
                            onClick={() => onSort("price")}
                          />
                          <SortableHeader
                            label="등락률"
                            active={sortKey === "chg"}
                            direction={sortDirection}
                            onClick={() => onSort("chg")}
                          />
                          <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.18em] text-zinc-400">
                            시총
                          </th>
                          <SortableHeader
                            label="PER"
                            active={sortKey === "per"}
                            direction={sortDirection}
                            onClick={() => onSort("per")}
                          />
                          <SortableHeader
                            label="ROE"
                            active={sortKey === "roe"}
                            direction={sortDirection}
                            onClick={() => onSort("roe")}
                          />
                          <SortableHeader
                            label="매출성장"
                            active={sortKey === "rev_growth"}
                            direction={sortDirection}
                            onClick={() => onSort("rev_growth")}
                          />
                          <SortableHeader
                            label="AI 점수"
                            active={sortKey === "score"}
                            direction={sortDirection}
                            onClick={() => onSort("score")}
                          />
                        </tr>
                      </thead>

                      <tbody>
                        {sortedStocks.map((stock) => (
                          <tr
                            key={stock.ticker}
                            className="border-b border-white/10 transition hover:bg-white/5"
                          >
                            <td className="px-4 py-4">
                              <div>
                                <div className="font-medium text-zinc-100">
                                  {stock.ticker}
                                </div>
                                <div className="text-xs text-zinc-400">
                                  {stock.name}
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4 font-mono">
                              {formatMoney(stock.price)}
                            </td>

                            <td
                              className={cn(
                                "px-4 py-4 font-mono",
                                stock.chg >= 0
                                  ? "text-emerald-400"
                                  : "text-rose-400"
                              )}
                            >
                              {formatChange(stock.chg)}
                            </td>

                            <td className="px-4 py-4 font-mono text-zinc-300">
                              {formatCap(stock.mktcap)}
                            </td>

                            <td className="px-4 py-4 font-mono text-zinc-300">
                              {stock.per == null ? "—" : stock.per.toFixed(1)}
                            </td>

                            <td className="px-4 py-4 font-mono text-zinc-300">
                              {stock.roe == null ? "—" : `${stock.roe.toFixed(1)}%`}
                            </td>

                            <td
                              className={cn(
                                "px-4 py-4 font-mono",
                                stock.rev_growth >= 0
                                  ? "text-emerald-400"
                                  : "text-rose-400"
                              )}
                            >
                              {`${stock.rev_growth >= 0 ? "+" : ""}${stock.rev_growth.toFixed(1)}%`}
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={cn(
                                  "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
                                  getScoreTone(stock.score)
                                )}
                              >
                                {stock.score}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Panel>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                <Panel>
                  <div className="px-6 pb-6 pt-6">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <Sparkles className="h-5 w-5 text-emerald-300" />
                      AI 테마 분석
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <TabButton
                        active={insightMode === "summary"}
                        onClick={() => setInsightMode("summary")}
                      >
                        테마 요약
                      </TabButton>
                      <TabButton
                        active={insightMode === "topPick"}
                        onClick={() => setInsightMode("topPick")}
                      >
                        Top Pick
                      </TabButton>
                      <TabButton
                        active={insightMode === "risk"}
                        onClick={() => setInsightMode("risk")}
                      >
                        리스크 평가
                      </TabButton>
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-zinc-200">
                      {insightMode === "summary" && insights.summary}
                      {insightMode === "topPick" && insights.topPick}
                      {insightMode === "risk" && insights.risk}
                    </div>

                    <div className="mt-4 rounded-2xl border border-sky-400/15 bg-sky-400/5 p-4 text-sm text-sky-100">
                      실제 서비스에서는 이 영역을 FastAPI → LLM 요약 API 또는
                      내부 분석 엔진 결과로 대체하면 됩니다.
                    </div>
                  </div>
                </Panel>

                <Panel>
                  <div className="px-6 pb-6 pt-6">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <CalendarDays className="h-5 w-5 text-amber-300" />
                      개발 로드맵
                    </div>

                    <div className="mt-4 space-y-3">
                      {roadmap.map((phase) => (
                        <div
                          key={phase.phase}
                          className="rounded-2xl border border-white/10 bg-white/5 p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                                {phase.phase}
                              </div>
                              <div className="mt-1 font-medium text-zinc-100">
                                {phase.title}
                              </div>
                            </div>

                            <Badge className="border-white/15 text-zinc-300">
                              {phase.period}
                            </Badge>
                          </div>

                          <ul className="mt-3 space-y-2 text-sm text-zinc-300">
                            {phase.items.map((item) => (
                              <li key={item} className="flex gap-2">
                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </Panel>
              </div>
            </motion.div>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "데이터 엔지니어링",
              body: "대량의 미국 주식 데이터를 정제하고 테마별로 재구성하는 흐름을 보여줍니다.",
            },
            {
              title: "도메인 지식",
              body: "PER, PEG, ROE, 배당, 기술적 지표까지 투자 기준을 코드화한 점이 강점입니다.",
            },
            {
              title: "풀스택 역량",
              body: "수집·정제·API·UI·배포까지 하나의 제품 흐름으로 설명할 수 있습니다.",
            },
          ].map((item) => (
            <Panel key={item.title}>
              <div className="p-5">
                <div className="text-lg font-semibold text-zinc-100">
                  {item.title}
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  {item.body}
                </p>
              </div>
            </Panel>
          ))}
        </section>

        <Panel>
          <div className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                <Database className="h-4 w-4 text-emerald-300" />
                다음 연결 포인트
              </div>
              <p className="mt-2 text-sm text-zinc-400">
                이 프로토타입은 실제 API와 붙이기 쉽게 설계되어 있습니다.
                이후에는 테마 엔진을 서버에서 계산하고, 프론트에서는
                테이블/차트/필터만 렌더링하면 됩니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge className="border-white/10 bg-white/5 text-zinc-300">
                /api/theme/:name
              </Badge>
              <Badge className="border-white/10 bg-white/5 text-zinc-300">
                /api/market/overview
              </Badge>
              <Badge className="border-white/10 bg-white/5 text-zinc-300">
                /api/stock/:ticker
              </Badge>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}