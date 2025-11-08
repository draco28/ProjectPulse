#!/usr/bin/env bash
set -euo pipefail

# ProjectPulse — WSL helper to start the Next.js dev server
# - Installs Linux-specific dependencies if needed (e.g., @next/swc-linux-x64-gnu)
# - Disables telemetry
# - Binds to 0.0.0.0:3000 so Windows can access http://localhost:3000

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WEB_DIR="$ROOT_DIR/apps/web"

cd "$WEB_DIR"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "Error: pnpm not found in PATH. Install pnpm in WSL (e.g. via corepack)." >&2
  exit 1
fi

# Ensure Linux-native optional deps (like Next SWC) are present
echo "[dev] Installing dependencies (ensures Linux SWC binary is available)..."
pnpm install

# Disable Next telemetry for non-interactive output
export NEXT_TELEMETRY_DISABLED=1

HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-3000}"

echo "[dev] Starting Next.js dev server on $HOST:$PORT"
echo "[dev] Open http://localhost:$PORT in Windows"

# Run in foreground so you can stop with Ctrl+C; logs stream to console
HOST="$HOST" PORT="$PORT" pnpm dev

