# QuantScreen Architecture

## Runtime Architecture

```text
┌─────────────────────┐
│ Browser             │
│ qsscreen.vercel.app │
└─────────┬───────────┘
          │ HTTPS
          ▼
┌────────────────────────────┐
│ Vercel Next.js Frontend    │
│ NEXT_PUBLIC_API_BASE_URL   │
└─────────┬──────────────────┘
          │ Axios API Calls
          ▼
┌────────────────────────────┐
│ Render FastAPI Backend     │
│ Gunicorn + Uvicorn Worker  │
│ CORS Middleware            │
└─────────┬──────────────────┘
          │ SQLAlchemy Session
          ▼
┌────────────────────────────┐
│ Render PostgreSQL          │
│ stocks                     │
│ theme_snapshots            │
│ market_calendar            │
│ refresh_runs               │
└────────────────────────────┘
```

## Request Flow

```text
1. 사용자가 Vercel 프론트 접속
2. React Query가 API 호출 실행
3. Axios baseURL은 NEXT_PUBLIC_API_BASE_URL 사용
4. FastAPI CORS Middleware가 origin 검증
5. Router가 요청 처리
6. 필요 시 SQLAlchemy로 PostgreSQL 조회
7. 프론트 공통 응답 래퍼로 JSON 반환
8. React Query 캐시 후 UI 렌더링
```

## Data Pipeline

현재 포트폴리오 버전은 수동 seed 기반입니다.

```text
scripts/seed.py
  ↓
stocks / theme_snapshots / market_calendar / refresh_runs
  ↓
FastAPI query routers
  ↓
Vercel frontend dashboard
```

향후 개선 버전:

```text
External market data API
  ↓
Scheduled refresh job
  ↓
Feature calculation / theme scoring
  ↓
PostgreSQL snapshot tables
  ↓
FastAPI read API
  ↓
Frontend dashboard
```

## ERD Summary

```text
stocks 1 ── N theme_snapshots

stocks
- id PK
- ticker UNIQUE
- name
- market
- sector
- created_at
- updated_at

theme_snapshots
- id PK
- theme_key
- theme_name
- ticker FK -> stocks.ticker
- score
- rank
- reason
- source
- payload JSON
- created_at

market_calendar
- id PK
- market
- date
- is_open
- note
- created_at
- UNIQUE(market, date)

refresh_runs
- id PK
- job_name
- status
- message
- started_at
- finished_at
- created_at
```

## Migration Lifecycle

```text
Git commit with Alembic revision
  ↓
Render deploy starts backend service
  ↓
backend/start.sh executes alembic upgrade head
  ↓
FastAPI app starts only after schema is current
  ↓
Smoke tests verify /health and frontend-compatible APIs
```

Render Free 환경에서는 운영 서버에 직접 Shell로 접속할 수 없기 때문에, 마이그레이션은 `start.sh`의 부팅 전 자동 실행과 Codespaces/Local 원격 실행을 조합합니다. 이 구조는 제출용 포트폴리오에서는 충분히 단순하면서도, DB 스키마 변경을 코드 변경과 함께 추적할 수 있게 합니다.

수동 보정이 필요한 경우에는 Render PostgreSQL의 External Database URL을 사용합니다.

```bash
cd backend
export DATABASE_URL='<Render PostgreSQL External Database URL>'
PYTHONPATH=. alembic upgrade head
```
