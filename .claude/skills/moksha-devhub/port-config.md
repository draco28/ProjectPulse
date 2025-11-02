---
name: moksha-port-config
description: Fix dev server port 3000 issues for ProjectPulse. Use when port 3002 is showing instead of 3000, or localhost not working.
triggers:
  [
    'port 3000',
    'port 3002',
    'port configuration',
    'localhost not working',
    'dev server',
    'pnpm dev',
  ]
token_estimate: 150
last_updated: 2025-10-26
related_docs:
  - ../../.agent/sops/port-troubleshooting.md
---

# Port Configuration Quick Fix

## The Problem

**Expected**: `pnpm dev` shows `ready started server on 0.0.0.0:3000`
**Wrong**: `ready started server on 0.0.0.0:3002`

**Impact**: Application doesn't load at localhost:3000

## Quick Fix (90% of cases)

**Step 1: Check package.json**

```json
{
  "scripts": {
    "dev": "next dev -p 3000" // ✅ Correct
    // NOT: "dev": "next dev"   ❌ Wrong (uses default 3000 but can be overridden)
  }
}
```

**Step 2: Remove PORT from .env.local**

```bash
# If .env.local exists, remove this line:
# PORT=3002  ❌ Remove this
```

**Step 3: Kill stray processes**

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

**Step 4: Restart dev server**

```bash
pnpm dev
# Should show: ready started server on 0.0.0.0:3000
```

## Verification

```bash
# Open browser
http://localhost:3000
# Should load the application
```

## If Still Failing

**Check:**

1. Is Docker running? (`docker ps`)
2. Is database accessible? (`psql -h localhost -U postgres -d moksha_devhub`)
3. Environment variables correct? (check `.env`)

**See full guide**: [.agent/sops/port-troubleshooting.md](../../.agent/sops/port-troubleshooting.md)

## Common Scenarios

**Scenario 1: Port 3002 after git pull**

- Someone committed wrong port config
- Fix: Update package.json, commit fix

**Scenario 2: PORT in .env.local**

- Local override taking precedence
- Fix: Remove PORT from .env.local

**Scenario 3: Process still running**

- Previous dev server didn't stop
- Fix: Kill process, restart

---

**Token Cost**: ~150 tokens
**When to Load**: Port issues, dev server problems
