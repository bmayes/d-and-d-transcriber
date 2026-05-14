#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

if [ ! -f ".installed" ]; then
    echo -e "${RED}Run ./install.sh first.${NC}"
    exit 1
fi

if [ ! -d ".venv" ]; then
    echo -e "${RED}Python venv missing — run ./install.sh to reinstall.${NC}"
    exit 1
fi

if [ ! -d "fe/node_modules" ]; then
    echo -e "${RED}Node modules missing — run ./install.sh to reinstall.${NC}"
    exit 1
fi

cleanup() {
    echo ""
    echo "Shutting down..."
    kill "$BE_PID" "$FE_PID" 2>/dev/null || true
    wait "$BE_PID" "$FE_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "Starting backend..."
.venv/bin/python -m uvicorn api.main:app --host 0.0.0.0 --port 16767 &
BE_PID=$!

echo "Starting frontend..."
cd fe && pnpm dev &
FE_PID=$!

echo ""
echo -e "${GREEN}App running at http://localhost:3000${NC}"
echo "Press Ctrl+C to stop."
echo ""

wait "$BE_PID" "$FE_PID"
