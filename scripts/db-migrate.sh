#!/bin/bash
#
# LIKEFOOD — DB-002: Migration Script
# Replaces `db push` with proper `prisma migrate` for production deployments.
#
# Usage:
#   Development: bash scripts/db-migrate.sh dev
#   Production:  bash scripts/db-migrate.sh deploy
#   Status:      bash scripts/db-migrate.sh status
#   Reset:       bash scripts/db-migrate.sh reset (DANGEROUS)
#

set -euo pipefail

COMMAND=${1:-"status"}

echo "===== LIKEFOOD Database Migration ====="
echo "Environment: ${NODE_ENV:-development}"
echo "Command: ${COMMAND}"
echo ""

case "$COMMAND" in
    dev)
        echo "[DEV] Creating migration from schema changes..."
        npx prisma migrate dev --name "${2:-auto_migration}"
        echo "✅ Migration created and applied"
        ;;

    deploy)
        echo "[DEPLOY] Applying pending migrations to production..."
        npx prisma migrate deploy
        echo "✅ All pending migrations applied"
        ;;

    status)
        echo "[STATUS] Checking migration status..."
        npx prisma migrate status
        ;;

    reset)
        if [ "${NODE_ENV}" = "production" ]; then
            echo "🔴 CANNOT reset migrations in production!"
            exit 1
        fi
        echo "⚠️ WARNING: This will reset the database and re-apply all migrations!"
        echo "Press Ctrl+C to cancel, or wait 5 seconds..."
        sleep 5
        npx prisma migrate reset
        echo "✅ Database reset and migrations re-applied"
        ;;

    diff)
        echo "[DIFF] Checking for schema drift..."
        npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma
        ;;

    *)
        echo "Usage: $0 {dev|deploy|status|reset|diff} [migration_name]"
        echo ""
        echo "Commands:"
        echo "  dev [name]  - Create and apply migration (development)"
        echo "  deploy      - Apply pending migrations (production)"
        echo "  status      - Show migration status"
        echo "  reset       - Reset DB and re-apply migrations (dev only)"
        echo "  diff        - Check for schema drift"
        exit 1
        ;;
esac

echo ""
echo "===== Done ====="
