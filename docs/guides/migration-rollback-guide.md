# Migration & Rollback Guide

Audience: DevOps, deployment engineers

Last Updated: 2025-11-09

---

## Overview

ProjectPulse MCP server supports three implementation paths:
- Path A: Dual-mode (traditional + code execution)
- Path B: Traditional only
- Path C: Hybrid (simple=traditional, complex=code-exec)

This guide covers migrating between paths and rollback procedures.

---

## Path Selection Decision Tree

```
Week 5 POC Results ↓
┌───────────────────┐
│ Code Execution    │
│ Works?            │
└───────┬───────────┘
        │
   ┌────┴────┐
   │         │
  YES       NO
   │         │
   ↓         ↓
Path A     Path B
(Dual)     (Trad)
   │
   │ Partial?
   ↓
Path C (Hybrid)
```

Decision Criteria: See Week 5 checkpoint in design doc

---

## Migration Scenarios

### Scenario 1: Path B → Path A (Add Code Execution)

Trigger: Sprint 3 ready to add code execution mode

Steps:

1) Verify Prerequisites

```bash
node --version         # need 18+
pnpm add isolated-vm   # or vm2
node -e "require('isolated-vm') && console.log('OK')"
```

2) Create Code Execution Wrappers

```bash
mkdir -p servers/projectpulse/{issues,knowledge,projects}
node scripts/generate-wrappers.js
```

3) Update Server Configuration

```ts
const server = new MCPServer({
  capabilities: { tools: true, codeExecution: true },
});
```

4) Deploy with Feature Flag

```bash
PP_MCP_MODE=auto npm start
# or gradual rollout
PP_MCP_MODE=traditional
PP_MCP_MODE_BETA_USERS=code-exec
```

5) Test Parity

```bash
npm run test:parity
```

6) Monitor

```bash
tail -f logs/token-usage.log
```

7) Full Rollout → `PP_MCP_MODE=auto`

Rollback: See below

---

### Scenario 2: Path A → Path C (Downgrade to Hybrid)

Trigger: Code execution has issues, keep for specific tools only

Steps:

```ts
// config/code-exec-tools.ts
export const CODE_EXEC_TOOLS = ['search-knowledge', 'semantic-search'];
export const TRADITIONAL_TOOLS = ['create-issue', 'update-issue'];

function shouldUseCodeExec(tool: string) {
  return CODE_EXEC_TOOLS.includes(tool);
}
```

Deploy:

```bash
PP_MCP_MODE=hybrid npm start
```

Rollback: `PP_MCP_MODE=traditional`

---

### Scenario 3: Path A → Path B (Remove Code Execution)

Trigger: Code execution causing issues, revert to traditional

Immediate Rollback (Emergency):

```bash
export PP_MCP_MODE=traditional
pkill -9 -f "node.*server.js"
npm start &
```

Recovery Time: <1 minute

Gradual Rollback (Planned):

```bash
export PP_MCP_MODE=traditional
# existing code-exec sessions continue
# wait for session expiry (~1 hour)
```

Verify Rollback:

```bash
grep "Client mode" logs/server.log
```

Remove Code Execution Code (Optional):

```bash
rm -rf servers/projectpulse/
pnpm remove isolated-vm
```

---

## Configuration Management

Environment Variables

```bash
PP_MCP_MODE=auto              # Default: auto-detect
PP_FALLBACK_MODE=traditional  # Fallback if detect fails
PP_PROBE_TIMEOUT=1000         # Probe timeout (ms)
PP_SANDBOX_TIMEOUT=500        # Code exec timeout (ms)
PP_SANDBOX_MEMORY=256         # Memory limit (MB)
```

Runtime Mode Switching

- Recommended: New sessions pick up new mode

```ts
process.on('SIGUSR1', async () => {
  console.log('Reloading configuration...');
  await server.gracefulShutdown();
  loadEnvironment();
  await server.start();
});
```

---

## Database Migrations

Good News: No database changes between paths; same Prisma schema.

---

## Health Checks

Pre-Migration Checklist

```bash
npm run backup:db
git tag pre-migration-$(date +%Y%m%d)
npm run health:check
npm run test:all
```

Post-Migration Verification

```bash
curl http://localhost:3000/health
node dist/server.js <<< '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
npm run test:parity
npm run benchmark:tokens
```

---

## Monitoring & Alerts

Key Metrics

```
mcp_mode_selection{mode="traditional|code-exec"}
mcp_tool_calls{mode,tool}
mcp_tokens_used{mode}
mcp_errors{mode,error_type}
```

Alert Rules (examples)

```yaml
- alert: CodeExecModeFailureRate
  expr: rate(mcp_errors{mode="code-exec"}[5m]) > 0.1
  annotations:
    summary: "Code execution mode failing >10%"
    action: "Consider rollback to traditional"
```

---

## Emergency Procedures

Emergency Rollback (All Modes → Traditional)

```bash
#!/bin/bash
# emergency-rollback.sh
export PP_MCP_MODE=traditional
pkill -9 -f "node.*server.js"
npm start &
sleep 2
curl http://localhost:3000/health
```

Run: `bash scripts/emergency-rollback.sh`

---

Document Version: 1.0 (Week 5)
Next Update: After first production migration
