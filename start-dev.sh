#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

echo "=================================================="
echo "       Gazetteer - Starting Development Server    "
echo "=================================================="
echo ""

if ! command -v npm >/dev/null 2>&1; then
    echo "[!] Error: npm is not installed." >&2
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "[!] node_modules not found. Installing dependencies..."
    npm install
fi

PORT="${PORT:-3000}"
URL="http://localhost:$PORT"

echo "[+] Starting Next.js dev server on port $PORT..."
echo "[+] URL: $URL"
echo "Press Ctrl+C to stop the server."
echo ""

if [ "$PORT" = "3000" ]; then
    npm run dev
else
    npx next dev -p "$PORT"
fi
