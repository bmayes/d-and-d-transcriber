#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ok()   { echo -e "${GREEN}  ✓ $1${NC}"; }
warn() { echo -e "${YELLOW}  ! $1${NC}"; }
fail() { echo -e "${RED}  ✗ $1${NC}"; exit 1; }

echo "Checking prerequisites..."

# Apple Silicon
if [[ "$(uname -m)" != "arm64" ]]; then
    fail "Apple Silicon required — mlx-whisper only runs on M1/M2/M3 Macs."
fi
ok "Apple Silicon"

# Python 3.11+
if ! command -v python3 &>/dev/null; then
    fail "Python 3 not found. Install with: brew install python@3.11"
fi
PYTHON_MINOR=$(python3 -c "import sys; print(sys.version_info.minor)")
PYTHON_MAJOR=$(python3 -c "import sys; print(sys.version_info.major)")
if [[ "$PYTHON_MAJOR" -lt 3 || "$PYTHON_MINOR" -lt 11 ]]; then
    fail "Python 3.11+ required (found $(python3 --version)). Install with: brew install python@3.11"
fi
ok "Python $(python3 --version | awk '{print $2}')"

# Node.js
if ! command -v node &>/dev/null; then
    fail "Node.js not found. Install with: brew install node"
fi
ok "Node.js $(node --version)"

# pnpm
if ! command -v pnpm &>/dev/null; then
    fail "pnpm not found. Install with: npm install -g pnpm"
fi
ok "pnpm $(pnpm --version)"

# ffmpeg
if ! command -v ffmpeg &>/dev/null; then
    fail "ffmpeg not found. Install with: brew install ffmpeg"
fi
ok "ffmpeg"

echo ""
echo "Setting up Python environment..."
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi
.venv/bin/pip install -q --upgrade pip
.venv/bin/pip install -r requirements.txt
ok "Python dependencies installed"

echo ""
echo "Setting up frontend..."
cd fe && pnpm install --frozen-lockfile
cd ..
ok "Node dependencies installed"

touch .installed
echo ""
echo -e "${GREEN}Setup complete. Run ./run.sh to start the app.${NC}"
