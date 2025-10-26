---
name: port-config
description: Fix dev server port issues (3000 vs 3002)
category: troubleshooting
tokens: 150
triggers:
  - port 3000
  - port 3002
  - localhost not working
  - default next page
  - dev server wrong port
related_docs:
  - ../../.agent/sops/port-troubleshooting.md
---

# Port Configuration Quick Fix

## Symptom

localhost:3000 shows default Next.js page instead of your app

## Cause

Dev server running on port **3002**, not 3000

## Quick Fix

```bash
# 1. Check current port
pnpm dev
# Look for: "ready started server on 0.0.0.0:3002"  ❌

# 2. Remove PORT from .env.local
# Delete line: PORT=3002

# 3. Kill node processes
# Windows: taskkill /F /IM node.exe
# Mac/Linux: pkill -f "next dev"

# 4. Restart
pnpm dev
# Verify: "ready started server on 0.0.0.0:3000"  ✅
```

## Verification

- Terminal shows port **3000**
- localhost:3000 shows your actual app
- Routes work correctly

## Prevention

**ALWAYS before coding**: Run `pnpm dev` → Read terminal → Verify port 3000

## Full Guide

[.agent/sops/port-troubleshooting.md](../../.agent/sops/port-troubleshooting.md)
