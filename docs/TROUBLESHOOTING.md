# Troubleshooting Notes

QuantScreen 배포 과정에서 발생한 대표 이슈와 해결 과정을 기록합니다. 이 문서는 단순 오류 나열이 아니라, 실제 운영 배포에서 어떤 판단으로 문제를 좁히고 해결했는지를 설명합니다.

## 1. Render Free PostgreSQL 생성 실패

### 증상

Blueprint 배포 시 데이터베이스 생성 단계에서 실패하고, 이어서 Web Service 생성도 취소되었습니다.

```text
cannot have more than one active free tier database
Create web service quant-backend (canceled: another action failed)
```

### 원인

Render Free 플랜에서는 활성 Free PostgreSQL 데이터베이스를 1개만 유지할 수 있습니다. 기존에 만든 DB가 남아 있는 상태에서 Blueprint가 새 DB를 생성하려고 하면서 충돌했습니다.

### 해결

- 기존 테스트 DB를 삭제했습니다.
- Blueprint를 다시 동기화해 `quant-postgres`와 `quant-backend`를 한 번에 생성했습니다.
- 이후 문서에는 Free 티어 제약을 명시해 같은 실수를 반복하지 않도록 했습니다.

## 2. psycopg binary 버전 설치 실패

### 증상

Render 빌드 단계에서 `psycopg-binary==3.2.3`를 찾지 못해 실패했습니다.

```text
ERROR: Could not find a version that satisfies the requirement psycopg-binary==3.2.3
```

### 원인

Render 빌드 환경과 Python 버전에 맞는 wheel 목록에 해당 고정 버전이 없었습니다.

### 해결

`requirements.txt`를 최신 제공 버전에 맞춰 조정했습니다.

```txt
psycopg[binary]==3.3.4
```

## 3. Python 3.14 + SQLAlchemy 타입 힌트 오류

### 증상

빌드는 성공했지만, `alembic upgrade head` 실행 중 SQLAlchemy 모델 로딩 단계에서 실패했습니다.

```text
TypeError: descriptor '__getitem__' requires a 'typing.Union' object but received a 'tuple'
```

### 원인

Render가 Python 3.14 환경으로 빌드하면서 SQLAlchemy 타입 힌트 처리와 호환성 문제가 발생했습니다.

### 해결

Python 버전을 3.12.7로 고정했습니다.

```txt
# runtime.txt
python-3.12.7
```

```yaml
# render.yaml
- key: PYTHON_VERSION
  value: 3.12.7
```

추가로 `.python-version`을 두어 로컬과 배포 환경의 해석을 맞췄습니다.

## 4. API 404: 프론트 호출 경로와 백엔드 라우트 불일치

### 증상

프론트는 정상 배포되었지만 Render 로그에 다수의 404가 발생했습니다.

```text
GET /market/calendar?days=10 404
GET /theme/undervalued_growth 404
GET /stocks/NVDA?period=1y 404
```

### 원인

초기 백엔드는 `/api/...` 중심의 REST 라우트를 제공했지만, 프론트는 기존 로컬 API 계약인 `/market/...`, `/theme/...`, `/stocks/...` 경로를 호출하고 있었습니다.

### 해결

`backend/app/routers/compat.py`에 프론트 호환 라우트를 추가했습니다.

- `GET /market/banner`
- `GET /market/calendar?days=10`
- `GET /theme/{theme_key}`
- `GET /stocks/{ticker}?period=1y`
- `GET /analysis/{ticker}/technical?period=1y`
- `GET /analysis/{ticker}/forecast?model=both&days=7`

## 5. CORS 차단

### 증상

백엔드는 200을 반환했지만 브라우저에서는 `net::ERR_FAILED 200 (OK)`와 CORS 오류가 표시되었습니다.

```text
No 'Access-Control-Allow-Origin' header is present on the requested resource
```

### 원인

실제 Vercel 배포 origin인 `https://qs-front-psi.vercel.app`이 백엔드 `CORS_ORIGINS`에 포함되어 있지 않았습니다.

### 해결

Render 환경변수 및 `render.yaml`에 실제 origin을 추가했습니다.

```env
CORS_ORIGINS=https://qs-front-psi.vercel.app,https://qsscreen.vercel.app,http://localhost:3000,http://localhost:5173
```

## 6. 프론트 응답 계약 불일치

### 증상

API는 200을 반환했지만 종목 리스트가 화면에 나타나지 않았습니다.

### 원인

프론트는 모든 API 응답을 아래 래퍼로 기대했습니다.

```ts
{
  data: ...,
  status: "ok",
  cached: false,
  timestamp: "..."
}
```

초기 호환 API는 `{ ok, items, stocks }` 형태를 반환해 프론트의 파싱 로직과 충돌했습니다.

### 해결

공통 응답 래퍼를 도입하고, `compat.py`의 모든 프론트 호환 응답을 통일했습니다. 이후 `ApiResponse<T>` Pydantic 모델을 추가해 공통 래퍼의 런타임 검증 기반을 마련했습니다.

## 7. 증시 캘린더 미표시

### 증상

`/market/calendar?days=10`은 200을 반환했지만, UI의 증시 캘린더가 충분히 채워지지 않았습니다.

### 원인

DB에 `sample row` 1건만 존재해 fallback 데이터가 동작하지 않았습니다. 프론트는 10일치 캘린더를 기대했지만, 실제 응답은 1건뿐이었습니다.

### 해결

- `sample row`는 표시용 이벤트에서 제외했습니다.
- DB 이벤트가 부족할 경우 기본 이벤트로 보강했습니다.
- `type`과 `importance`는 프론트 리터럴 타입 계약에 맞게 제한했습니다.

## 8. Render Free 환경에서 Seed와 Migration 실행

### 증상

Render Free Web Service에서는 Shell Access가 지원되지 않았습니다.

### 해결

Codespaces에서 Render PostgreSQL의 External Database URL을 사용해 원격으로 실행했습니다.

```bash
cd backend
export APP_ENV=local
export DATABASE_URL='<Render PostgreSQL External Database URL>'
PYTHONPATH=. alembic upgrade head
PYTHONPATH=. python scripts/seed.py
```

이 방식은 배포 서버에 쉘 접속하지 않고도 DB 스키마와 샘플 데이터를 안전하게 반영할 수 있습니다.
