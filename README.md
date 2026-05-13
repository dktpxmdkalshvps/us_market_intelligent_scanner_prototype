# QuantScreen

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js" />
  <img src="https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python" />
  <img src="https://img.shields.io/badge/Prophet-1.3-FF6B35?style=flat-square&logo=meta" />
  <img src="https://img.shields.io/badge/ARIMA-statsmodels-4B8BBE?style=flat-square" />
  <img src="https://img.shields.io/badge/PostgreSQL-SQLAlchemy-4169E1?style=flat-square&logo=postgresql" />
  <img src="https://img.shields.io/badge/Deploy-Vercel-000000?style=flat-square&logo=vercel" />
</p>

<p align="center">
  퀀트 지표 기반 리스크 필터링 미국 주식 분석 대시보드<br/>
  <strong>Bloomberg Terminal 스타일 UI · 9대 투자 테마 · 기술적 분석 · AI 가격 예측</strong>
</p>

---

## 프로젝트 소개

개인 투자자가 수백 개의 미국 상장 종목 중에서 **재무 지표가 검증된 종목만 빠르게 추려내기 어렵다**는 문제에서 출발했습니다.

QuantScreen은 PER, PEG, ROE, 배당수익률 등 퀀트 지표를 조합한 **9가지 투자 테마 알고리즘**을 제공하고, 상장폐지·파산 위험 종목을 데이터 수집 단계에서 사전 차단합니다. Bloomberg Terminal에서 영감을 받은 다크 테마 UI로 전문적인 투자 분석 경험을 제공합니다.

2025년 5월 업데이트를 통해 별도로 개발된 **[finance-prediction](https://github.com/dktpxmdkalshvps/finance-prediction)** 프로젝트의 기술적 분석 및 AI 가격 예측 기능을 통합했습니다. 종목 스크리닝(QuantScreen)과 심층 분석·예측(finance-prediction)이 하나의 플랫폼에서 동작합니다.

---

## 스크린샷

<img width="400" height="213" alt="1000109132" src="https://github.com/user-attachments/assets/43039f18-788f-4fd2-91d6-1349a8f3ed3e" />

**전체 대시보드**
<img width="1596" height="766" alt="image" src="https://github.com/user-attachments/assets/f422d7ce-c54c-4bbc-9aaf-f2c8ce05b9fa" />

**시장 지수 & 실시간 티커**
<img width="1889" height="430" alt="스크린샷 2026-05-04 232814" src="https://github.com/user-attachments/assets/6242f3fd-f2db-4e1d-bcd1-42d02b875263" />

**증시 캘린더**
<img width="410" height="858" alt="스크린샷 2026-05-04 232826" src="https://github.com/user-attachments/assets/f63812ee-94e4-4e2a-b34b-4cc0a70eb10b" /> <img width="403" height="770" alt="스크린샷 2026-05-04 232835" src="https://github.com/user-attachments/assets/287e13a1-d69c-404c-a4bb-56c7ee47d3af" />

---

## 핵심 기능

**퀀트 스크리닝 엔진**
- 9가지 독립적인 투자 테마 알고리즘 (Pandas 기반)
- 테마별 복합 조건 필터링: PEG, ROE, PBR, 이동평균 교차, 배당 이력 등
- 공통 리스크 가드로 패니 스톡·소형주·파산위험 종목 사전 제거
- S&P 500 + NASDAQ 100 합산 516개 유니버스 자동 수집 (Wikipedia 크롤링)

**기술적 분석** 
- MA5 / MA20 / MA60 이동평균선, 볼린저밴드(2σ) 실시간 계산
- RSI(14), MACD(12/26/9) 오실레이터
- 4개 지표를 종합한 매수·매도·중립 트레이딩 시그널 자동 생성
- 가격·거래량·RSI·MACD 4패널 동기화 차트 (Recharts)

**AI 가격 예측** 
- Prophet (Meta) 시계열 모델로 7일 가격 예측 + 95% 신뢰구간 시각화
- ARIMA(5,1,0) 통계 모델 예측 결과 병렬 비교
- 예측 수치 테이블 (날짜별 예상 가격 · 상한/하한)

**전종목 직접 검색** 
- 헤더 검색창에서 yfinance 지원 전 종목 직접 조회
- 미국·한국·암호화폐 즐겨찾기 바로가기
- 종목 클릭 없이도 기술분석·가격예측 탭 즉시 접근

**실시간 시장 정보**
- 주요 지수(S&P 500, NASDAQ, Dow) 및 환율 실시간 티커 배너
- 증시 캘린더: 실적 발표 및 경제 지표 일정 통합 표시

**성능 최적화**
- Redis 캐시 레이어로 반복 API 호출 비용 절감 (In-memory fallback 지원)
- 기술분석 10분 · 예측 1시간 독립 TTL 캐싱으로 무거운 모델 연산 재사용
- APScheduler로 장 마감 후 배치 데이터 갱신 자동화
- TanStack Query 지연 로딩으로 탭 전환 시에만 분석 API 호출

**UI/UX**
- Bloomberg Terminal 스타일 다크 테마
- Framer Motion 기반 전환 애니메이션
- 로딩 Skeleton UI, 정렬·검색·페이지네이션이 통합된 종목 테이블
- 종목 상세 모달: **개요 / 기술분석 / 가격예측** 탭 구조

---

## 아키텍처

```
┌──────────────────────────────────────────────────────────┐
│                     Client (Browser)                      │
│          Next.js 14 · Zustand · TanStack Query            │
│                                                           │
│  ThemeSelector ─► StockTable ─► StockDetailModal          │
│  TickerSearchBar                 ├── 개요 탭              │
│                                  ├── 기술분석 탭 (NEW)    │
│                                  └── 가격예측 탭 (NEW)    │
└──────────────────────────┬───────────────────────────────┘
                           │ HTTP (REST)
┌──────────────────────────▼───────────────────────────────┐
│                  FastAPI Backend (Python)                  │
│                                                           │
│  /api/theme/{key}  ──► theme_engines.py (퀀트 스크리닝)  │
│  /api/stocks/{ticker} ──► fetcher.py + filters.py        │
│  /api/analysis/{ticker}/technical ──► technical_analysis  │ ← NEW
│  /api/analysis/{ticker}/forecast  ──► Prophet / ARIMA    │ ← NEW
│  /api/market/banner|calendar ──► market_service.py       │
│                                                           │
│              Redis Cache (TTL 기반)                       │
│              APScheduler (배치 갱신)                      │
└──────────────────────────────────────────────────────────┘
                           │
                 Vercel Serverless (배포)
```

**데이터 흐름**

1. APScheduler가 장 마감 후 yfinance에서 종목 데이터를 수집해 PostgreSQL에 적재
2. API 요청 시 Redis 캐시를 먼저 확인 → 미스 시 DB 쿼리 후 캐시 갱신
3. 프론트엔드는 TanStack Query로 응답을 클라이언트 캐시에 보관해 재요청 최소화
4. 기술분석·예측 탭은 클릭 시점에만 API 호출 (지연 로딩) → 불필요한 모델 연산 방지

---

## 투자 테마 알고리즘

| # | 테마 | 핵심 조건 | 전략 근거 |
|---|------|-----------|-----------|
| 1 | 저평가 성장주 | `PEG < 1.0` & 매출성장률 > 15% | 성장 대비 저평가 종목 포착 |
| 2 | 성장 기대주 | 매출성장률 > 10% & 영업이익률 > 5% | 수익성 있는 성장 기업 선별 |
| 3 | 안전 성장주 | 매출성장 & 부채비율 < 50% | 재무 안전성과 성장을 동시에 |
| 4 | 저렴한 평가주 | `PBR < 1.0` | 자산 대비 저평가 기업 |
| 5 | 고수익 저평가 | `ROE > 15%` & `PER < 15` | 수익성 높고 가격 저렴한 기업 |
| 6 | 저평가 탈출 | MA50 > MA200 & 주가 > MA200 | 기술적 정배열 전환 시점 포착 |
| 7 | 고마진주 | 영업이익률 > 30% | 높은 가격 결정력을 가진 기업 |
| 8 | 배당주 | 배당수익률 > 4% | 안정적인 현금흐름 확보 |
| 9 | 배당귀족 | 10년 이상 연속 증배 | 장기 배당 성장 신뢰도 검증 |

---

## 리스크 가드

9개 테마 알고리즘 실행 전 공통으로 적용되는 전처리 필터입니다.

| 필터 | 기준 | 목적 |
|------|------|------|
| Penny Stock 제거 | 주가 $1.00 미만 | 유동성 위험 차단 |
| 소형주 제거 | 시가총액 $50M 미만 | 상장폐지 위험 차단 |
| 파산위험 제거 | `.Q`, `.E`, `.PK` 접미사 | 공시 지연 / 파산 징후 제거 |
| 데이터 없음 제거 | 가격 정보 부재 | 거래 정지 종목 제거 |

---

## 기술 스택

| 구분 | 기술 | 선택 이유 |
|------|------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript | SSR + 파일 기반 라우팅으로 초기 로딩 최적화 |
| Styling | Tailwind CSS, Framer Motion | 유틸리티 클래스로 빠른 UI 구성, 애니메이션 선언적 관리 |
| State | Zustand, TanStack Query | 전역 UI 상태와 서버 상태를 분리해 관심사 분리 |
| Charts | Recharts | React 친화적 선언형 차트 컴포넌트, syncId로 4패널 동기화 |
| Backend | FastAPI (Python 3.11+) | 비동기 처리 + 자동 Swagger 문서 생성 |
| Data | yfinance, Pandas, NumPy | 재무 데이터 수집 및 복합 지표 연산 |
| **예측 모델** | **Prophet (Meta), statsmodels ARIMA** | **단기 가격 예측 · 신뢰구간 시각화** |
| Database | PostgreSQL + SQLAlchemy | 정형 재무 데이터의 안정적인 영속성 보장 |
| Cache | Redis / In-memory fallback | API 응답 TTL 캐싱으로 외부 호출 비용 절감 |
| Scheduler | APScheduler | 장 마감 후 데이터 갱신 자동화 |
| Deploy | Vercel | Next.js + Python Serverless 단일 플랫폼 배포 |

---

## 프로젝트 구조

```
quantscreen/
├── app/                        # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css             # Bloomberg Terminal 다크 테마
│
├── components/
│   ├── MarketBanner.tsx        # 실시간 시세 티커
│   ├── MarketOverview.tsx      # 주요 지수 카드
│   ├── ThemeSelector.tsx       # 9대 테마 탭
│   ├── StockTable.tsx          # 종목 테이블 (정렬 / 검색 / 페이지네이션)
│   ├── StockDetailModal.tsx    # 종목 상세 모달 (개요 / 기술분석 / 가격예측 탭)
│   ├── TechnicalChart.tsx      # 기술적 분석 4패널 차트 
│   ├── ForecastChart.tsx       # Prophet·ARIMA 예측 차트 
│   ├── TickerSearchBar.tsx     # 헤더 종목 직접 검색 
│   ├── MarketCalendar.tsx      # 증시 캘린더
│   ├── Providers.tsx
│   └── ui/Skeleton.tsx
│
├── lib/
│   ├── api.ts                  # Axios 클라이언트
│   ├── types.ts                # TypeScript 타입
│   ├── themes.ts               # 테마 메타데이터
│   └── store.ts                # Zustand 전역 상태
│
├── backend/                    # FastAPI 백엔드
│   ├── main.py
│   ├── core/
│   │   ├── config.py           # 환경변수 (pydantic-settings)
│   │   └── cache.py            # Redis / In-memory 캐시
│   ├── routers/
│   │   ├── themes.py           # GET /api/theme/{theme_key}
│   │   ├── stocks.py           # GET /api/stocks/{ticker}
│   │   └── market.py           # GET /api/market/banner|calendar
│   ├── routers/
│   │   ├── themes.py           # GET /api/theme/{theme_key}
│   │   ├── stocks.py           # GET /api/stocks/{ticker}
│   │   ├── market.py           # GET /api/market/banner|calendar
│   │   └── analysis.py         # GET /api/analysis/{ticker}/technical|forecast 
│   ├── services/
│   │   ├── fetcher.py          # yfinance 데이터 수집 (S&P500 + NASDAQ100 516개)
│   │   ├── filters.py          # 리스크 가드
│   │   ├── theme_engines.py    # 9대 테마 퀀트 알고리즘
│   │   ├── technical_analysis.py # MA·BB·RSI·MACD·시그널 계산 
│   │   ├── forecasting.py      # Prophet + ARIMA 가격 예측 
│   │   ├── market_service.py   # 실시간 시세 / 캘린더
│   │   └── scheduler.py        # APScheduler 배치 스케줄러
│   └── models/
│       ├── stock.py            # SQLAlchemy ORM
│       └── schemas.py          # Pydantic 응답 스키마
│
├── api/
│   ├── index.py                # Vercel Serverless 진입점
│   └── requirements.txt
│
└── scripts/
    ├── dev.sh                  # 로컬 개발 환경 시작
    ├── init_db.py              # DB 초기화
    └── refresh_data.py         # 수동 데이터 갱신
```

---

## 로컬 실행

```bash
# 자동 세팅 (권장)
bash scripts/dev.sh
```

수동 실행:

```bash
# 1. Python 가상환경 및 의존성 설치
python3.11 -m venv venv && source venv/bin/activate
pip install -r api/requirements.txt

# 2. FastAPI 백엔드 실행
uvicorn backend.main:app --reload --port 8000

# 3. Next.js 프론트엔드 실행 (새 터미널)
npm install && npm run dev
```

| 서비스 | 주소 |
|--------|------|
| 프론트엔드 | http://localhost:3000 |
| API 문서 (Swagger) | http://localhost:8000/api/docs |

**환경변수 설정** (`.env.example` 참고)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/quantscreen
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/api/theme/{theme_key}` | 테마별 종목 리스트 |
| `GET` | `/api/stocks/{ticker}` | 종목 상세 + 차트 데이터 |
| `GET` | `/api/market/banner` | 실시간 지수 + 환율 |
| `GET` | `/api/market/calendar` | 증시 캘린더 |
| `GET` | `/api/analysis/{ticker}/technical` | 기술적 지표 + 트레이딩 시그널 |
| `GET` | `/api/analysis/{ticker}/forecast` | Prophet·ARIMA 가격 예측 |
| `GET` | `/api/health` | 헬스체크 |
| `GET` | `/api/docs` | Swagger UI |

**분석 API 파라미터**

| 파라미터 | 기본값 | 설명 |
|----------|--------|------|
| `period` | `6mo` | 기술분석 기간 (`1mo` `3mo` `6mo` `1y` `2y`) |
| `model` | `both` | 예측 모델 (`prophet` `arima` `both`) |
| `days` | `7` | 예측 일수 (1 ~ 30) |

**테마 키**

```
undervalued_growth  growth_momentum  safe_growth   deep_value
high_roe            breakout         bugatti       dividend   dividend_aristocrat
```

## 업데이트 히스토리

### v2.0 — 2026-05-14

**finance-prediction 통합 · 기술분석 · AI 예측 추가**

두 개의 독립 프로젝트를 하나의 플랫폼으로 통합했습니다.

| 구분 | 내용 |
|------|------|
| 기술적 분석 서비스 | MA5/20/60, 볼린저밴드, RSI, MACD를 FastAPI 서비스로 포팅 |
| 예측 서비스 | Prophet(Meta) + ARIMA 이중 모델 FastAPI 서비스로 통합 |
| 분석 API | `/api/analysis/{ticker}/technical`, `/forecast` 신규 엔드포인트 |
| 모달 UI 개선 | 종목 상세 모달에 개요·기술분석·가격예측 탭 구조 도입 |
| 차트 컴포넌트 | 4패널 동기화 기술분석 차트, 신뢰구간 포함 예측 차트 신규 개발 |
| 종목 검색 | 헤더 검색창으로 yfinance 지원 전 종목 즉시 분석 |
| 유니버스 확장 | Wikipedia 403 우회 처리 → S&P 500(503) + NASDAQ 100(101) = **516개** 정상 수집 |
| 캐싱 전략 | 기술분석 10분 · 예측 1시간 독립 TTL로 모델 재연산 최소화 |

### v1.0 — 2026-05

- 9대 투자 테마 퀀트 스크리닝 엔진
- Bloomberg Terminal 스타일 대시보드 초기 출시

---

## 주의사항

- 본 프로젝트는 **학습 및 포트폴리오 목적**으로 제작되었습니다. 투자 손익의 책임은 본인에게 있습니다.
- yfinance는 Yahoo Finance 비공식 API입니다. 상업적 사용 시 Polygon.io, Alpha Vantage 등 공식 데이터 제공업체 연동을 권장합니다.
- Vercel Serverless 함수는 60초 타임아웃이 있어 대량 배치 수집은 GitHub Actions 또는 별도 서버로 처리하는 것을 권장합니다.

---

## 라이선스

[MIT License](LICENSE)
