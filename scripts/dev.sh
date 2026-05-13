#!/usr/bin/env bash
# QuantScreen – 로컬 개발 환경 원커맨드 셋업
# 사용법: bash scripts/dev.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

step() { echo -e "\n${CYAN}▶ $1${NC}"; }
ok()   { echo -e "${GREEN}  ✓ $1${NC}"; }
warn() { echo -e "${YELLOW}  ⚠ $1${NC}"; }
err()  { echo -e "${RED}  ✗ $1${NC}"; exit 1; }

echo -e "${CYAN}"
echo "  ╔═══════════════════════════════════════╗"
echo "  ║    QuantScreen  로컬 개발 환경 셋업    ║"
echo "  ╚═══════════════════════════════════════╝"
echo -e "${NC}"

# ── 0. Python 버전 확인 ───────────────────────────────────────────────────────
step "Python 버전 확인"
PYTHON_CMD=""
for cmd in python3.11 python3.12 python3; do
  if command -v "$cmd" &>/dev/null; then
    VER=$("$cmd" -c "import sys; print(sys.version_info[:2])")
    if [[ "$VER" == "(3, 11)" || "$VER" == "(3, 12)" ]]; then
      PYTHON_CMD="$cmd"
      ok "$cmd 발견"
      break
    fi
  fi
done
[[ -z "$PYTHON_CMD" ]] && err "Python 3.11 이상이 필요합니다. https://python.org 에서 설치하세요."

# ── 1. .env 파일 준비 ─────────────────────────────────────────────────────────
step ".env 파일 확인"
if [ ! -f ".env" ]; then
  cp .env.example .env
  warn ".env 파일을 .env.example에서 복사했습니다. 필요 시 값을 수정하세요."
else
  ok ".env 파일 존재"
fi

# ── 2. Python 가상환경 ────────────────────────────────────────────────────────
step "Python 가상환경 설정"
if [ ! -d "venv" ]; then
  $PYTHON_CMD -m venv venv
  ok "가상환경 생성 완료"
else
  ok "기존 가상환경 재사용"
fi

source venv/bin/activate
pip install -q --upgrade pip
pip install -q -r api/requirements.txt
ok "Python 패키지 설치 완료"

# ── 3. DB 초기화 (SQLite 자동 생성) ──────────────────────────────────────────
step "데이터베이스 초기화"
$PYTHON_CMD -c "
import sys; sys.path.insert(0, '.')
from backend.core.db import init_db
init_db()
print('DB 테이블 생성 완료')
"
ok "SQLite DB 초기화 완료 (quantscreen.db)"

# ── 4. Node.js 패키지 ─────────────────────────────────────────────────────────
step "Node.js 패키지 설치"
if ! command -v node &>/dev/null; then
  err "Node.js가 설치되어 있지 않습니다. https://nodejs.org 에서 설치하세요."
fi
npm install --legacy-peer-deps --silent
ok "프론트엔드 패키지 설치 완료"

# ── 완료 ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  셋업 완료! 아래 명령어로 서버를 실행하세요.${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${YELLOW}[터미널 1]  백엔드 (FastAPI + SQLite):${NC}"
echo -e "  source venv/bin/activate"
echo -e "  uvicorn backend.main:app --reload --port 8000"
echo ""
echo -e "  ${YELLOW}[터미널 2]  프론트엔드 (Next.js):${NC}"
echo -e "  npm run dev"
echo ""
echo -e "  ${CYAN}접속 URL:${NC}"
echo -e "  프론트엔드 →  http://localhost:3000"
echo -e "  API Docs   →  http://localhost:8000/api/docs"
echo -e "  헬스체크   →  http://localhost:8000/api/health"
echo ""
