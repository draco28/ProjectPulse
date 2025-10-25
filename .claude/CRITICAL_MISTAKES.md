# CRITICAL MISTAKES AND CORRECTIONS

**Purpose:** Document catastrophic mistakes that Claude Code has made to prevent repetition.

**Last Updated:** October 26, 2025

---

## 🚨 GOLDEN RULE VIOLATIONS

### **MISTAKE #1: Running Web App on Wrong Port (PORT 3002 DISASTER)**

**Date First Occurred:** October 26, 2025
**Severity:** 🔴 CRITICAL - Wastes hours of development time

#### What Happened:
1. Claude ran `pnpm dev` with environment or configuration pointing to port 3002
2. This caused the Next.js app to start on port 3002 instead of default 3000
3. When user navigated to localhost:3000, they saw the default Next.js welcome page
4. Claude misdiagnosed this as "the app not loading properly"
5. Claude made extensive unnecessary changes to "fix" a problem that didn't exist
6. User wasted time and lost work due to these incorrect changes

#### Root Cause:
- **NOT checking which port the dev server actually started on**
- **NOT verifying localhost:3000 shows correct content BEFORE making changes**
- **Assuming the problem is in the code when it's in the port configuration**

#### The CORRECT Process:

**BEFORE running `pnpm dev`:**
```bash
# 1. Check package.json scripts
cat package.json | grep "\"dev\""
# Should show: "dev": "next dev" (uses default port 3000)

# 2. Check for .env or .env.local overrides
cat .env.local 2>/dev/null | grep PORT
# Should be empty or PORT=3000

# 3. Check next.config.js for port config
cat next.config.js | grep -i port
# Should NOT have custom port
```

**WHEN running `pnpm dev`:**
```bash
pnpm dev

# READ THE OUTPUT CAREFULLY:
# ✅ CORRECT: "ready started server on 0.0.0.0:3000"
# ❌ WRONG: "ready started server on 0.0.0.0:3002"
```

**IF you see port 3002 (or any port other than 3000):**
```bash
# STOP IMMEDIATELY
# Do NOT proceed with testing
# Do NOT make code changes

# 1. Find the cause:
grep -r "3002" .env.local .env next.config.js package.json
grep -r "PORT.*3002" .

# 2. Fix the configuration:
# Remove PORT=3002 from .env.local if present
# Fix next.config.js if it has custom port
# Use turbo.json if monorepo setup is overriding

# 3. Restart dev server and VERIFY port 3000
pnpm dev
# Must see: "ready started server on 0.0.0.0:3000"
```

#### Prevention Checklist:

**BEFORE any web development session:**
- [ ] Verify `pnpm dev` starts on port 3000 (NOT 3002, 3001, etc.)
- [ ] Open localhost:3000 and confirm app loads correctly
- [ ] Check browser console for errors (if any)
- [ ] ONLY THEN proceed with changes

**WHEN something "doesn't work":**
- [ ] First check: Is the dev server running?
- [ ] Second check: Which port is it running on?
- [ ] Third check: Am I accessing the correct port in browser?
- [ ] Fourth check: Are there console errors?
- [ ] **LAST resort:** Assume code needs changes

#### How to Remember This:

**MANTRA:** "Port first, code second. Verify before diagnose."

**Visual Reminder:**
```
localhost:3000 shows default Next.js page?
    ↓
Is dev server on port 3000? ← CHECK THIS FIRST!
    ↓
NO (running on 3002)  →  Fix port config, restart
    ↓
YES (running on 3000) →  Now investigate code issues
```

---

## 📝 KNOWN MISTAKE PATTERNS

### Pattern: "Fix Before Verify"
- **Symptom:** Making code changes before verifying the actual problem
- **Solution:** Always verify assumptions first (port, env vars, build status)

### Pattern: "Cascading Fixes"
- **Symptom:** Making multiple changes to fix one problem you caused
- **Solution:** Stop, revert, identify root cause, make ONE targeted fix

### Pattern: "Configuration Blindness"
- **Symptom:** Ignoring environment variables, ports, configs
- **Solution:** Check package.json, .env, next.config.js FIRST

---

## ✅ CORRECTION PROCESS

If you realize you've made a critical mistake:

1. **STOP IMMEDIATELY** - Don't make more changes
2. **ADMIT THE MISTAKE** - Tell user clearly what you did wrong
3. **REVERT CHANGES** - Use git to restore to before the mistake
4. **FIX ROOT CAUSE** - Address the actual problem (e.g., port config)
5. **VERIFY FIX** - Confirm the fix works before proceeding
6. **DOCUMENT** - Add to this file if it's a new pattern

---

## 🎯 HOW TO USE THIS DOCUMENT

**At Session Start:**
- Read this file to refresh on critical mistakes
- Check for any patterns relevant to current task

**During Development:**
- Reference this file when something seems wrong
- Use checklists before making changes

**After Making a Major Mistake:**
- Document it here immediately
- Include date, root cause, and prevention steps

---

**Last Major Mistake:** Port 3002 disaster (October 26, 2025)
**Times This Has Occurred:** Multiple sessions
**Status:** DOCUMENTED - Must not happen again
