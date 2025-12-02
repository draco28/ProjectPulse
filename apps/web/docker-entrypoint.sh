#!/bin/bash
set -e

# =============================================================================
# Docker Entrypoint Script for ProjectPulse Production
# =============================================================================
#
# This script runs Prisma migrations before starting the application.
# It ensures database schema is always up-to-date with the deployed code.
#
# How it works:
#   1. Runs `prisma migrate deploy` to apply pending migrations
#   2. If successful, starts the application (passed as CMD)
#   3. If migration fails, container fails to start (Dokploy shows failure)
#
# Environment Requirements:
#   - DATABASE_URL must be set (connection string to PostgreSQL)
#
# Usage in Dockerfile:
#   ENTRYPOINT ["./docker-entrypoint.sh"]
#   CMD ["node", "server.js"]
#
# =============================================================================

echo ""
echo "================================================================"
echo "  ProjectPulse Production Entrypoint"
echo "================================================================"
echo ""

# Verify DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL environment variable is not set!"
  echo "Migration cannot run without database connection."
  exit 1
fi

echo "Database URL: ${DATABASE_URL%%@*}@****(redacted)"
echo ""

# Run Prisma migrations
echo "Running Prisma migrations..."
echo "-----------------------------------------------------------------"

if npx prisma migrate deploy; then
  echo "-----------------------------------------------------------------"
  echo "Migrations complete."
  echo ""
else
  echo "-----------------------------------------------------------------"
  echo "ERROR: Migration failed!"
  echo ""
  echo "The container will not start. Check the logs above for details."
  echo ""
  echo "To fix:"
  echo "  1. Review the failing migration in prisma/migrations/"
  echo "  2. Fix the issue locally and test"
  echo "  3. Push fix to master and redeploy"
  echo ""
  echo "If you need to manually resolve:"
  echo "  prisma migrate resolve --applied <migration_name>"
  echo ""
  exit 1
fi

# Start the application (CMD passed from Dockerfile)
echo "================================================================"
echo "  Starting Application"
echo "================================================================"
echo ""

exec "$@"
