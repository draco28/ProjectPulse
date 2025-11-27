#!/bin/bash
set -euo pipefail

PROJECT_ROOT="/Users/draco/projects/AI_HUB"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
REPORT_DIR="$PROJECT_ROOT/test-results/sprint-10-$TIMESTAMP"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Sprint 10 Test Runner - Checking Prerequisites"
echo "=================================================="

# 1. CHECK DATABASE
echo -n "Checking database (via docker)... "
if docker compose -f docker-compose.cloud.yml exec -T postgres pg_isready -U postgres >/dev/null; then
  echo -e "${GREEN}✓ Ready${NC}"
else
  echo -e "${RED}✗ Failed${NC}"
  exit 1
fi

# 2. CHECK API
echo -n "Checking Next.js API... "
if curl -sf http://localhost:3000/api/health >/dev/null; then
  echo -e "${GREEN}✓ Healthy${NC}"
else
  echo -e "${RED}✗ Not responding${NC}"
  exit 1
fi

# 3. CHECK DOCKER
echo -n "Checking Docker services... "
if docker compose -f docker-compose.cloud.yml ps nextjs | grep -q "Up"; then
  echo -e "${GREEN}✓ Running${NC}"
else
  echo -e "${RED}✗ Down${NC}"
  exit 1
fi

echo -e "\n${GREEN}✅ All prerequisites passed!${NC}\n"

# Create report directory
mkdir -p "$REPORT_DIR"

# 4. RUN MCP TESTS
echo "🧪 Running MCP E2E Tests (Node.js test runner)"
echo "=================================================="
cd "$PROJECT_ROOT/apps/mcp-server"
# Using || true to continue even if tests fail, so we can report it
# Using npx tsx to handle TypeScript files
npx tsx --test tests/e2e/ticket*.test.ts tests/e2e/issue-adapters.test.ts > "$REPORT_DIR/mcp-results.log" 2>&1 || true

# Parse TAP output
# grep -c returns exit code 1 if count is 0, but still prints 0. 
# We use cat to swallow the exit code and ensure we just get the output.
MCP_PASSED=$(grep -c "^# pass " "$REPORT_DIR/mcp-results.log" || true)
MCP_FAILED=$(grep -c "^# fail " "$REPORT_DIR/mcp-results.log" || true)
MCP_TOTAL=$((MCP_PASSED + MCP_FAILED))

echo -e "${GREEN}✓ MCP tests completed${NC}"
echo "  Passed: $MCP_PASSED"
echo "  Failed: $MCP_FAILED"
echo "  Total:  $MCP_TOTAL"
echo ""

# 5. RUN PLAYWRIGHT TESTS
echo "🎭 Running Playwright E2E Tests (5 browsers)"
echo "=================================================="
cd "$PROJECT_ROOT/apps/web"
# Run tests and capture output + JSON report
# Using || true to prevent script exit on test failure
npx playwright test --reporter=html,json --output="$REPORT_DIR" 2>&1 | tee "$REPORT_DIR/playwright.log" || true

# Parse Results
if [ -f "test-results.json" ]; then
  mv "test-results.json" "$REPORT_DIR/test-results.json"
fi

if command -v jq &> /dev/null && [ -f "$REPORT_DIR/test-results.json" ]; then
    PLAYWRIGHT_PASSED=$(jq '[.suites | .. | .tests? // [] | .[] | select(.status == "passed")] | length' "$REPORT_DIR/test-results.json")
    PLAYWRIGHT_FAILED=$(jq '[.suites | .. | .tests? // [] | .[] | select(.status != "passed")] | length' "$REPORT_DIR/test-results.json")
else
    # Fallback to parsing log
    PLAYWRIGHT_PASSED=$(grep -oE '[0-9]+ passed' "$REPORT_DIR/playwright.log" | head -n1 | awk '{print $1}' || echo 0)
    PLAYWRIGHT_FAILED=$(grep -oE '[0-9]+ failed' "$REPORT_DIR/playwright.log" | head -n1 | awk '{print $1}' || echo 0)
fi

PLAYWRIGHT_TOTAL=$((PLAYWRIGHT_PASSED + PLAYWRIGHT_FAILED))

echo -e "${GREEN}✓ Playwright tests completed${NC}"
echo "  Passed: $PLAYWRIGHT_PASSED"
echo "  Failed: $PLAYWRIGHT_FAILED"
echo "  Total:  $PLAYWRIGHT_TOTAL"
echo ""

# 6. GENERATE HTML REPORT
echo "📊 Generating Unified HTML Report"
echo "=================================================="

TOTAL=$((MCP_TOTAL + PLAYWRIGHT_TOTAL))
PASSED=$((MCP_PASSED + PLAYWRIGHT_PASSED))
FAILED=$((MCP_FAILED + PLAYWRIGHT_FAILED))

if [ $TOTAL -gt 0 ]; then
  PASS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED / $TOTAL) * 100}")
else
  PASS_RATE="0.0"
fi

cat > "$REPORT_DIR/index.html" <<EOF
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Sprint 10 Test Results - $TIMESTAMP</title>
  <style>
    body { font-family: system-ui; max-width: 1200px; margin: 40px auto; padding: 0 20px; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 30px 0; }
    .card { padding: 20px; border-radius: 8px; background: #f5f5f5; text-align: center; }
    .card h2 { margin: 0; font-size: 48px; }
    .card p { margin: 10px 0 0; color: #666; }
    .passed { background: #d4edda; color: #155724; }
    .failed { background: #f8d7da; color: #721c24; }
    table { width: 100%; border-collapse: collapse; margin: 30px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f5f5f5; }
    a { color: #007bff; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>🎯 Sprint 10: E2E Test Results</h1>
  <p>Generated: $TIMESTAMP</p>

  <div class="summary">
    <div class="card">
      <h2>$TOTAL</h2>
      <p>Total Tests</p>
    </div>
    <div class="card passed">
      <h2>$PASSED</h2>
      <p>Passed</p>
    </div>
    <div class="card failed">
      <h2>$FAILED</h2>
      <p>Failed</p>
    </div>
    <div class="card">
      <h2>${PASS_RATE}%</h2>
      <p>Pass Rate</p>
    </div>
  </div>

  <h2>Test Suite Breakdown</h2>
  <table>
    <tr>
      <th>Suite</th>
      <th>Passed</th>
      <th>Failed</th>
      <th>Total</th>
    </tr>
    <tr>
      <td>MCP Tests (Node.js)</td>
      <td>$MCP_PASSED</td>
      <td>$MCP_FAILED</td>
      <td>$MCP_TOTAL</td>
    </tr>
    <tr>
      <td>Playwright Tests (UI)</td>
      <td>$PLAYWRIGHT_PASSED</td>
      <td>$PLAYWRIGHT_FAILED</td>
      <td>$PLAYWRIGHT_TOTAL</td>
    </tr>
  </table>

  <h2>Detailed Reports</h2>
  <ul>
    <li><a href="mcp-results.log">MCP Test Log (TAP format)</a></li>
    <li><a href="index.html">Playwright HTML Report (Subfolder)</a></li>
  </ul>
  <p><i>Note: The Playwright HTML report is generated in the report directory. Open it separately if needed.</i></p>
</body>
</html>
EOF

echo -e "${GREEN}✓ HTML report generated: $REPORT_DIR/index.html${NC}"
echo ""

# 7. FINAL OUTPUT
echo "=================================================="
echo "🎯 Sprint 10 Test Execution Summary"
echo "=================================================="
echo ""
echo "Total Tests:   $TOTAL"
echo "Passed:        $PASSED"
echo "Failed:        $FAILED"
echo "Pass Rate:     ${PASS_RATE}%"
echo ""
echo "Reports saved to:"
echo "  $REPORT_DIR"
echo ""
echo "Open HTML report:"
echo "  open $REPORT_DIR/index.html"
echo ""

# Exit with appropriate code
if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
  exit 0
else
  echo -e "${YELLOW}⚠️  Some tests failed. Review reports above.${NC}"
  exit 1
fi
