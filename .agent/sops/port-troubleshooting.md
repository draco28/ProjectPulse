# SOP: Port Configuration Troubleshooting

## Purpose

Prevent and fix the critical mistake where Next.js dev server runs on the wrong port (3002 instead of 3000), causing localhost:3000 to show the default Next.js page instead of the application.

## When to Use

- **Before starting ANY web development work** (verification step)
- localhost:3000 shows default Next.js welcome page
- After running `pnpm dev` server starts on unexpected port
- When encountering "application not loading" issues

## The Problem

**Symptom**: Browser shows Next.js default welcome page at localhost:3000

**Common Mistake**: Assuming code is broken and making unnecessary changes

**Actual Cause**: Dev server running on port 3002, while port 3000 has old/cached server

**Critical Impact**: Wastes hours debugging "broken" code that's actually fine

---

## CRITICAL: Pre-Work Verification

**⚠️ ALWAYS DO THIS BEFORE CODING:**

### Step 1: Start Dev Server

```bash
pnpm dev
```

### Step 2: READ the Terminal Output

Look for this specific line:

```
✅ CORRECT: "ready started server on 0.0.0.0:3000, url: http://localhost:3000"
❌ WRONG:   "ready started server on 0.0.0.0:3002, url: http://localhost:3002"
```

**Critical Rule**: **ALWAYS read this line!** Don't ignore terminal output.

### Step 3: Verify Application Loads

```bash
# Open browser to localhost:3000
# Should see: Your actual application (Issues page, etc.)
# Should NOT see: Default Next.js welcome page
```

### Step 4: Only Then Start Coding

If Steps 1-3 pass → Safe to code

If any step fails → **FIX PORT FIRST**, then code

---

## Troubleshooting Procedure

**If dev server is on wrong port (3002):**

### Step 1: Find Configuration Problem

Check these files in order:

```bash
# Windows:
type .env.local | findstr PORT
type .env | findstr PORT
findstr /n "port PORT" next.config.js

# Mac/Linux:
cat .env.local | grep PORT
cat .env | grep PORT
grep -n "port\|PORT" next.config.js
```

**Look for**:

- `PORT=3002` in .env.local or .env
- Custom port configuration in next.config.js

### Step 2: Fix the Configuration

**Option A: Remove PORT from .env.local** (Most Common)

```bash
# Edit .env.local and DELETE this line:
PORT=3002  # ❌ Remove this entire line
```

**Option B: Fix next.config.js** (If issue is there)

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove or fix any port configuration
  // Should default to 3000
};

module.exports = nextConfig;
```

### Step 3: Kill All Node Processes

**Critical**: Old dev servers may still be running

**Windows:**

```powershell
# Option 1: Task Manager
# Find node.exe processes and end them

# Option 2: Command line
taskkill /F /IM node.exe

# Option 3: Kill specific port
netstat -ano | findstr :3000
taskkill /PID [PID] /F
```

**Mac/Linux:**

```bash
# Kill all node processes
pkill -f "next dev"

# Or find and kill specific port
lsof -i :3000
kill [PID]

# Nuclear option (kills all node)
killall node
```

### Step 4: Restart Dev Server

```bash
pnpm dev
```

**Verify output**:

```
✅ "ready started server on 0.0.0.0:3000, url: http://localhost:3000"
```

### Step 5: Verify in Browser

1. Open `http://localhost:3000`
2. Should see **your application** (not default Next.js page)
3. Check that routes work (e.g., /issues, /knowledge-base)

---

## Verification Checklist

After fixing, confirm:

- [ ] `pnpm dev` terminal shows "started server on 0.0.0.0:**3000**"
- [ ] `http://localhost:3000` shows your actual application
- [ ] No `PORT` variable in `.env.local` (unless intentionally set to 3000)
- [ ] `next.config.js` has no conflicting port config
- [ ] Application routes work correctly (not 404s)
- [ ] Can see custom pages/components (Issues page, etc.)

---

## Prevention Strategy

### Add to Pre-Work Routine

**Before every coding session:**

```markdown
## Daily Pre-Work Checklist

1. [ ] Run `pnpm dev`
2. [ ] Verify terminal shows port 3000
3. [ ] Verify localhost:3000 loads application
4. [ ] Verify on correct git branch
5. [ ] THEN start coding
```

### Add Warning Comment

Add to `.env.local`:

```bash
# WARNING: Do NOT set PORT=3002
# Dev server MUST run on port 3000
# See: .agent/sops/port-troubleshooting.md
```

### Git Hook (Optional)

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# Check for PORT configuration
if grep -q "PORT=3002" .env.local 2>/dev/null; then
    echo "❌ ERROR: .env.local contains PORT=3002"
    echo "Remove this line before committing"
    echo "See: .agent/sops/port-troubleshooting.md"
    exit 1
fi
```

---

## Advanced Troubleshooting

### Issue: Port 3000 Already in Use

**Symptom**: Error "Port 3000 is already in use"

**Cause**: Another process using port 3000

**Solution**:

**Windows:**

```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Output shows PID in last column
# Kill it:
taskkill /PID [PID] /F
```

**Mac/Linux:**

```bash
# Find process
lsof -i :3000

# Kill it
kill [PID]

# Or combined
lsof -ti:3000 | xargs kill -9
```

### Issue: Still Shows Default Page After Fix

**Symptom**: Port correct but still seeing Next.js default page

**Possible Causes**:

1. **Browser Cache**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Clear browser cache
   - Try incognito/private window

2. **Service Worker**
   - Open DevTools → Application → Service Workers
   - Unregister all service workers
   - Reload page

3. **Wrong Directory**
   - Verify you're in correct project directory
   - Check `package.json` is for Moksha DevHub

4. **Build Cache**
   ```bash
   # Clear Next.js cache
   rm -rf .next
   pnpm dev
   ```

### Issue: Configuration Keeps Resetting

**Symptom**: `PORT=3002` keeps coming back to `.env.local`

**Possible Causes**:

1. **Template File**: Check for `.env.template` or `.env.example`

   ```bash
   # Make sure these don't have PORT=3002
   cat .env.template
   cat .env.example
   ```

2. **Setup Script**: Check `package.json` scripts

   ```json
   {
     "scripts": {
       "setup": "..." // May be copying wrong config
     }
   }
   ```

3. **IDE Configuration**: Check if IDE is auto-generating config
   - VS Code: Check `.vscode/settings.json`
   - WebStorm: Check `.idea/` folder

---

## Real-World Example

**Scenario**: Developer reported "Issues page shows default Next.js page, code must be broken"

**Investigation**:

1. ✅ Checked `http://localhost:3000` → Default Next.js page showing
2. ✅ Checked terminal → Dev server on port **3002**
3. ✅ Checked `.env.local` → Found `PORT=3002`
4. ✅ Checked `http://localhost:3002` → Issues page working fine!

**Root Cause**: Developer accidentally set `PORT=3002` in `.env.local`

**Fix**:

1. Removed `PORT=3002` from `.env.local`
2. Killed all node processes: `pkill -f node`
3. Restarted dev server: `pnpm dev`
4. Verified terminal: "started server on 0.0.0.0:**3000**"
5. Verified browser: localhost:3000 now shows Issues page

**Time Wasted**: 2 hours debugging "broken code"
**Actual Issue**: 30-second config fix

**Lesson**: **ALWAYS check which port dev server is actually running on!**

---

## Quick Reference

### Check Current Port

```bash
pnpm dev
# Look for: "ready started server on 0.0.0.0:[PORT]"
```

### Fix Wrong Port

```bash
# 1. Remove from .env.local
# Edit .env.local, delete: PORT=3002

# 2. Kill processes
pkill -f "next dev"  # Mac/Linux
taskkill /F /IM node.exe  # Windows

# 3. Restart
pnpm dev

# 4. Verify port 3000 in terminal
```

### Verify Application

```bash
# Open http://localhost:3000
# Should see: Your application
# Should NOT see: Default Next.js page
```

---

## Related Documentation

- [CRITICAL_MISTAKES.md](../../.claude/CRITICAL_MISTAKES.md) - Complete prevention guide
- [WORKFLOW_ARCHITECTURE.md](../../docs/WORKFLOW_ARCHITECTURE.md) - Development workflow
- [Next.js CLI Documentation](https://nextjs.org/docs/api-reference/cli)

## Golden Rule

> **BEFORE ANY CODE CHANGES:**
>
> 1. Run `pnpm dev`
> 2. READ the terminal output
> 3. Verify "started server on 0.0.0.0:**3000**"
> 4. Verify localhost:3000 loads your app
> 5. **ONLY THEN** start coding

**If localhost:3000 shows wrong content:**

- ❌ DON'T assume code is broken
- ✅ CHECK which port dev server is on
- ✅ FIX port configuration first
- ✅ THEN investigate code (if still broken)

---

**Last Updated**: 2025-10-26
**Priority**: CRITICAL - Check BEFORE every coding session
**Created From**: Port configuration debugging incident + CLAUDE.md golden rules
