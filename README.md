# QuantScreen

QuantScreen은 테마 기반 주식 스크리닝, 시장 배너, 증시 캘린더, 종목 상세 분석, 기술 분석 및 예측 샘플 데이터를 제공하는 포트폴리오용 퀀트 대시보드입니다.

## Portfolio Repository Notice

본 레포지토리는 프로젝트의 전체 아키텍처와 최신 소스코드를 한눈에 검토할 수 있도록 구성한 **통합 코드 리뷰용 모노레포**입니다.

- **단일 진입점:** 평가자는 `QuantScreen` 하나에서 프론트엔드, 백엔드, DB 마이그레이션, API 계약, 배포 문서, 트러블슈팅 이력을 확인할 수 있습니다.
- **인프라 격리:** 실제 운영 배포는 이미 검증된 `QS_front`와 `QS_render`의 독립 CI/CD 파이프라인을 유지합니다.
- **동기화 원칙:** `frontend/`, `backend/`는 실제 배포 레포지토리의 최신 소스 스냅샷을 반영하는 리뷰용 코드입니다. 동기화 기준과 검증 방법은 [`SYNC_MANIFEST.md`](SYNC_MANIFEST.md), [`docs/CODE_SYNC_POLICY.md`](docs/CODE_SYNC_POLICY.md)를 따릅니다.

이 구조는 배포 안정성을 해치지 않으면서도, 평가자에게는 하나의 대표 레포지토리에서 전체 프로젝트를 검토할 수 있는 경험을 제공하기 위한 하이브리드 모노레포 전략입니다.

## Live Demo

| 구분 | URL |
|---|---|
| Frontend | `https://qsscreen.vercel.app` |
| Vercel Preview/Origin | `https://qs-front-psi.vercel.app` |
| Backend API | `https://quant-backend-e82y.onrender.com` |
| Backend Health Check | `https://quant-backend-e82y.onrender.com/health` |

## Repository Map

| 역할 | Repository / Directory | 설명 |
|---|---|---|
| 대표 포트폴리오 | `QuantScreen` | 전체 코드 리뷰, 문서, 아키텍처 확인용 대표 레포 |
| 프론트 코드 | `frontend/` | Next.js, TypeScript, Tailwind CSS |
| 백엔드 코드 | `backend/` | FastAPI, SQLAlchemy, Alembic, PostgreSQL, Render 설정 |
| 프론트 실배포 | `QS_front` | Vercel에 연결된 독립 배포 레포 |
| 백엔드 실배포 | `QS_render` | Render에 연결된 독립 배포 레포 |
| 문서 | `docs/` | 아키텍처, API 계약, 배포, QA, 동기화 정책 |

## Project Structure

```text
QuantScreen/
├─ frontend/          # Next.js frontend source
├─ backend/           # FastAPI backend source and Render/PostgreSQL setup
├─ docs/              # Architecture, API contract, deployment, QA, sync policy
├─ scripts/           # Repository sync and safety-check scripts
├─ SYNC_MANIFEST.md   # Source sync record and verification guide
├─ .env.example       # Safe environment variable example
├─ .gitignore         # Root-level ignore rules for the full monorepo
└─ README.md          # Project overview
```

## Tech Stack

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- Axios
- TanStack Query
- Zustand
- Vercel

### Backend

- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL
- psycopg 3
- Render

### Database / Data

- PostgreSQL
- Alembic migration
- Seed script 기반 포트폴리오 샘플 데이터
- `stocks`, `theme_snapshots`, `market_calendar`, `refresh_runs` 테이블 구조

## Main Features

- 테마별 종목 스크리닝
- 시장 지수/환율 배너
- 증시 캘린더
- 종목 상세 정보
- 기술 분석 샘플 데이터
- 예측 샘플 데이터
- PostgreSQL 기반 데이터 저장
- Alembic 기반 마이그레이션 관리

## API Summary

| Method | Path | 설명 |
|---|---|---|
| GET | `/health` | 백엔드 및 DB 상태 확인 |
| GET | `/api/stocks` | 전체 종목 조회 |
| GET | `/market/banner` | 시장 지수/환율 배너 데이터 |
| GET | `/market/calendar?days=10` | 증시 캘린더 조회 |
| GET | `/theme/{theme_key}` | 테마별 종목 조회 |
| GET | `/stocks/{ticker}?period=1y` | 종목 상세 조회 |
| GET | `/analysis/{ticker}/technical?period=1y` | 기술 분석 샘플 조회 |
| GET | `/analysis/{ticker}/forecast?model=both&days=7` | 예측 샘플 조회 |

자세한 응답 계약은 [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md)를 참고하세요.

## Local Development

### Frontend

```bash
cd frontend
npm install
npm run dev
```

`frontend/.env.local` 예시:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
PYTHONPATH=. alembic upgrade head
PYTHONPATH=. python scripts/seed.py
PYTHONPATH=. uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

`backend/.env` 예시:

```env
APP_ENV=local
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
WEB_CONCURRENCY=2
PYTHON_VERSION=3.12.7
```

실제 `.env` 파일은 절대 커밋하지 않습니다.

## Deployment Architecture

```text
Browser
  ↓
Vercel Frontend
  ↓ HTTPS API
Render FastAPI Backend
  ↓ SQLAlchemy / psycopg
Render PostgreSQL
```

현재 운영 배포는 안정성을 위해 기존 분리 레포지토리 기반으로 유지합니다.

- Vercel live deployment: `QS_front`
- Render live deployment: `QS_render`
- Portfolio review entry point: `QuantScreen`

`frontend/vercel.json`, `backend/render.yaml`, `backend/build.sh`, `backend/start.sh`는 모노레포 내에서도 검토 가능한 배포 설정입니다. 현재는 안정적인 운영을 위해 실배포 연결만 분리 레포에 유지하고 있으며, 이후 Vercel/Render의 Root Directory를 각각 `frontend/`, `backend/`로 지정하면 단일 레포 기반 배포로 전환할 수 있습니다.

자세한 내용은 [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md), [`docs/CI_CD_NOTICE.md`](docs/CI_CD_NOTICE.md)를 참고하세요.

## Sync and Safety Checks

실제 배포 레포와 포트폴리오 모노레포 간 불일치를 줄이기 위해 동기화 정책과 점검 스크립트를 포함했습니다.

```bash
./scripts/sync_from_split_repos.sh
./scripts/verify_no_sensitive_files.sh
git status --short
```

`sync_from_split_repos.sh`는 기본적으로 상위 경로의 `../QS_front`, `../QS_render`를 읽습니다. 경로가 다르면 아래처럼 지정합니다.

```bash
QS_FRONT_PATH=/path/to/QS_front QS_RENDER_PATH=/path/to/QS_render ./scripts/sync_from_split_repos.sh
```

## Troubleshooting Highlights

| 이슈 | 원인 | 해결 |
|---|---|---|
| Render Free DB 생성 실패 | Free PostgreSQL 1개 제한 | 기존 DB 삭제 후 Blueprint 재배포 |
| `psycopg-binary` 설치 실패 | 고정 버전이 빌드 환경에서 제공되지 않음 | `psycopg[binary]==3.3.4`로 조정 |
| SQLAlchemy 타입 힌트 오류 | Render가 Python 3.14로 빌드 | Python 3.12.7 고정 |
| API 404 | 프론트 호출 경로와 백엔드 경로 불일치 | `compat.py`에 호환 API 추가 |
| CORS 차단 | 실제 Vercel origin 누락 | `CORS_ORIGINS`에 배포 origin 추가 |
| 종목 미표시 | 프론트 응답 계약과 백엔드 응답 구조 불일치 | `{ data, status, cached, timestamp }` 응답 래퍼 통일 |
| 캘린더 미표시 | 샘플 row만 존재해 UI가 비어 보임 | 캘린더 fallback 데이터 보강 |

## Portfolio Talking Points

- 프론트엔드, 백엔드, DB를 분리한 3-tier 구조 설계
- Vercel + Render + PostgreSQL 실배포 경험
- Alembic 기반 마이그레이션 관리
- 배포 중 발생한 런타임/패키지/CORS/API contract 문제 해결
- 제출용 대표 모노레포와 운영 배포 레포를 분리해 안정성과 가독성 동시 확보
- 동기화 정책, 민감정보 점검 스크립트, QA 문서까지 포함한 관리 체계 제시

## Documentation

- [`SYNC_MANIFEST.md`](SYNC_MANIFEST.md)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md)
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)
- [`docs/CI_CD_NOTICE.md`](docs/CI_CD_NOTICE.md)
- [`docs/CODE_SYNC_POLICY.md`](docs/CODE_SYNC_POLICY.md)
- [`docs/QA_CHECKLIST.md`](docs/QA_CHECKLIST.md)
- [`docs/REPOSITORY_STRATEGY.md`](docs/REPOSITORY_STRATEGY.md)
