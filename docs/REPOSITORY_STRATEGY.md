# Repository Strategy

## 목적

`QuantScreen`은 제출/검토용 대표 레포지토리입니다. 평가자가 하나의 링크만 열어도 프론트엔드, 백엔드, DB 마이그레이션, 배포 설정, API 계약, 트러블슈팅 이력을 모두 확인할 수 있도록 구성합니다.

## 현재 전략

| 구분 | 전략 |
|---|---|
| 코드 리뷰 | `QuantScreen` 대표 레포에서 확인 |
| 실제 프론트 배포 | `QS_front` 유지 |
| 실제 백엔드 배포 | `QS_render` 유지 |
| 배포 안정성 | 기존 정상 배포 파이프라인 유지 |
| 포트폴리오 가독성 | `frontend/`, `backend/`, `docs/` 구조로 통합 제시 |
| 동기화 관리 | `SYNC_MANIFEST.md`와 `scripts/sync_from_split_repos.sh`로 추적 |

## 왜 이렇게 나누는가

분리 배포는 임시방편이 아니라, 제출 직전의 운영 안정성을 위한 의도적인 선택입니다.

- Vercel과 Render 배포가 이미 정상 동작합니다.
- 제출 직전에 CI/CD root directory를 바꾸면 새 장애가 발생할 수 있습니다.
- 대신 대표 레포에는 실제 배포 소스 스냅샷을 `frontend/`, `backend/`로 모아 코드 리뷰 편의성을 확보합니다.

## 평가자 관점에서의 읽는 방법

1. `README.md`에서 전체 구조와 라이브 URL 확인
2. `frontend/`에서 화면 구현과 API 호출 구조 확인
3. `backend/`에서 FastAPI, Alembic, PostgreSQL, Render 설정 확인
4. `docs/API_CONTRACT.md`에서 프론트-백엔드 응답 계약 확인
5. `docs/DEPLOYMENT.md`, `docs/CI_CD_NOTICE.md`에서 실제 배포 구조 확인
6. `docs/CODE_SYNC_POLICY.md`, `SYNC_MANIFEST.md`에서 분리 배포 레포와의 동기화 정책 확인

## 동기화 불신 방지 장치

이 레포는 단순 복사본처럼 보이지 않도록 다음 장치를 둡니다.

- `SYNC_MANIFEST.md`에 소스 기준과 검증 방법을 기록합니다.
- `scripts/sync_from_split_repos.sh`로 로컬의 `QS_front`, `QS_render`에서 다시 동기화할 수 있습니다.
- `scripts/verify_no_sensitive_files.sh`로 `.env`, 로컬 DB, 비밀키 커밋 위험을 점검합니다.
- root `.gitignore`와 하위 `.gitignore`를 이중으로 유지합니다.

## 향후 전환안

시간 여유가 있을 때는 Vercel과 Render의 Root Directory 설정을 각각 `frontend/`, `backend/`로 지정하여 `QuantScreen` 단일 레포 기반 배포로 전환할 수 있습니다.

전환 전 체크리스트:

1. `frontend/`에서 Vercel 빌드 성공 확인
2. `backend/`에서 Render 빌드 성공 확인
3. Render PostgreSQL 환경변수 재연결 확인
4. CORS origin 확인
5. `/health`, `/market/calendar`, `/theme/{theme_key}` smoke test 통과
