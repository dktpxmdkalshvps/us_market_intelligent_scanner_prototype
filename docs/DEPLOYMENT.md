# Deployment

## 현재 운영 배포

| 영역 | 플랫폼 | Active Repository | 비고 |
|---|---|---|---|
| Frontend | Vercel | `QS_front` | 현재 라이브 프론트 배포 |
| Backend | Render | `QS_render` | 현재 라이브 FastAPI 배포 |
| Database | Render PostgreSQL | Render managed database | 백엔드에서 `DATABASE_URL`로 연결 |
| Portfolio review | GitHub | `QuantScreen` | 코드 리뷰와 문서 확인용 대표 레포 |

## 왜 QuantScreen에서 바로 배포하지 않는가

`QuantScreen`에는 배포 가능한 `frontend/`, `backend/` 코드와 설정이 포함되어 있습니다. 다만 현재 라이브 배포는 이미 안정화된 `QS_front`, `QS_render`에 연결되어 있으므로, 제출 직전에는 CI/CD 연결을 변경하지 않습니다.

이 선택은 다음 목적을 갖습니다.

- 라이브 서비스 안정성 유지
- Vercel/Render 배포 리스크 최소화
- 평가자에게는 단일 레포에서 전체 구조 제공
- 향후 단일 모노레포 배포로 전환 가능한 구조 유지

## Frontend 환경변수

Vercel의 `QS_front` 프로젝트에 등록합니다.

```env
NEXT_PUBLIC_API_BASE_URL=https://quant-backend-e82y.onrender.com
```

모노레포 기반으로 전환할 경우 Vercel 설정:

```text
Repository: QuantScreen
Root Directory: frontend
Build Command: npm run build
Output: .next
```

## Backend 환경변수

Render의 `QS_render` Web Service에 등록합니다.

```env
PYTHON_VERSION=3.12.7
APP_ENV=production
DATABASE_URL=<Render PostgreSQL connection string>
CORS_ORIGINS=https://qs-front-psi.vercel.app,https://qsscreen.vercel.app,http://localhost:3000,http://localhost:5173
WEB_CONCURRENCY=2
```

모노레포 기반으로 전환할 경우 Render 설정:

```text
Repository: QuantScreen
Root Directory: backend
Build Command: bash build.sh
Start Command: bash start.sh
```

또는 Blueprint를 사용할 경우 `backend/render.yaml` 경로를 지정합니다.

## Smoke Test

```text
GET https://quant-backend-e82y.onrender.com/health
GET https://quant-backend-e82y.onrender.com/api/stocks
GET https://quant-backend-e82y.onrender.com/market/banner
GET https://quant-backend-e82y.onrender.com/market/calendar?days=10
GET https://quant-backend-e82y.onrender.com/theme/undervalued_growth
GET https://quant-backend-e82y.onrender.com/stocks/NVDA?period=1y
GET https://quant-backend-e82y.onrender.com/analysis/NVDA/technical?period=1y
GET https://quant-backend-e82y.onrender.com/analysis/NVDA/forecast?model=both&days=7
```

## Alembic 마이그레이션 운영 전략

Render Free Web Service는 내부 Shell Access를 지원하지 않으므로, 스키마 마이그레이션은 두 단계로 운영합니다.

### 1. 배포 시작 시 자동 마이그레이션

`backend/start.sh`는 애플리케이션 기동 전에 아래 명령을 실행하도록 구성되어 있습니다.

```bash
alembic upgrade head
```

따라서 일반적인 배포에서는 Render Web Service가 시작될 때 최신 Alembic revision이 자동 적용됩니다. 이 방식은 Free 플랜에서도 동작하며, 별도 SSH 접속이 필요하지 않습니다.

### 2. 수동 보정 또는 Seed 적재

Render Shell을 사용할 수 없는 Free 환경에서는 Codespaces 또는 로컬 가상환경에서 Render PostgreSQL의 **External Database URL**을 주입해 원격으로 실행합니다.

```bash
cd backend
export APP_ENV=local
export DATABASE_URL='<Render PostgreSQL External Database URL>'
PYTHONPATH=. alembic upgrade head
PYTHONPATH=. python scripts/seed.py
```

### 3. 마이그레이션 트리 동기화 방어

포트폴리오 모노레포는 실제 배포 레포의 최신 `backend/alembic/versions/`를 스냅샷으로 반영합니다. `scripts/sync_from_split_repos.sh`는 `rsync --delete`를 사용해 대상 디렉토리를 clean sync하므로, 과거 마이그레이션 파편이 남아 트리가 꼬이는 상황을 줄입니다.

배포 전 점검:

```bash
cd backend
PYTHONPATH=. alembic heads
PYTHONPATH=. alembic current
```

운영 기준은 항상 `alembic heads`가 단일 head를 가리키는 것입니다.

## Seed 실행

Render Free 인스턴스는 Shell Access를 지원하지 않으므로 Codespaces 또는 로컬에서 Render PostgreSQL External Database URL을 사용합니다.

```bash
cd backend
export APP_ENV=local
export DATABASE_URL='<Render PostgreSQL External Database URL>'
PYTHONPATH=. alembic upgrade head
PYTHONPATH=. python scripts/seed.py
```

성공 예시:

```text
Seed completed. stocks=15, new_theme_snapshots=45, calendar_changes=8
```
