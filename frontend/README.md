# QuantScreen Frontend

Next.js 기반의 포트폴리오용 퀀트 스크리닝 대시보드입니다. Render에 배포된 FastAPI 백엔드와 연동해 테마별 종목, 시장 배너, 증시 캘린더, 종목 상세/기술 분석/예측 샘플 데이터를 표시합니다.

## 배포 URL

| 구분 | URL |
|---|---|
| Frontend | `https://qsscreen.vercel.app` |
| Preview/Origin | `https://qs-front-psi.vercel.app` |
| Backend API | `https://quant-backend-e82y.onrender.com` |
| Backend Health | `https://quant-backend-e82y.onrender.com/health` |

## 기술 스택

- Next.js
- TypeScript
- Tailwind CSS
- Axios
- TanStack Query
- Zustand
- Vercel

## 환경변수

Vercel Project Settings > Environment Variables:

```env
NEXT_PUBLIC_API_BASE_URL=https://quant-backend-e82y.onrender.com
```

로컬 실행 시 `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## 로컬 실행

```bash
npm install
npm run dev
```

접속:

```text
http://localhost:3000
```

## API 연동 구조

`lib/api.ts`는 백엔드의 공통 응답 래퍼를 기준으로 데이터를 읽습니다.

```ts
interface ApiResponse<T> {
  data: T;
  status: "ok" | "error";
  message?: string;
  cached: boolean;
  timestamp: string;
}
```

주요 호출:

| 함수 | Backend path |
|---|---|
| `fetchMarketBanner()` | `/market/banner` |
| `fetchMarketCalendar(10)` | `/market/calendar?days=10` |
| `fetchThemeStocks(themeKey)` | `/theme/{themeKey}` |
| `fetchStockDetail(ticker)` | `/stocks/{ticker}?period=1y` |
| `fetchTechnicalAnalysis(ticker)` | `/analysis/{ticker}/technical?period=1y` |
| `fetchForecast(ticker)` | `/analysis/{ticker}/forecast?model=both&days=7` |

## 화면 구성

- 상단 시장 배너: S&P 500, NASDAQ 100, DOW, VIX, USD/KRW, USD/JPY
- 테마 셀렉터: 저평가 성장, 모멘텀, 안전 성장, 딥 밸류, 고 ROE, 브레이크아웃, 배당, 배당귀족
- 종목 테이블: 가격, 등락률, 시가총액, PER, PEG, ROE, 리스크 점수, 테마 점수
- 종목 상세 모달: 가격 차트, 재무 샘플, 기술 분석, 예측 데이터
- 증시 캘린더: 실적, 경제지표, FOMC, 휴장 이벤트

## 배포 체크리스트

1. Vercel 환경변수 `NEXT_PUBLIC_API_BASE_URL` 확인
2. Render 백엔드 `/health` 정상 확인
3. Render `CORS_ORIGINS`에 실제 Vercel origin 포함 확인
4. Vercel Deploy 실행
5. 브라우저에서 `Ctrl + Shift + R` 강력 새로고침
6. 개발자도구 Console에 CORS/404 오류가 없는지 확인

## 자주 발생한 이슈

| 증상 | 원인 | 해결 |
|---|---|---|
| API가 404 | 프론트 호출 경로와 백엔드 경로 불일치 | 백엔드 `compat.py`에 호환 API 추가 |
| `net::ERR_FAILED 200 (OK)` | 서버는 200이지만 브라우저가 CORS 차단 | Render `CORS_ORIGINS`에 실제 Vercel URL 추가 |
| 종목이 안 보임 | 응답 래퍼 `{ data, status, cached, timestamp }` 불일치 | 백엔드 응답 포맷 통일 |
| 증시 캘린더가 비어 보임 | 캘린더 데이터 부족 또는 type 불일치 | `/market/calendar` fallback 데이터 보강 |

## 포트폴리오 설명 포인트

- 프론트/백엔드/DB를 분리한 3-tier 구조
- Vercel + Render + PostgreSQL 배포 경험
- CORS, API contract, Python runtime, package version 문제 해결
- Alembic 기반 DB 마이그레이션 적용
- 포트폴리오용 샘플 데이터 파이프라인 구성
