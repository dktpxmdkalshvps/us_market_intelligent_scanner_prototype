#!/usr/bin/env bash
# QuantScreen 로컬 개발 서버 실행 스크립트

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  QuantScreen – 로컬 개발 환경 시작${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 1. .env 파일 확인
if [ ! -f ".env" ]; then
  echo -e "${YELLOW}⚠  .env 파일이 없습니다. .env.example을 복사합니다...${NC}"
  cp .env.example .env
  echo -e "${GREEN}✓  .env 파일 생성 완료. 필요한 값을 입력하세요.${NC}"
fi

# 2. Python 가상환경 설정
if [ ! -d "venv" ]; then
  echo -e "${YELLOW}  Python 가상환경 생성 중...${NC}"
  python3.11 -m venv venv
fi

echo -e "${GREEN}✓  Python 가상환경 활성화${NC}"
source venv/bin/activate

echo -e "${GREEN}  백엔드 패키지 설치 중...${NC}"
pip install -q -r api/requirements.txt

# 3. Node.js 패키지 설치
echo -e "${GREEN}  프론트엔드 패키지 설치 중...${NC}"
npm install --legacy-peer-deps

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  서버 시작 (터미널 두 개를 사용하세요)${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${YELLOW}[터미널 1] 백엔드 (FastAPI):${NC}"
echo -e "  source venv/bin/activate"
echo -e "  uvicorn backend.main:app --reload --port 8000"
echo ""
echo -e "  ${YELLOW}[터미널 2] 프론트엔드 (Next.js):${NC}"
echo -e "  npm run dev"
echo ""
echo -e "  ${CYAN}접속 URL:${NC}"
echo -e "  Frontend → http://localhost:3000"
echo -e "  Backend  → http://localhost:8000/api/docs"
echo ""
