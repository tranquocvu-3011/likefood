#!/usr/bin/env bash
# LIKEFOOD - Vietnamese Specialty Marketplace
# Copyright (c) 2026 LIKEFOOD Team
# Licensed under the MIT License
# https://github.com/tranquocvu-3011/likefood
# ============================================================
# LIKEFOOD — VPS Deploy Script
# Usage:
#   ./scripts/deploy.sh           # full deploy
#   ./scripts/deploy.sh --no-build  # skip build (quick redeploy)
# ============================================================
set -euo pipefail

SKIP_BUILD=false
for arg in "$@"; do
  [[ "$arg" == "--no-build" ]] && SKIP_BUILD=true
done

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$APP_DIR/logs"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

echo "[$TIMESTAMP] 🚀 Starting deploy..."
cd "$APP_DIR"

# ─── 1. Pull latest code ────────────────────────────────────
echo "📥 Pulling latest code..."
git pull origin main

# ─── 2. Install dependencies ────────────────────────────────
echo "📦 Installing dependencies..."
npm ci --omit=dev

# ─── 3. Generate Prisma client ──────────────────────────────
echo "⚙️  Generating Prisma client..."
npx prisma generate

# ─── 4. Run database migrations ─────────────────────────────
echo "🗄️  Running database migrations..."
npx prisma migrate deploy

# ─── 5. Build Next.js ────────────────────────────────────────
if [[ "$SKIP_BUILD" == false ]]; then
  echo "🔨 Building Next.js..."
  npm run build
else
  echo "⏩ Skipping build (--no-build flag set)"
fi

# ─── 6. Create log directory ────────────────────────────────
mkdir -p "$LOG_DIR"

# ─── 7. Restart PM2 ────────────────────────────────────────
echo "♻️  Restarting PM2..."
if pm2 list | grep -q "weblikefood"; then
  pm2 reload ecosystem.config.js --env production
else
  pm2 start ecosystem.config.js --env production
fi
pm2 save

echo ""
echo "✅ Deploy complete at $(date +"%Y-%m-%d %H:%M:%S")"
echo "   App running on: http://localhost:3000"
pm2 status weblikefood
