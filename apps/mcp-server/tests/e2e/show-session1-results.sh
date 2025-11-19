#!/bin/bash
# Show complete Session 1 E2E test results

echo "=== RUNNING SESSION 1 E2E TEST WITH FULL OUTPUT ==="
echo ""

# Clean up first
DATABASE_URL="postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev" \
  npx tsx apps/mcp-server/tests/e2e/setup/cleanup-test-data.ts

echo ""
echo "=== COMPLETE TEST EXECUTION ==="
echo ""

# Run test with full output
npx tsx apps/mcp-server/tests/e2e/onboarding/session1-strategic-planning.test.ts 2>&1 | \
  grep -v "DEBUG Phase" | \
  head -200

echo ""
echo "=== QUERYING DATABASE FOR STORED DATA ==="
echo ""

# Query the stored data via API
curl -s "http://192.168.1.15:3000/api/onboarding/blueprint?projectId=3" | jq -r '
  "PROJECT: " + (.executiveSummary.metadata.projectName // "Unknown"),
  "",
  "SESSION STATUS: " + .sessionStatus,
  "",
  "COMPLETED PHASES: " + (.planningAnswers | keys | join(", ")),
  "",
  "SAMPLE ANSWERS:",
  (.planningAnswers.phase1 | to_entries[0:2] | .[] | "  " + .key + ": " + (.value | tostring | .[0:100]) + "..."),
  "",
  "EXECUTIVE SUMMARY (first 500 chars):",
  (.executiveSummary.executiveSummary[0:500] + "...")
'
