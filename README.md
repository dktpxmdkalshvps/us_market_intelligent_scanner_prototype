# QuantScreen 📈
### 리스크 필터링 기반 테마별 미국 주식 분석 대시보드

> 퀀트 지표(PER, PEG, ROE 등)를 기준으로 엄선된 **9가지 투자 테마**를 제공하고
> 상장폐지 위험 종목을 자동 필터링하여 안전한 투자 정보를 전달합니다.

---

## 🏗 프로젝트 구조

```
stock-dashboard/
├── app/                        # Next.js App Router (프론트엔드)
│   ├── layout.tsx              # 루트 레이아웃
│   ├── page.tsx                # 메인 대시보드 페이지
│   └── globals.css             # 전역 스타일 (Bloomberg Terminal 다크 테마)
│
├── components/                 # React 컴포넌트
│   ├── MarketBanner.tsx        # 상단 실시간 시세 티커
│   ├── MarketOverview.tsx      # 주요 지수 카드
│   ├── ThemeSelector.tsx       # 9대 테마 선택 탭
│   ├── StockTable.tsx          # 종목 테이블 (정렬/검색/페이지네이션)
│   ├── StockDetailModal.tsx    # 종목 상세 모달 (차트 포함)
│   ├── MarketCalendar.tsx      # 증시 캘린더 (실적발표/경제지표)
│   ├── Providers.tsx           # React Query Provider
│   └── ui/
│       └── Skeleton.tsx        # 로딩 스켈레톤 UI
│
├── lib/                        # 프론트엔드 유틸리티
│   ├── api.ts                  # Axios API 클라이언트
│   ├── types.ts                # TypeScript 타입 정의
│   ├── themes.ts               # 9대 테마 메타데이터
│   └── store.ts                # Zustand 전역 상태
│
├── backend/                    # FastAPI 백엔드
│   ├── main.py                 # FastAPI 앱 진입점
│   ├── core/
│   │   ├── config.py           # 환경변수 설정 (pydantic-settings)
│   │   └── cache.py            # Redis / In-memory 캐시 레이어
│   ├── routers/
│   │   ├── themes.py           # GET /api/theme/{theme_key}
│   │   ├── stocks.py           # GET /api/stocks/{ticker}
│   │   └── market.py           # GET /api/market/banner|calendar
│   ├── services/
│   │   ├── fetcher.py          # yfinance 데이터 수집 모듈
│   │   ├── filters.py          # 리스크 가드 (Base Filter)
│   │   ├── theme_engines.py    # 9대 테마 퀀트 알고리즘 (Pandas)
│   │   ├── market_service.py   # 실시간 시세 / 캘린더
│   │   └── scheduler.py        # APScheduler 배치 스케줄러
│   └── models/
│       ├── stock.py            # SQLAlchemy ORM 모델
│       └── schemas.py          # Pydantic 응답 스키마
│
├── api/
│   ├── index.py                # Vercel Python Serverless 진입점
│   └── requirements.txt        # Python 패키지 목록
│
├── scripts/
│   ├── dev.sh                  # 로컬 개발 환경 시작 스크립트
│   ├── init_db.py              # DB 테이블 초기화
│   └── refresh_data.py         # 수동 데이터 갱신 트리거
│
├── vercel.json                 # Vercel 배포 설정
├── next.config.mjs             # Next.js 설정
├── tailwind.config.ts          # Tailwind CSS 설정
├── .env.example                # 환경변수 템플릿
└── README.md
```

---

## 🛡 리스크 가드 (공통 필터)

모든 테마 추출 전 자동 적용:

| 필터 | 기준 | 이유 |
|------|------|------|
| Penny Stock 제외 | 주가 $1.00 미만 | 유동성 위험 |
| 소형주 제외 | 시가총액 $50M 미만 | 상장폐지 위험 |
| 파산위험 제외 | `.Q`, `.E`, `.PK` 등 | 공시지연/파산 징후 |
| 무데이터 제외 | 가격 정보 없음 | 거래 정지 가능성 |

---

## 🎯 9대 투자 테마

| # | 테마 | 핵심 조건 |
|---|------|-----------|
| 1 | 🌱 저평가 성장주 | `PEG < 1.0` & 매출성장률 > 15% |
| 2 | 🚀 성장 기대주 | 매출성장률 > 10% & 영업이익률 > 5% |
| 3 | 🛡️ 안전 성장주 | 매출성장 & 부채비율 < 50% |
| 4 | 💎 저렴한 평가주 | `PBR < 1.0` |
| 5 | 📈 고수익 저평가 | `ROE > 15%` & `PER < 15` |
| 6 | ⚡ 저평가 탈출 | MA50 > MA200 (정배열) & 주가 > MA200 |
| 7 | 🏎️ 부가티주 | 영업이익률 > 30% |
| 8 | 💰 배당주 | 배당수익률 > 4% |
| 9 | 👑 미래왕 배당주 | 배당귀족 (10년+ 연속 증배) |

---

## 🚀 Vercel 배포 가이드

### 1단계: 저장소 준비

```bash
git init
git add .
git commit -m "feat: initial QuantScreen setup"
gh repo create quantscreen --public --push
```

### 2단계: Vercel 프로젝트 생성

```bash
npm i -g vercel
vercel login
vercel
```

### 3단계: 환경변수 설정

Vercel 대시보드 → Settings → Environment Variables:

```
DATABASE_URL       = postgresql://...  (Vercel Postgres 권장)
REDIS_URL          = redis://...       (Upstash Redis 권장)
NEXT_PUBLIC_API_URL = /api
```

또는 CLI로:
```bash
vercel env add DATABASE_URL
vercel env add REDIS_URL
vercel env add NEXT_PUBLIC_API_URL
```

### 4단계: 데이터베이스 초기화

```bash
# 로컬에서 Vercel DB 연결 후 실행
vercel env pull .env.local
python scripts/init_db.py
```

### 5단계: 첫 데이터 수집

```bash
python scripts/refresh_data.py
```

### 6단계: 배포

```bash
vercel --prod
```

---

## 💻 로컬 개발

```bash
# 자동 세팅
bash scripts/dev.sh

# 또는 수동으로:
# 1. Python 가상환경
python3.11 -m venv venv && source venv/bin/activate
pip install -r api/requirements.txt

# 2. FastAPI 백엔드
uvicorn backend.main:app --reload --port 8000

# 3. Next.js 프론트엔드 (새 터미널)
npm install
npm run dev
```

- 프론트엔드: http://localhost:3000
- API 문서: http://localhost:8000/api/docs

---

## 🔌 API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/api/theme/{theme_key}` | 테마별 종목 리스트 |
| `GET` | `/api/stocks/{ticker}` | 종목 상세 + 차트 데이터 |
| `GET` | `/api/market/banner` | 실시간 지수 + 환율 |
| `GET` | `/api/market/calendar` | 증시 캘린더 |
| `GET` | `/api/health` | 헬스체크 |
| `GET` | `/api/docs` | Swagger UI |

### 테마 키 목록
```
undervalued_growth | growth_momentum | safe_growth | deep_value
high_roe | breakout | bugatti | dividend | dividend_aristocrat
```

---

## 🛠 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | Next.js 14 (App Router), TypeScript |
| Styling | Tailwind CSS, Framer Motion |
| State | Zustand, React Query (TanStack) |
| Charts | Recharts |
| Backend | FastAPI (Python 3.11+) |
| Data | yfinance, Pandas, NumPy |
| Database | PostgreSQL (SQLAlchemy) |
| Cache | Redis / In-memory fallback |
| Scheduler | APScheduler |
| Deploy | Vercel (Next.js + Python Serverless) |

---

## ⚠️ 주의사항

- **투자 참고용** 데이터입니다. 투자 손익의 책임은 본인에게 있습니다.
- yfinance는 비공식 API입니다. 프로덕션에서는 유료 데이터 제공업체(Polygon.io, Alpha Vantage 등) 연동을 권장합니다.
- Vercel Serverless 함수는 60초 타임아웃이 있어 대량 데이터 수집은 별도 백그라운드 서버 또는 GitHub Actions로 처리하는 것을 권장합니다.

---

## 📄 라이선스

MIT License
