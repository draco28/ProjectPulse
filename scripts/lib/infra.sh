#!/bin/bash
# Infrastructure configuration for shell scripts
# Source this file: source scripts/lib/infra.sh
#
# Environment Variables:
#   PROJECTPULSE_ENV - Environment selector (dev, prod-local, prod-public, test, ci)
#   PROJECTPULSE_WEB_URL - Override web URL (no trailing slash)
#   PROJECTPULSE_MCP_URL - Override MCP server URL (no trailing slash)
#   PROJECTPULSE_DATABASE_URL - Override database connection string
#
# Legacy aliases are exported for backwards compatibility:
#   BASE_URL, MCP_URL, DATABASE_URL

set -e

# Default to dev environment
PROJECTPULSE_ENV="${PROJECTPULSE_ENV:-dev}"

case "$PROJECTPULSE_ENV" in
  dev)
    export PROJECTPULSE_WEB_URL="${PROJECTPULSE_WEB_URL:-http://localhost:3000}"
    export PROJECTPULSE_MCP_URL="${PROJECTPULSE_MCP_URL:-http://localhost:3001}"
    export PROJECTPULSE_DATABASE_URL="${PROJECTPULSE_DATABASE_URL:-postgresql://postgres:postgres123@localhost:5432/projectpulse_dev}"
    ;;
  prod-local)
    export PROJECTPULSE_WEB_URL="${PROJECTPULSE_WEB_URL:-http://localhost:8080}"
    export PROJECTPULSE_MCP_URL="${PROJECTPULSE_MCP_URL:-http://localhost:8081}"
    if [ -z "$PROJECTPULSE_DATABASE_URL" ] && [ -z "$DATABASE_URL" ]; then
      echo "ERROR: PROJECTPULSE_DATABASE_URL or DATABASE_URL must be set for prod-local"
      exit 1
    fi
    export PROJECTPULSE_DATABASE_URL="${PROJECTPULSE_DATABASE_URL:-$DATABASE_URL}"
    ;;
  prod-public)
    export PROJECTPULSE_WEB_URL="${PROJECTPULSE_WEB_URL:-https://projectpulse.dracodev.dev}"
    export PROJECTPULSE_MCP_URL="${PROJECTPULSE_MCP_URL:-https://projectpulsemcp.dracodev.dev}"
    # Database URL must be provided for prod-public
    if [ -z "$PROJECTPULSE_DATABASE_URL" ] && [ -z "$DATABASE_URL" ]; then
      echo "ERROR: PROJECTPULSE_DATABASE_URL or DATABASE_URL must be set for prod-public"
      exit 1
    fi
    export PROJECTPULSE_DATABASE_URL="${PROJECTPULSE_DATABASE_URL:-$DATABASE_URL}"
    ;;
  test|ci)
    export PROJECTPULSE_WEB_URL="${PROJECTPULSE_WEB_URL:-http://localhost:3000}"
    export PROJECTPULSE_MCP_URL="${PROJECTPULSE_MCP_URL:-http://localhost:3001}"
    export PROJECTPULSE_DATABASE_URL="${PROJECTPULSE_DATABASE_URL:-postgresql://postgres:postgres123@localhost:5432/projectpulse_test}"
    ;;
  *)
    echo "ERROR: Unknown PROJECTPULSE_ENV: $PROJECTPULSE_ENV"
    echo "Valid values: dev, prod-local, prod-public, test, ci"
    exit 1
    ;;
esac

# Legacy compatibility - export aliases
export BASE_URL="$PROJECTPULSE_WEB_URL"
export MCP_URL="$PROJECTPULSE_MCP_URL"
export DATABASE_URL="$PROJECTPULSE_DATABASE_URL"

# Export the environment for child processes
export PROJECTPULSE_ENV

# Helper function: Check web app health
infra_health_check() {
  local url="${1:-$PROJECTPULSE_WEB_URL}"
  echo "Checking $url/api/health..."
  if curl -sf "$url/api/health" >/dev/null 2>&1; then
    echo "✅ Health check passed"
    return 0
  else
    echo "❌ Health check failed for $url/api/health"
    return 1
  fi
}

# Helper function: Wait for service to be ready
infra_wait_for_service() {
  local url="${1:-$PROJECTPULSE_WEB_URL/api/health}"
  local max_attempts="${2:-30}"
  local delay="${3:-2}"
  local attempt=1

  echo "Waiting for $url to be ready..."
  while [ $attempt -le $max_attempts ]; do
    if curl -sf "$url" >/dev/null 2>&1; then
      echo "✅ Service ready after $attempt attempts"
      return 0
    fi
    echo "  Attempt $attempt/$max_attempts - waiting ${delay}s..."
    sleep "$delay"
    attempt=$((attempt + 1))
  done

  echo "❌ Service not ready after $max_attempts attempts"
  return 1
}

# Print current configuration (useful for debugging)
infra_show_config() {
  echo "ProjectPulse Infrastructure Configuration"
  echo "=========================================="
  echo "PROJECTPULSE_ENV:          $PROJECTPULSE_ENV"
  echo "PROJECTPULSE_WEB_URL:      $PROJECTPULSE_WEB_URL"
  echo "PROJECTPULSE_MCP_URL:      $PROJECTPULSE_MCP_URL"
  echo "PROJECTPULSE_DATABASE_URL: ${PROJECTPULSE_DATABASE_URL:0:50}..."
  echo ""
  echo "Legacy Aliases:"
  echo "  BASE_URL:     $BASE_URL"
  echo "  MCP_URL:      $MCP_URL"
  echo "  DATABASE_URL: ${DATABASE_URL:0:50}..."
}
