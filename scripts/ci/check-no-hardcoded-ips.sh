#!/bin/bash
# CI Guardrail: Check for hardcoded IPs in active code paths
#
# This script prevents regression by failing CI if hardcoded LAN IPs
# (192.168.1.15) are found in active code paths.
#
# Excluded:
# - docs/archive/** (archived documentation)
# - docs/bug-reports/** (bug reproduction files)
# - docs/tests/** (test documentation)
# - node_modules/** (dependencies)
# - dist/** (build outputs)
# - .next/** (Next.js build cache)
# - *.md files in test directories (test documentation)
#
# Usage:
#   ./scripts/ci/check-no-hardcoded-ips.sh
#   Exit code 0 = pass, 1 = fail

set -e

cd "$(dirname "$0")/../.."

echo "Checking for hardcoded IPs in active code paths..."

# Search for hardcoded LAN IP in source files
MATCHES=$(grep -rn "192\.168\.1\.15" \
  --include="*.ts" \
  --include="*.tsx" \
  --include="*.js" \
  --include="*.jsx" \
  --include="*.sh" \
  --exclude-dir=node_modules \
  --exclude-dir=dist \
  --exclude-dir=.next \
  --exclude-dir=docs/archive \
  --exclude-dir=docs/bug-reports \
  --exclude-dir=docs/tests \
  --exclude-dir=.claude \
  --exclude-dir=.agent/task \
  . 2>/dev/null || true)

# Filter out allowed exceptions (documentation files in test directories)
FILTERED_MATCHES=""
while IFS= read -r line; do
  # Skip empty lines
  [ -z "$line" ] && continue

  # Skip markdown files (documentation)
  case "$line" in
    *.md:*) continue ;;
  esac

  # Skip explicitly archived files and .agent/task directory
  case "$line" in
    *ARCHIVED*) continue ;;
    *archive*) continue ;;
    *.agent/task/*) continue ;;
  esac

  # Skip the CI script itself (this file)
  case "$line" in
    *check-no-hardcoded-ips.sh*) continue ;;
  esac

  # Skip test mock files and test assertion files
  case "$line" in
    *__tests__*) continue ;;
    *__mocks__*) continue ;;
  esac

  # Skip JSDoc/comment-only lines (documentation in source files)
  # These are lines that contain IP in comments, not actual code
  case "$line" in
    *" * "*) continue ;;  # JSDoc/multiline comment lines
    *"// "*) continue ;;  # Single-line comment that starts with //
  esac

  # Skip seed file documentation (example commands in comments)
  case "$line" in
    */prisma/seed*.ts:*" * "*) continue ;;
  esac

  FILTERED_MATCHES="${FILTERED_MATCHES}${line}\n"
done <<< "$MATCHES"

# Check if any matches remain
if [ -n "$FILTERED_MATCHES" ] && [ "$FILTERED_MATCHES" != "\n" ]; then
  echo ""
  echo "❌ ERROR: Hardcoded IP 192.168.1.15 found in active code:"
  echo ""
  echo -e "$FILTERED_MATCHES"
  echo ""
  echo "Resolution:"
  echo "  1. Import { getConfig } from '@projectpulse/infra-config'"
  echo "  2. Use infraConfig.webUrl, infraConfig.mcpUrl, or infraConfig.databaseUrl"
  echo "  3. For shell scripts, source scripts/lib/infra.sh"
  echo ""
  exit 1
fi

echo "✅ No hardcoded IPs found in active code paths."
exit 0
